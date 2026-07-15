import {
  BadRequestException,
  ForbiddenException,
  Injectable,
  Logger,
  NotFoundException,
} from '@nestjs/common';
import {
  FranchiseAuditAction,
  FranchisePartnerStatus,
  FranchiseStoreStatus,
  Prisma,
} from '@prisma/client';
import { ConfigService } from '@nestjs/config';
import { PrismaService } from '../../database/prisma.service';
import { FranchiseStoreLinkService } from './franchise-store-link.service';
import { MarketingCardService } from '../marketing/marketing-card.service';
import { getConfig } from '../../config/configuration';
import { readUploadFileFromUrl } from '../../common/utils/upload-file.util';
import { resolvePublicAssetUrl } from '../../common/utils/asset-url.util';

@Injectable()
export class FranchiseService {
  private readonly logger = new Logger(FranchiseService.name);

  constructor(
    private readonly prisma: PrismaService,
    private readonly config: ConfigService,
    private readonly storeLink: FranchiseStoreLinkService,
    private readonly card: MarketingCardService,
  ) {}

  /** Card details the partner can edit (address + owner photo). */
  async getProfile(franchiseId: string) {
    const fp = await this.prisma.franchisePartner.findUnique({
      where: { id: franchiseId },
      select: { businessName: true, address: true, photoUrl: true, city: { select: { name: true } } },
    });
    if (!fp) throw new NotFoundException('Franchise not found');
    const cfg = getConfig(this.config);
    return {
      businessName: fp.businessName,
      city: fp.city?.name ?? null,
      address: fp.address,
      photoUrl: resolvePublicAssetUrl(cfg.storage, fp.photoUrl),
    };
  }

  async saveProfile(franchiseId: string, data: { address?: string; photoUrl?: string }) {
    await this.prisma.franchisePartner.update({
      where: { id: franchiseId },
      data: {
        ...(data.address !== undefined ? { address: data.address.trim() || null } : {}),
        ...(data.photoUrl !== undefined ? { photoUrl: data.photoUrl.trim() || null } : {}),
      },
    });
    return this.getProfile(franchiseId);
  }

  /** The partner's shareable card (PNG) — invite QR, contacts and their photo. */
  async getMarketingCardPng(franchiseId: string): Promise<Buffer> {
    const fp = await this.prisma.franchisePartner.findUnique({
      where: { id: franchiseId },
      select: {
        businessName: true,
        address: true,
        photoUrl: true,
        city: { select: { name: true } },
        user: { select: { email: true, phone: true } },
      },
    });
    if (!fp) throw new NotFoundException('Franchise not found');

    const { inviteUrl } = await this.getReferral(franchiseId);
    const cfg = getConfig(this.config);
    const photo = await readUploadFileFromUrl(cfg.storage.uploadDir, cfg.storage, fp.photoUrl);

    return this.card.render({
      name: fp.businessName,
      roleTitle: 'Business Development Partner',
      pillLabel: fp.city?.name ? `${fp.city.name} Franchise Partner` : 'Franchise Partner',
      phone: fp.user.phone,
      whatsapp: fp.user.phone,
      email: fp.user.email,
      address: fp.address ?? fp.city?.name ?? null,
      qrUrl: inviteUrl,
      qrCaption: 'Scan to Connect',
      photo,
    });
  }

  async resolveFranchiseId(userId: string): Promise<string> {
    const fp = await this.prisma.franchisePartner.findUnique({ where: { userId } });
    if (!fp) throw new ForbiddenException('Franchise partner profile required');
    return fp.id;
  }

  async listFranchises(status?: FranchisePartnerStatus) {
    const partners = await this.prisma.franchisePartner.findMany({
      where: status ? { status } : undefined,
      include: {
        city: { select: { name: true } },
        // Admin needs to see whether a partner can actually be paid yet.
        bankAccount: {
          select: { accountHolderName: true, accountNumber: true, ifsc: true, verified: true },
        },
        _count: { select: { stores: true, territories: true } },
      },
      orderBy: { createdAt: 'desc' },
      take: 100,
    });

    // Never send a full account number to a client, admin or not.
    return partners.map((p) => ({
      ...p,
      bankAccount: p.bankAccount
        ? { ...p.bankAccount, accountNumber: `••••${p.bankAccount.accountNumber.slice(-4)}` }
        : null,
    }));
  }

  async createFranchise(input: {
    userId: string;
    businessName: string;
    gstin?: string;
    pan?: string;
    cityId?: string;
    commissionPercent?: number;
  }) {
    const existing = await this.prisma.franchisePartner.findUnique({ where: { userId: input.userId } });
    if (existing) throw new BadRequestException('User already has franchise profile');

    const fp = await this.prisma.franchisePartner.create({
      data: {
        userId: input.userId,
        businessName: input.businessName,
        gstin: input.gstin,
        pan: input.pan,
        cityId: input.cityId,
        commissionPercent: input.commissionPercent ?? 10,
        status: FranchisePartnerStatus.PENDING,
      },
    });

    await this.prisma.franchiseAudit.create({
      data: { franchiseId: fp.id, action: FranchiseAuditAction.ONBOARDED },
    });

    return fp;
  }

  async updateFranchise(id: string, input: Partial<{ status: FranchisePartnerStatus; commissionPercent: number; onboardingCompleted: boolean }>, actorId?: string) {
    const fp = await this.prisma.franchisePartner.findUnique({ where: { id } });
    if (!fp) throw new NotFoundException('Franchise not found');

    const updated = await this.prisma.franchisePartner.update({
      where: { id },
      data: input,
    });

    let action: FranchiseAuditAction = FranchiseAuditAction.APPROVED;
    if (input.status === FranchisePartnerStatus.SUSPENDED) action = FranchiseAuditAction.SUSPENDED;
    if (input.status === FranchisePartnerStatus.TERMINATED) action = FranchiseAuditAction.TERMINATED;

    await this.prisma.franchiseAudit.create({
      data: { franchiseId: id, action, actorId, metadata: input as Prisma.InputJsonValue },
    });

    return updated;
  }

  /**
   * Store attribution (referral → FranchiseStore link, with the exclusive-pincode
   * guard) lives in FranchiseStoreLinkService.
   *
   * It has to, rather than living here: a store goes live through TWO approval paths
   * — merchant-application approval and the admin store-approval queue — and having
   * AdminModule import FranchiseModule builds a circular module graph that takes the
   * API down at boot. That service depends on nothing but @Global PrismaService, so
   * both modules can list it as a provider directly and no cycle forms.
   */
  async attributeStoreFromApplication(storeId: string, actorId?: string): Promise<void> {
    return this.storeLink.attributeStoreFromApplication(storeId, actorId);
  }

  async linkStore(franchiseId: string, storeId: string, actorId?: string) {
    return this.storeLink.linkStore(franchiseId, storeId, actorId);
  }

  /**
   * The partner's referral code and the invite link they share with merchants.
   * Generates a code on demand for partners created before referral codes existed,
   * so no partner is ever left without a working invite link.
   */
  async getReferral(franchiseId: string) {
    const fp = await this.prisma.franchisePartner.findUnique({
      where: { id: franchiseId },
      select: { id: true, referralCode: true, businessName: true, city: { select: { name: true } } },
    });
    if (!fp) throw new NotFoundException('Franchise not found');

    const referralCode =
      fp.referralCode ?? (await this.generateReferralCode(fp.id, fp.city?.name ?? fp.businessName));

    const base = this.config.get<string>('merchantSiteUrl') ?? 'https://merchant.jebdekho.com';
    return {
      referralCode,
      inviteUrl: `${base.replace(/\/$/, '')}/?ref=${encodeURIComponent(referralCode)}`,
    };
  }

  /**
   * Assign a unique referral code of the form FR-<CITY>-<NN>. Retries on collision
   * against the unique index rather than trusting a pre-check, so two partners
   * onboarded at the same moment can't be handed the same code.
   */
  private async generateReferralCode(franchiseId: string, cityOrName: string): Promise<string> {
    const slug =
      cityOrName
        .toUpperCase()
        .replace(/[^A-Z]/g, '')
        .slice(0, 3) || 'JD';

    for (let n = 1; n <= 99; n++) {
      const code = `FR-${slug}-${String(n).padStart(2, '0')}`;
      try {
        await this.prisma.franchisePartner.update({
          where: { id: franchiseId },
          data: { referralCode: code },
        });
        return code;
      } catch (err) {
        // P2002 = unique violation on referral_code; try the next number.
        if (err instanceof Prisma.PrismaClientKnownRequestError && err.code === 'P2002') continue;
        throw err;
      }
    }
    throw new BadRequestException(`Could not allocate a referral code for ${slug}`);
  }

  /** Merchants this partner recruited, and how far along they are. */
  async getPipeline(franchiseId: string) {
    const applications = await this.prisma.merchantApplication.findMany({
      where: { franchiseId },
      select: {
        id: true,
        status: true,
        businessName: true,
        storeName: true,
        ownerName: true,
        city: true,
        pincode: true,
        referralCode: true,
        submittedAt: true,
        reviewedAt: true,
        createdAt: true,
        storeId: true,
      },
      orderBy: { createdAt: 'desc' },
      take: 200,
    });

    const counts = applications.reduce<Record<string, number>>((acc, a) => {
      acc[a.status] = (acc[a.status] ?? 0) + 1;
      return acc;
    }, {});

    return { total: applications.length, counts, applications };
  }

  /**
   * Stores attributed to this partner, including links parked as PENDING_REVIEW.
   * A partner must be able to see a disputed store and why — otherwise they simply
   * go unpaid for it with no explanation.
   */
  async getLinkedStores(franchiseId: string) {
    const links = await this.prisma.franchiseStore.findMany({
      where: { franchiseId },
      select: {
        id: true,
        status: true,
        conflictReason: true,
        linkedAt: true,
        store: {
          select: { id: true, name: true, slug: true, pincode: true, status: true, isActive: true },
        },
      },
      orderBy: { linkedAt: 'desc' },
    });

    return {
      active: links.filter((l) => l.status === FranchiseStoreStatus.ACTIVE),
      pendingReview: links.filter((l) => l.status === FranchiseStoreStatus.PENDING_REVIEW),
      rejected: links.filter((l) => l.status === FranchiseStoreStatus.REJECTED),
    };
  }

  async getOverview() {
    const [active, pending, suspended, conflicts] = await Promise.all([
      this.prisma.franchisePartner.count({ where: { status: FranchisePartnerStatus.ACTIVE } }),
      this.prisma.franchisePartner.count({ where: { status: FranchisePartnerStatus.PENDING } }),
      this.prisma.franchisePartner.count({ where: { status: FranchisePartnerStatus.SUSPENDED } }),
      this.prisma.territoryConflict.count({ where: { status: 'OPEN' } }),
    ]);
    return { active, pending, suspended, openConflicts: conflicts };
  }
}
