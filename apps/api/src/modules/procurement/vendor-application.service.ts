import { BadRequestException, Injectable, Logger, NotFoundException } from '@nestjs/common';
import { RoleName, VendorApplicationStatus } from '@prisma/client';
import { PrismaService } from '../../database/prisma.service';
import { PasswordService } from '../auth/password.service';
import {
  ApproveVendorApplicationDto,
  RejectVendorApplicationDto,
  SubmitVendorApplicationDto,
} from './dto/vendor-application.dto';

/** Statuses in which an application is still being worked — a repeat
 *  submission from the same phone is a no-op, mirroring franchise onboarding. */
const OPEN_STATUSES = [VendorApplicationStatus.NEW, VendorApplicationStatus.UNDER_REVIEW];

@Injectable()
export class VendorApplicationService {
  private readonly logger = new Logger(VendorApplicationService.name);

  constructor(
    private readonly prisma: PrismaService,
    private readonly passwords: PasswordService,
  ) {}

  // ---------------------------------------------------------------------------
  // Public funnel
  // ---------------------------------------------------------------------------

  async submitApplication(dto: SubmitVendorApplicationDto) {
    const phone = dto.phone.trim();
    const email = dto.email.trim().toLowerCase();

    // Someone already onboarded as a vendor must not apply again — one account
    // can only hold one vendor profile.
    const existingVendorUser = await this.prisma.user.findFirst({
      where: { vendorProfile: { isNot: null }, OR: [{ phone }, { email }] },
      select: { id: true },
    });
    if (existingVendorUser) {
      throw new BadRequestException(
        'You are already registered as a JebDekho vendor. Please sign in instead.',
      );
    }

    // User.email is unique — if it already sits on a different phone's account we
    // cannot attach it at approval, which would leave the password-login tab
    // unusable for this applicant. Say so now rather than after approval.
    const emailOwner = await this.prisma.user.findUnique({
      where: { email },
      select: { phone: true },
    });
    if (emailOwner && emailOwner.phone !== phone) {
      throw new BadRequestException(
        'This email is already registered to another JebDekho account. Please use a different email, or sign in with that account.',
      );
    }

    const passwordHash = await this.passwords.hash(dto.password);

    const existing = await this.prisma.vendorApplication.findFirst({
      where: { phone, status: { in: OPEN_STATUSES } },
      orderBy: { createdAt: 'desc' },
    });
    if (existing) {
      return { id: existing.id, status: existing.status, duplicate: true };
    }

    const application = await this.prisma.vendorApplication.create({
      data: {
        businessName: dto.businessName.trim(),
        vendorType: dto.vendorType,
        phone,
        email,
        passwordHash,
        cityId: dto.cityId || null,
        line1: dto.line1?.trim() || null,
        pincode: dto.pincode || null,
        gstNumber: dto.gstNumber?.trim() || null,
        panNumber: dto.panNumber?.trim() || null,
        notes: dto.notes?.trim() || null,
        status: VendorApplicationStatus.NEW,
      },
    });

    return { id: application.id, status: application.status, duplicate: false };
  }

  // ---------------------------------------------------------------------------
  // Admin review
  // ---------------------------------------------------------------------------

  async listApplications(status?: VendorApplicationStatus) {
    return this.prisma.vendorApplication.findMany({
      where: status ? { status } : undefined,
      include: {
        convertedVendor: { select: { id: true, businessName: true } },
        city: { select: { id: true, name: true, state: true } },
      },
      orderBy: { createdAt: 'desc' },
      take: 200,
    });
  }

  async getApplication(id: string) {
    const application = await this.prisma.vendorApplication.findUnique({
      where: { id },
      include: {
        convertedVendor: { select: { id: true, businessName: true } },
        city: { select: { id: true, name: true, state: true } },
      },
    });
    if (!application) throw new NotFoundException('Application not found');
    return application;
  }

  /**
   * Approve an application: create the User, grant the VENDOR role, create the
   * Vendor + VendorProfile + a starter VendorCatalog — all in ONE transaction,
   * mirroring franchise-application.service.ts's approveLead. A failure partway
   * must never leave an orphaned user holding a VENDOR role with no vendor
   * record behind it.
   */
  async approveApplication(adminId: string, applicationId: string, dto: ApproveVendorApplicationDto) {
    const application = await this.prisma.vendorApplication.findUnique({ where: { id: applicationId } });
    if (!application) throw new NotFoundException('Application not found');
    if (application.status === VendorApplicationStatus.APPROVED) {
      throw new BadRequestException('Application has already been approved');
    }

    const vendorRole = await this.prisma.role.findUniqueOrThrow({ where: { name: RoleName.VENDOR } });
    const businessName = dto.businessName?.trim() || application.businessName;

    return this.prisma.$transaction(async (tx) => {
      // PHONE is the identity here, same reasoning as franchise onboarding: the
      // public form is unauthenticated, so we reuse an account only by phone
      // match, and never overwrite an existing account's password.
      const emailIsFree = application.email
        ? !(await tx.user.findUnique({ where: { email: application.email }, select: { id: true } }))
        : false;

      let user = await tx.user.findUnique({ where: { phone: application.phone } });

      if (user) {
        if (application.email && emailIsFree && user.email !== application.email) {
          user = await tx.user.update({ where: { id: user.id }, data: { email: application.email } });
        }
        if (application.passwordHash) {
          this.logger.warn(
            `Application ${application.id}: reusing existing account ${user.id}; the password ` +
              `chosen on the application was NOT applied. They sign in with their existing credentials.`,
          );
        }
      } else {
        user = await tx.user.create({
          data: {
            phone: application.phone,
            email: emailIsFree ? application.email : null,
            passwordHash: application.passwordHash,
          },
        });
      }

      const alreadyVendor = await tx.vendorProfile.findUnique({ where: { userId: user.id } });
      if (alreadyVendor) {
        throw new BadRequestException('This applicant already has a vendor profile.');
      }

      await tx.userRole.upsert({
        where: { userId_roleId: { userId: user.id, roleId: vendorRole.id } },
        update: {},
        create: { userId: user.id, roleId: vendorRole.id },
      });

      const vendor = await tx.vendor.create({
        data: {
          vendorType: application.vendorType,
          businessName,
          gstNumber: application.gstNumber,
          panNumber: application.panNumber,
          phone: application.phone,
          email: application.email,
          cityId: application.cityId,
          line1: application.line1,
          pincode: application.pincode,
        },
      });

      await tx.vendorProfile.create({
        data: { userId: user.id, vendorId: vendor.id },
      });

      // A brand-new vendor needs somewhere to add products to — without a
      // starter catalog, createProduct() has nothing to attach to and the
      // vendor is stuck immediately after their first login.
      await tx.vendorCatalog.create({
        data: { vendorId: vendor.id, name: 'Default catalog' },
      });

      await tx.vendorApplication.update({
        where: { id: applicationId },
        data: {
          status: VendorApplicationStatus.APPROVED,
          reviewedAt: new Date(),
          reviewedBy: adminId,
          convertedVendorId: vendor.id,
        },
      });

      return { vendor };
    });
  }

  async rejectApplication(adminId: string, applicationId: string, dto: RejectVendorApplicationDto) {
    const application = await this.prisma.vendorApplication.findUnique({ where: { id: applicationId } });
    if (!application) throw new NotFoundException('Application not found');
    if (application.status === VendorApplicationStatus.APPROVED) {
      throw new BadRequestException('Cannot reject an application that is already approved');
    }

    return this.prisma.vendorApplication.update({
      where: { id: applicationId },
      data: {
        status: VendorApplicationStatus.REJECTED,
        rejectionReason: dto.reason,
        reviewedAt: new Date(),
        reviewedBy: adminId,
      },
    });
  }
}
