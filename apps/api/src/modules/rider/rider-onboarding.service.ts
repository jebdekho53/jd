import { Injectable, InternalServerErrorException, Logger } from '@nestjs/common';
import { RoleName } from '@prisma/client';
import { PrismaService } from '../../database/prisma.service';
import { EmailNotificationService } from '../email/email-notification.service';
import { RegisterRiderDto } from './dto/register-rider.dto';

@Injectable()
export class RiderOnboardingService {
  private readonly logger = new Logger(RiderOnboardingService.name);

  constructor(
    private readonly prisma: PrismaService,
    private readonly emailNotifications: EmailNotificationService,
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
