import {
  BadRequestException,
  Injectable,
  Logger,
  NotFoundException,
  ServiceUnavailableException,
} from '@nestjs/common';
import { PrismaService } from '../../database/prisma.service';
import { RazorpayService } from '../payment/razorpay.service';
import { SaveRiderBankAccountDto } from './dto/finance.dto';

/**
 * A rider's payout bank account. Mirrors FranchiseBankAccountService: the rider
 * enters it themselves, an admin verifies it, and verification creates the Razorpay
 * Route linked account we transfer earnings into.
 */
@Injectable()
export class RiderBankAccountService {
  private readonly logger = new Logger(RiderBankAccountService.name);

  constructor(
    private readonly prisma: PrismaService,
    private readonly razorpay: RazorpayService,
  ) {}

  async get(riderProfileId: string) {
    const bank = await this.prisma.riderBankAccount.findUnique({ where: { riderProfileId } });
    return bank ? this.mask(bank) : null;
  }

  /**
   * Rider adds or replaces their account. Any edit resets verification and drops
   * the linked account — a changed account has not been checked, and paying into it
   * on an old verification is how money reaches the wrong person.
   */
  async save(riderProfileId: string, dto: SaveRiderBankAccountDto) {
    const bank = await this.prisma.riderBankAccount.upsert({
      where: { riderProfileId },
      create: {
        riderProfileId,
        accountHolderName: dto.accountHolderName.trim(),
        accountNumber: dto.accountNumber.trim(),
        ifsc: dto.ifsc.trim().toUpperCase(),
        bankName: dto.bankName?.trim() || null,
        upiId: dto.upiId?.trim() || null,
      },
      update: {
        accountHolderName: dto.accountHolderName.trim(),
        accountNumber: dto.accountNumber.trim(),
        ifsc: dto.ifsc.trim().toUpperCase(),
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
   * Admin verifies the account and we create the Razorpay linked account in the
   * same write — a rider can never be "verified" without somewhere to pay.
   */
  async verify(adminId: string, riderProfileId: string) {
    const bank = await this.prisma.riderBankAccount.findUnique({
      where: { riderProfileId },
      include: {
        riderProfile: { include: { user: { select: { email: true, phone: true } }, } },
      },
    });
    if (!bank) throw new NotFoundException('No bank account on file for this rider');
    if (bank.verified && bank.razorpayLinkedAccountId) return this.mask(bank);

    const email = bank.riderProfile.user.email;
    if (!email) {
      throw new BadRequestException(
        'Rider has no email on their account — Razorpay requires one to create a linked account',
      );
    }

    let linkedAccountId = bank.razorpayLinkedAccountId;
    if (!linkedAccountId) {
      try {
        const { accountId } = await this.razorpay.createLinkedAccount({
          email,
          phone: bank.riderProfile.user.phone,
          referenceId: riderProfileId,
          legalBusinessName: bank.accountHolderName,
          bank: {
            accountNumber: bank.accountNumber,
            ifsc: bank.ifsc,
            accountHolderName: bank.accountHolderName,
          },
        });
        linkedAccountId = accountId;
      } catch (err) {
        const message = err instanceof Error ? err.message : String(err);
        this.logger.error({ riderProfileId, err: message }, 'Rider linked account creation failed');
        throw new ServiceUnavailableException(
          `Could not create the payout account with Razorpay: ${message}`,
        );
      }
    }

    const updated = await this.prisma.riderBankAccount.update({
      where: { riderProfileId },
      data: {
        verified: true,
        verifiedAt: new Date(),
        verifiedBy: adminId,
        razorpayLinkedAccountId: linkedAccountId,
      },
    });
    this.logger.log({ riderProfileId, linkedAccountId }, 'Rider bank account verified');
    return this.mask(updated);
  }

  private mask<T extends { accountNumber: string }>(bank: T) {
    return { ...bank, accountNumber: `••••${bank.accountNumber.slice(-4)}` };
  }
}
