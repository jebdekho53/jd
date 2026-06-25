import { ForbiddenException, Injectable } from '@nestjs/common';
import { MerchantBlocklistType } from '@prisma/client';
import { PrismaService } from '../../database/prisma.service';
import { MERCHANT_BLOCKED_MESSAGE } from '../../common/constants/rejection.constants';

export type BlocklistCheckInput = {
  phone?: string | null;
  email?: string | null;
  gstNumber?: string | null;
  panNumber?: string | null;
};

@Injectable()
export class VerificationBlocklistService {
  constructor(private readonly prisma: PrismaService) {}

  normalizePhone(phone: string): string {
    const digits = phone.replace(/\D/g, '');
    return digits.slice(-10);
  }

  normalizeEmail(email: string): string {
    return email.trim().toLowerCase();
  }

  normalizeGst(gst: string): string {
    return gst.trim().toUpperCase();
  }

  normalizePan(pan: string): string {
    return pan.trim().toUpperCase();
  }

  private buildEntries(input: BlocklistCheckInput): Array<{ type: MerchantBlocklistType; value: string }> {
    const entries: Array<{ type: MerchantBlocklistType; value: string }> = [];

    if (input.phone?.trim()) {
      entries.push({
        type: MerchantBlocklistType.PHONE,
        value: this.normalizePhone(input.phone),
      });
    }
    if (input.email?.trim()) {
      entries.push({
        type: MerchantBlocklistType.EMAIL,
        value: this.normalizeEmail(input.email),
      });
    }
    if (input.gstNumber?.trim()) {
      entries.push({
        type: MerchantBlocklistType.GST_NUMBER,
        value: this.normalizeGst(input.gstNumber),
      });
    }
    if (input.panNumber?.trim()) {
      entries.push({
        type: MerchantBlocklistType.PAN_NUMBER,
        value: this.normalizePan(input.panNumber),
      });
    }

    return entries;
  }

  async assertMerchantProfileNotBlacklisted(merchantProfileId: string): Promise<void> {
    const profile = await this.prisma.merchantProfile.findUnique({
      where: { id: merchantProfileId },
      select: { isBlacklisted: true },
    });
    if (profile?.isBlacklisted) {
      throw new ForbiddenException(MERCHANT_BLOCKED_MESSAGE);
    }
  }

  async assertUserNotBlacklisted(userId: string): Promise<void> {
    const profile = await this.prisma.merchantProfile.findUnique({
      where: { userId },
      select: { isBlacklisted: true },
    });
    if (profile?.isBlacklisted) {
      throw new ForbiddenException(MERCHANT_BLOCKED_MESSAGE);
    }
  }

  async assertNotBlocked(input: BlocklistCheckInput): Promise<void> {
    const entries = this.buildEntries(input);
    if (!entries.length) return;

    const blocked = await this.prisma.merchantVerificationBlocklist.findFirst({
      where: {
        OR: entries.map((e) => ({ type: e.type, value: e.value })),
      },
    });

    if (blocked) {
      throw new ForbiddenException(MERCHANT_BLOCKED_MESSAGE);
    }
  }

  async blockMerchantIdentifiers(
    input: BlocklistCheckInput,
    reason: string,
    blockedBy: string,
    storeId?: string,
  ): Promise<void> {
    const entries = this.buildEntries(input);
    if (!entries.length) return;

    await this.prisma.$transaction(
      entries.map((entry) =>
        this.prisma.merchantVerificationBlocklist.upsert({
          where: {
            type_value: { type: entry.type, value: entry.value },
          },
          update: {
            reason,
            storeId: storeId ?? null,
            blockedBy,
          },
          create: {
            type: entry.type,
            value: entry.value,
            reason,
            storeId: storeId ?? null,
            blockedBy,
          },
        }),
      ),
    );
  }

  async removeMerchantIdentifiers(input: BlocklistCheckInput): Promise<void> {
    const entries = this.buildEntries(input);
    if (!entries.length) return;

    await this.prisma.merchantVerificationBlocklist.deleteMany({
      where: {
        OR: entries.map((e) => ({ type: e.type, value: e.value })),
      },
    });
  }
}
