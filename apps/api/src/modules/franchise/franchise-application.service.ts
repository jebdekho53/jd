import { BadRequestException, Injectable, Logger, NotFoundException } from '@nestjs/common';
import {
  ExpansionLeadStatus,
  FranchiseAuditAction,
  FranchisePartnerStatus,
  Prisma,
  RoleName,
} from '@prisma/client';
import { PrismaService } from '../../database/prisma.service';
import { TerritoryService } from './territory.service';
import { ApproveExpansionLeadDto, RejectExpansionLeadDto, SubmitFranchiseApplicationDto } from './dto/franchise.dto';

/** Statuses in which a lead is still being worked — a repeat application is a no-op. */
const OPEN_LEAD_STATUSES = [
  ExpansionLeadStatus.NEW,
  ExpansionLeadStatus.CONTACTED,
  ExpansionLeadStatus.QUALIFIED,
];

const MAX_CODE_ATTEMPTS = 10;

@Injectable()
export class FranchiseApplicationService {
  private readonly logger = new Logger(FranchiseApplicationService.name);

  constructor(
    private readonly prisma: PrismaService,
    private readonly territory: TerritoryService,
  ) {}

  // ---------------------------------------------------------------------------
  // Public funnel
  // ---------------------------------------------------------------------------

  /**
   * Create a franchise application from the public (unauthenticated) form.
   *
   * Re-submitting from the same phone while an application is still open returns
   * the existing lead instead of creating a duplicate or erroring — someone who
   * double-taps the button, or applies again a week later because they heard
   * nothing, must not spawn a second lead or see a 500.
   *
   * Returns nothing about the applicant beyond their own submission, so the
   * endpoint cannot be used to probe whether a phone/city is already registered.
   */
  async submitApplication(dto: SubmitFranchiseApplicationDto) {
    const phone = dto.phone.trim();
    const email = dto.email?.trim() || null;

    // Someone who is ALREADY a franchise partner must not apply again — one account
    // can only hold one partnership, so the approval could never succeed anyway.
    // Note we deliberately do NOT reject merely-registered users: an existing buyer
    // or merchant is exactly the kind of person who takes a franchise, and approval
    // reuses their account. Only an existing *partnership* is a real blocker.
    const partnerUser = await this.prisma.user.findFirst({
      where: {
        franchisePartner: { isNot: null },
        OR: [{ phone }, ...(email ? [{ email }] : [])],
      },
      select: { id: true },
    });
    if (partnerUser) {
      throw new BadRequestException(
        'You are already registered as a JebDekho franchise partner. Please sign in instead.',
      );
    }

    const existing = await this.prisma.expansionLead.findFirst({
      where: { phone, status: { in: OPEN_LEAD_STATUSES } },
      orderBy: { createdAt: 'desc' },
    });
    if (existing) {
      return { id: existing.id, status: existing.status, duplicate: true };
    }

    const lead = await this.prisma.expansionLead.create({
      data: {
        name: dto.name.trim(),
        phone,
        email,
        city: dto.city.trim(),
        state: dto.state.trim(),
        pincodes: normalisePincodes(dto.pincodes ?? []),
        investmentCapacity: dto.investmentCapacity ?? null,
        notes: dto.notes?.trim() || null,
        status: ExpansionLeadStatus.NEW,
      },
    });

    return { id: lead.id, status: lead.status, duplicate: false };
  }

  // ---------------------------------------------------------------------------
  // Admin review
  // ---------------------------------------------------------------------------

  async listLeads(status?: ExpansionLeadStatus) {
    return this.prisma.expansionLead.findMany({
      where: status ? { status } : undefined,
      include: {
        convertedFranchise: { select: { id: true, businessName: true, referralCode: true } },
      },
      orderBy: { createdAt: 'desc' },
      take: 200,
    });
  }

  async previewConflicts(leadId: string, dto: ApproveExpansionLeadDto) {
    const lead = await this.prisma.expansionLead.findUnique({ where: { id: leadId } });
    if (!lead) throw new NotFoundException('Lead not found');
    const pincodes = normalisePincodes(dto.pincodes ?? lead.pincodes);
    return {
      pincodes,
      conflicts: await this.territory.previewConflicts(pincodes),
    };
  }

  /**
   * Approve a lead: create the User, grant the FRANCHISE role, create the
   * FranchisePartner (with a referral code) and assign the requested territory —
   * all in ONE transaction. A failure partway must never leave an orphaned user
   * holding a FRANCHISE role with no partner record behind it.
   *
   * Exclusivity conflicts on the requested pincodes are detected inside the same
   * transaction (via the existing TerritoryService logic) and returned to the
   * admin, rather than an overlapping territory being created silently.
   *
   * The referral code is chosen *before* the transaction and a collision retries
   * the whole thing: in Postgres a failed statement aborts the surrounding
   * transaction, so retrying a unique violation from inside it is not possible.
   */
  async approveLead(adminId: string, leadId: string, dto: ApproveExpansionLeadDto) {
    const lead = await this.prisma.expansionLead.findUnique({ where: { id: leadId } });
    if (!lead) throw new NotFoundException('Lead not found');
    if (lead.status === ExpansionLeadStatus.CONVERTED) {
      throw new BadRequestException('Lead has already been converted');
    }

    const pincodes = normalisePincodes(dto.pincodes ?? lead.pincodes);
    if (pincodes.length === 0) {
      throw new BadRequestException('At least one pincode is required to assign a territory');
    }

    const franchiseRole = await this.prisma.role.findUniqueOrThrow({
      where: { name: RoleName.FRANCHISE },
    });

    const businessName = dto.businessName?.trim() || lead.name;
    const cityId = dto.cityId ?? null;

    for (let attempt = 0; attempt < MAX_CODE_ATTEMPTS; attempt++) {
      const referralCode = await this.nextReferralCode(lead.city);

      try {
        return await this.prisma.$transaction(async (tx) => {
          // PHONE is the identity in this system: it is unique, required, and the
          // franchise portal signs in with a phone OTP. Email is optional and merely
          // decorative here — so we match on phone, never on email.
          //
          // The original bug: user.upsert({ where: { phone }, create: { phone, email } })
          // hit User.email's unique index whenever the applicant's email already sat on
          // some other account, and the whole approval died with "email already exists".
          // We must NOT fix that by reusing the account that owns the email — its phone
          // is a different number, so the partnership would land on a stranger's (often
          // a seeded/test) account and the real applicant could never log in.
          //
          // So: reuse the account only when the PHONE matches, and attach the email only
          // when nobody else holds it. A taken email simply isn't copied across.
          const emailIsFree = lead.email
            ? !(await tx.user.findUnique({ where: { email: lead.email }, select: { id: true } }))
            : false;

          let user = await tx.user.findUnique({ where: { phone: lead.phone } });

          if (user) {
            if (lead.email && emailIsFree && user.email !== lead.email) {
              user = await tx.user.update({
                where: { id: user.id },
                data: { email: lead.email },
              });
            }
          } else {
            user = await tx.user.create({
              data: { phone: lead.phone, email: emailIsFree ? lead.email : null },
            });
          }

          if (lead.email && !emailIsFree && user.email !== lead.email) {
            this.logger.warn(
              `Lead ${lead.id}: email ${lead.email} already belongs to another account; ` +
                `partner created on phone ${lead.phone} without it.`,
            );
          }

          // FranchisePartner.userId is unique — one account cannot hold two
          // partnerships. Fail with something an admin can act on.
          const alreadyPartner = await tx.franchisePartner.findUnique({
            where: { userId: user.id },
          });
          if (alreadyPartner) {
            throw new BadRequestException(
              `This applicant is already a franchise partner (${alreadyPartner.businessName}).`,
            );
          }

          await tx.userRole.upsert({
            where: { userId_roleId: { userId: user.id, roleId: franchiseRole.id } },
            update: {},
            create: { userId: user.id, roleId: franchiseRole.id },
          });

          const partner = await tx.franchisePartner.create({
            data: {
              userId: user.id,
              businessName,
              cityId,
              referralCode,
              status: FranchisePartnerStatus.ACTIVE,
              // commissionPercent intentionally left at its schema default (10).
              // It means percent of platform commission, not percent of GMV.
            },
          });

          // Reuses the existing conflict detection, run against the same tx so a
          // detected conflict and the territory it belongs to commit together.
          const { territory, conflicts } = await this.territory.assignTerritory(
            partner.id,
            {
              city: lead.city,
              state: lead.state,
              pincodes,
              exclusivityEnabled: dto.exclusivityEnabled ?? true,
            },
            adminId,
            tx,
          );

          await tx.franchiseAudit.create({
            data: {
              franchiseId: partner.id,
              action: FranchiseAuditAction.ONBOARDED,
              actorId: adminId,
              metadata: { leadId, referralCode, pincodes } as Prisma.InputJsonValue,
            },
          });

          await tx.expansionLead.update({
            where: { id: leadId },
            data: {
              status: ExpansionLeadStatus.CONVERTED,
              reviewedAt: new Date(),
              reviewedBy: adminId,
              convertedFranchiseId: partner.id,
            },
          });

          return {
            partner,
            territory,
            conflicts,
            hasConflicts: conflicts.length > 0,
            referralCode,
          };
        });
      } catch (err) {
        if (isReferralCodeCollision(err) && attempt < MAX_CODE_ATTEMPTS - 1) {
          this.logger.warn(`Referral code ${referralCode} taken; retrying lead ${leadId}`);
          continue;
        }
        throw err;
      }
    }

    throw new BadRequestException('Could not allocate a unique referral code');
  }

  async rejectLead(adminId: string, leadId: string, dto: RejectExpansionLeadDto) {
    const lead = await this.prisma.expansionLead.findUnique({ where: { id: leadId } });
    if (!lead) throw new NotFoundException('Lead not found');
    if (lead.status === ExpansionLeadStatus.CONVERTED) {
      throw new BadRequestException('Cannot reject a lead that is already converted');
    }

    return this.prisma.expansionLead.update({
      where: { id: leadId },
      data: {
        status: ExpansionLeadStatus.REJECTED,
        rejectionReason: dto.reason,
        reviewedAt: new Date(),
        reviewedBy: adminId,
      },
    });
  }

  /**
   * Next free code of the form FR-<CITY>-<NN>. Read-then-write races are still
   * possible, which is why the caller retries on the unique-index violation — this
   * only picks a sensible starting point.
   */
  private async nextReferralCode(city: string): Promise<string> {
    const slug =
      city
        .toUpperCase()
        .replace(/[^A-Z]/g, '')
        .slice(0, 3) || 'JD';

    const taken = await this.prisma.franchisePartner.findMany({
      where: { referralCode: { startsWith: `FR-${slug}-` } },
      select: { referralCode: true },
    });
    const used = new Set(taken.map((t) => t.referralCode));

    for (let n = 1; n <= 99; n++) {
      const code = `FR-${slug}-${String(n).padStart(2, '0')}`;
      if (!used.has(code)) return code;
    }
    throw new BadRequestException(`No referral codes left for ${slug}`);
  }
}

function normalisePincodes(pincodes: string[]): string[] {
  return [...new Set(pincodes.map((p) => p.trim()).filter((p) => /^\d{6}$/.test(p)))];
}

/** Unique violation specifically on franchise_partners.referral_code. */
function isReferralCodeCollision(err: unknown): boolean {
  if (!(err instanceof Prisma.PrismaClientKnownRequestError) || err.code !== 'P2002') return false;
  const target = err.meta?.target;
  const fields = Array.isArray(target) ? target.join(',') : String(target ?? '');
  return fields.includes('referral_code');
}
