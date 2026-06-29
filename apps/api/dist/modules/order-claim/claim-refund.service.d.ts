import { ClaimActorType } from '@prisma/client';
import { PrismaService } from '../../database/prisma.service';
import { RazorpayService } from '../payment/razorpay.service';
import { LedgerService } from '../finance/ledger.service';
import { WalletService } from '../wallet-loyalty/wallet.service';
import { ClaimEligibilityService } from './claim-eligibility.service';
import { CreditNoteService } from '../compliance/credit-note.service';
export declare class ClaimRefundService {
    private readonly prisma;
    private readonly razorpay;
    private readonly ledger;
    private readonly wallet;
    private readonly eligibility;
    private readonly creditNotes;
    private readonly logger;
    constructor(prisma: PrismaService, razorpay: RazorpayService, ledger: LedgerService, wallet: WalletService, eligibility: ClaimEligibilityService, creditNotes: CreditNoteService);
    processRefund(claimId: string, actorId: string, actorType: ClaimActorType): Promise<void>;
}
