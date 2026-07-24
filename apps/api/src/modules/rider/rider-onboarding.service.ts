import {
  BadRequestException,
  Injectable,
  InternalServerErrorException,
  Logger,
  NotFoundException,
} from '@nestjs/common';
import { RoleName } from '@prisma/client';
import { PrismaService } from '../../database/prisma.service';
import { EmailNotificationService } from '../email/email-notification.service';
import { RegisterRiderDto } from './dto/register-rider.dto';
import { UpdateRiderProfileDto } from './dto/update-rider-profile.dto';
import { RiderReferralService } from '../finance/rider-referral.service';
import { requiresDrivingLicense } from '../../common/utils/vehicle.util';

@Injectable()
export class RiderOnboardingService {
  private readonly logger = new Logger(RiderOnboardingService.name);

  constructor(
    private readonly prisma: PrismaService,
    private readonly emailNotifications: EmailNotificationService,
    private readonly referrals: RiderReferralService,
  ) {}

  /**
   * Self-onboard the authenticated user as a rider: create their RiderProfile
   * (KYC starts PENDING) and grant the RIDER role. Idempotent — returns the
   * existing profile if they already applied. Admin approves KYC before the
   * rider can go online and receive orders.
   */
  async register(userId: string, dto: RegisterRiderDto) {
    const existing = await this.prisma.riderProfile.findUnique({ where: { userId } });
    if (existing) return this.toResult(existing);

    if (dto.referralCode?.trim()) {
      await this.referrals.validateCodeExists(dto.referralCode);
    }

    const riderRole = await this.prisma.role.findUnique({ where: { name: RoleName.RIDER } });
    if (!riderRole) {
      this.logger.error('RIDER role missing from the roles table — seed it before onboarding riders');
      throw new InternalServerErrorException('Rider onboarding is not available');
    }

    const profile = await this.prisma.$transaction(async (tx) => {
      const created = await tx.riderProfile.create({
        data: {
          userId,
          name: dto.name.trim(),
          vehicleType: dto.vehicleType,
          vehicleNumber: dto.vehicleNumber?.trim() || null,
          licenseNumber: dto.licenseNumber?.trim() || null,
        },
      });
      await tx.userRole.upsert({
        where: { userId_roleId: { userId, roleId: riderRole.id } },
        update: {},
        create: { userId, roleId: riderRole.id },
      });
      return created;
    });

    this.logger.log({ userId, riderProfileId: profile.id }, 'New rider registered (KYC pending)');
    if (dto.referralCode?.trim()) {
      await this.referrals.applyReferralCode(profile.id, dto.referralCode);
    }
    const user = await this.prisma.user.findUnique({
      where: { id: userId },
      select: { email: true },
    });
    void this.emailNotifications
      .sendRiderWelcomeEmail(user?.email, profile.name, profile.id)
      .catch((err) =>
        this.logger.error({ err, userId, riderProfileId: profile.id }, 'Rider welcome email failed'),
      );
    return this.toResult(profile);
  }

  /**
   * Self-service profile edit. Approval state is deliberately left alone: a
   * rider mid-shift must not be knocked offline by a typo fix. Where the
   * vehicle identity itself changed we flag it so the caller can tell the rider
   * to re-upload the matching RC or licence, and compliance can re-check.
   */
  async updateProfile(userId: string, dto: UpdateRiderProfileDto) {
    const existing = await this.prisma.riderProfile.findUnique({ where: { userId } });
    if (!existing) throw new NotFoundException('Rider profile not found');

    const next = {
      ...(dto.name !== undefined ? { name: dto.name.trim() } : {}),
      ...(dto.vehicleType !== undefined ? { vehicleType: dto.vehicleType } : {}),
      ...(dto.vehicleNumber !== undefined ? { vehicleNumber: dto.vehicleNumber.trim() || null } : {}),
      ...(dto.licenseNumber !== undefined ? { licenseNumber: dto.licenseNumber.trim() || null } : {}),
    };

    // Validated against the merged (existing + incoming) state, not just this
    // request's body — switching to a motorised vehicle without ever resending
    // a licence number must not silently clear it.
    const effectiveVehicleType = next.vehicleType ?? existing.vehicleType;
    const effectiveLicense = 'licenseNumber' in next ? next.licenseNumber : existing.licenseNumber;
    if (requiresDrivingLicense(effectiveVehicleType) && !effectiveLicense) {
      throw new BadRequestException('Driving licence number is required for this vehicle type');
    }

    const vehicleChanged =
      (next.vehicleType !== undefined && next.vehicleType !== existing.vehicleType) ||
      (next.vehicleNumber !== undefined && next.vehicleNumber !== existing.vehicleNumber) ||
      (next.licenseNumber !== undefined && next.licenseNumber !== existing.licenseNumber);

    const profile = await this.prisma.riderProfile.update({ where: { userId }, data: next });

    if (vehicleChanged) {
      this.logger.warn(
        { userId, riderProfileId: profile.id },
        'Rider changed vehicle identity after onboarding — documents may need re-verification',
      );
    }

    return { ...this.toResult(profile), vehicleChanged };
  }

  private toResult(profile: { id: string; name: string; vehicleType: string; kycStatus: string; status: string }) {
    return {
      id: profile.id,
      name: profile.name,
      vehicleType: profile.vehicleType,
      kycStatus: profile.kycStatus,
      status: profile.status,
    };
  }
}
