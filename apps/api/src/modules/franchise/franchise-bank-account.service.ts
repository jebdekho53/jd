import { BadRequestException, Injectable, Logger, NotFoundException } from '@nestjs/common';
import { PrismaService } from '../../database/prisma.service';
import { RazorpayService } from '../payment/razorpay.service';
import { SaveFranchiseBankAccountDto } from './dto/franchise.dto';

@Injectable()
export class FranchiseBankAccountService {
  private readonly logger = new Logger(FranchiseBankAccountService.name);

  constructor(
    private readonly prisma: PrismaService,
    private readonly razorpay: RazorpayService,
  ) {}

  async get(franchiseId: string) {
    const bank = await this.prisma.franchiseBankAccount.findUnique({
      where: { franchiseId },
    });
    if (!bank) return null;
    return this.mask(bank);
  }

  /**
   * Partner adds or replaces their payout bank account.
   *
   * Any edit resets `verified` and drops the Razorpay linked account: an account
   * that has changed has not been checked, and paying into it on the strength of a
   * previous verification is exactly how money reaches the wrong person.
   */
  async save(franchiseId: string, dto: SaveFranchiseBankAccountDto) {
    const ifsc = dto.ifsc.trim().toUpperCase();
    const accountNumber = dto.accountNumber.trim();

    const bank = await this.prisma.franchiseBankAccount.upsert({
      where: { franchiseId },
      create: {
        franchiseId,
        accountHolderName: dto.accountHolderName.trim(),
        accountNumber,
        ifsc,
        bankName: dto.bankName?.trim() || null,
        upiId: dto.upiId?.trim() || null,
      },
      update: {
        accountHolderName: dto.accountHolderName.trim(),
        accountNumber,
        ifsc,
        bankName: dto.bankName?.trim() || null,
        upiId: dto.upiId?.trim() || null,
        verified: false,
        verifiedAt: null,
        verifiedBy: null,
        razorpayLinkedAccountId: null,
      },
    });

    return this.mask(bank);
  }

  /**
   * Admin verifies the account and we create the Razorpay Route linked account we
   * will actually transfer into. Verification and the linked account are set in the
   * same write, so a partner can never be "verified" without somewhere to pay.
   */
  async verify(adminId: string, franchiseId: string) {
    const bank = await this.prisma.franchiseBankAccount.findUnique({
      where: { franchiseId },
      include: {
        franchise: {
          include: { user: { select: { email: true, phone: true } } },
        },
      },
    });
    if (!bank) throw new NotFoundException('No bank account on file for this partner');
    if (bank.verified && bank.razorpayLinkedAccountId) return this.mask(bank);

    const email = bank.franchise.user.email;
    if (!email) {
      throw new BadRequestException(
        'Partner has no email on their account — Razorpay requires one to create a linked account',
      );
    }

    let linkedAccountId = bank.razorpayLinkedAccountId;
    if (!linkedAccountId) {
      const { accountId } = await this.razorpay.createLinkedAccount({
        email,
        phone: bank.franchise.user.phone,
        referenceId: bank.franchiseId,
        legalBusinessName: bank.franchise.businessName,
        bank: {
          accountNumber: bank.accountNumber,
          ifsc: bank.ifsc,
          accountHolderName: bank.accountHolderName,
        },
      });
      linkedAccountId = accountId;
    }

    const updated = await this.prisma.franchiseBankAccount.update({
      where: { franchiseId },
      data: {
        verified: true,
        verifiedAt: new Date(),
        verifiedBy: adminId,
        razorpayLinkedAccountId: linkedAccountId,
      },
    });

    this.logger.log({ franchiseId, linkedAccountId }, 'Franchise bank account verified');
    return this.mask(updated);
  }

  /** Never hand a full account number back over the API. */
  private mask<T extends { accountNumber: string }>(bank: T) {
    return { ...bank, accountNumber: `••••${bank.accountNumber.slice(-4)}` };
  }
}
