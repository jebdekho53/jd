import { BadRequestException, Injectable, Logger, NotFoundException } from '@nestjs/common';
import {
  FranchiseDocumentStatus,
  FranchiseDocumentType,
  LegalDocumentCode,
  Prisma,
} from '@prisma/client';
import { PrismaService } from '../../database/prisma.service';
import { FranchiseNotificationService } from './franchise-notification.service';
import { LegalService } from '../legal/legal.service';
import { currentVersion } from '../legal/legal-documents.registry';
import {
  AcceptFranchiseAgreementDto,
  RejectFranchiseDocumentDto,
  UploadFranchiseDocumentDto,
} from './dto/franchise.dto';

/**
 * The current franchise agreement version, taken from the legal registry so the
 * words a partner reads and the version stamped on their KYC can never drift.
 */
export const FRANCHISE_AGREEMENT_VERSION =
  currentVersion(LegalDocumentCode.FRANCHISE_AGREEMENT) ?? 'v1';

/**
 * Documents a partner must have VERIFIED before we send them money.
 * PAN is not optional: without a verified PAN we must deduct TDS at 20% (s.206AA),
 * and we cannot file the deduction against them properly.
 */
export const REQUIRED_DOCUMENT_TYPES: FranchiseDocumentType[] = [
  FranchiseDocumentType.PAN_CARD,
  FranchiseDocumentType.CANCELLED_CHEQUE,
];

@Injectable()
export class FranchiseKycService {
  private readonly logger = new Logger(FranchiseKycService.name);

  constructor(
    private readonly prisma: PrismaService,
    private readonly notifications: FranchiseNotificationService,
    private readonly legal: LegalService,
  ) {}

  // ---------------------------------------------------------------------------
  // Partner
  // ---------------------------------------------------------------------------

  async listDocuments(franchiseId: string) {
    return this.prisma.franchiseDocument.findMany({
      where: { franchiseId },
      orderBy: { uploadedAt: 'desc' },
    });
  }

  /**
   * Upload (or replace) a KYC document. Re-uploading a type resets it to PENDING:
   * a document that has changed has not been checked, and letting a previously
   * VERIFIED status carry over to new content is how an unverified PAN slips
   * through and gets TDS deducted at the wrong rate.
   */
  async uploadDocument(franchiseId: string, dto: UploadFranchiseDocumentDto) {
    const doc = await this.prisma.franchiseDocument.upsert({
      where: {
        franchiseId_documentType: { franchiseId, documentType: dto.documentType },
      },
      create: {
        franchiseId,
        documentType: dto.documentType,
        fileName: dto.fileName,
        fileUrl: dto.fileUrl,
        mimeType: dto.mimeType,
      },
      update: {
        fileName: dto.fileName,
        fileUrl: dto.fileUrl,
        mimeType: dto.mimeType,
        status: FranchiseDocumentStatus.PENDING,
        rejectionReason: null,
        verifiedAt: null,
        verifiedBy: null,
      },
    });

    await this.refreshOnboarding(franchiseId);
    return doc;
  }

  /**
   * Record acceptance of the franchise agreement. First-touch: an already-accepted
   * agreement is not re-stamped, so the original acceptance date survives.
   */
  async acceptAgreement(
    franchiseId: string,
    dto: AcceptFranchiseAgreementDto,
    ip?: string,
    userAgent?: string,
  ) {
    const fp = await this.prisma.franchisePartner.findUnique({
      where: { id: franchiseId },
      select: { agreementAcceptedAt: true, userId: true },
    });
    if (!fp) throw new NotFoundException('Franchise not found');
    if (!dto.accepted) throw new BadRequestException('Agreement must be accepted');

    if (!fp.agreementAcceptedAt) {
      await this.prisma.franchisePartner.update({
        where: { id: franchiseId },
        data: {
          agreementAcceptedAt: new Date(),
          agreementVersion: FRANCHISE_AGREEMENT_VERSION,
          agreementIp: ip ?? null,
        },
      });
    }

    // Also record it as ordinary legal evidence, so every party's acceptances —
    // buyer, merchant, franchise, rider — are provable from one place. The KYC
    // columns above stay as the gate onboardingCompleted already reads.
    await this.legal.accept(
      fp.userId,
      LegalDocumentCode.FRANCHISE_AGREEMENT,
      FRANCHISE_AGREEMENT_VERSION,
      { ip, userAgent },
    );

    return this.getKycStatus(franchiseId);
  }

  /** Everything the portal needs to show the partner what is still missing. */
  async getKycStatus(franchiseId: string) {
    const fp = await this.prisma.franchisePartner.findUnique({
      where: { id: franchiseId },
      include: { documents: true, bankAccount: { select: { verified: true } } },
    });
    if (!fp) throw new NotFoundException('Franchise not found');

    const verified = new Set(
      fp.documents
        .filter((d) => d.status === FranchiseDocumentStatus.VERIFIED)
        .map((d) => d.documentType),
    );
    const missing = REQUIRED_DOCUMENT_TYPES.filter((t) => !verified.has(t));

    return {
      agreementAccepted: Boolean(fp.agreementAcceptedAt),
      /** Optional by law below the s.22 threshold — never a payout blocker. */
      gstin: fp.gstin,
      gstRegistered: Boolean(fp.gstin),
      agreementVersion: fp.agreementVersion,
      agreementCurrentVersion: FRANCHISE_AGREEMENT_VERSION,
      bankVerified: Boolean(fp.bankAccount?.verified),
      panVerified: verified.has(FranchiseDocumentType.PAN_CARD),
      requiredDocuments: REQUIRED_DOCUMENT_TYPES,
      missingDocuments: missing,
      documents: fp.documents,
      onboardingCompleted: fp.onboardingCompleted,
      /** Until this is true, no payout can be sent. */
      payoutReady:
        Boolean(fp.agreementAcceptedAt) &&
        Boolean(fp.bankAccount?.verified) &&
        verified.has(FranchiseDocumentType.PAN_CARD),
    };
  }

  // ---------------------------------------------------------------------------
  // Admin
  // ---------------------------------------------------------------------------

  async listPendingDocuments() {
    return this.prisma.franchiseDocument.findMany({
      where: { status: FranchiseDocumentStatus.PENDING },
      include: {
        franchise: { select: { id: true, businessName: true, referralCode: true } },
      },
      orderBy: { uploadedAt: 'asc' },
      take: 200,
    });
  }

  async verifyDocument(adminId: string, documentId: string) {
    const doc = await this.prisma.franchiseDocument.update({
      where: { id: documentId },
      data: {
        status: FranchiseDocumentStatus.VERIFIED,
        verifiedAt: new Date(),
        verifiedBy: adminId,
        rejectionReason: null,
      },
    });

    const complete = await this.refreshOnboarding(doc.franchiseId);
    await this.notifications.documentReviewed(doc.franchiseId, label(doc.documentType), true);
    if (complete) await this.notifications.onboardingComplete(doc.franchiseId);

    this.logger.log({ documentId, type: doc.documentType }, 'Franchise document verified');
    return doc;
  }

  async rejectDocument(adminId: string, documentId: string, dto: RejectFranchiseDocumentDto) {
    const doc = await this.prisma.franchiseDocument.update({
      where: { id: documentId },
      data: {
        status: FranchiseDocumentStatus.REJECTED,
        rejectionReason: dto.reason,
        verifiedAt: null,
        verifiedBy: adminId,
      },
    });

    await this.refreshOnboarding(doc.franchiseId);
    await this.notifications.documentReviewed(
      doc.franchiseId,
      label(doc.documentType),
      false,
      dto.reason,
    );
    return doc;
  }

  // ---------------------------------------------------------------------------

  /**
   * `onboardingCompleted` is computed, never set by hand — it means "this partner
   * is fully KYC'd and can be paid", and a hand-set flag would let an unverified
   * partner look ready.
   */
  async refreshOnboarding(franchiseId: string): Promise<boolean> {
    const fp = await this.prisma.franchisePartner.findUnique({
      where: { id: franchiseId },
      include: {
        documents: { where: { status: FranchiseDocumentStatus.VERIFIED } },
        bankAccount: { select: { verified: true } },
      },
    });
    if (!fp) return false;

    const verified = new Set(fp.documents.map((d) => d.documentType));
    const complete =
      Boolean(fp.agreementAcceptedAt) &&
      Boolean(fp.bankAccount?.verified) &&
      REQUIRED_DOCUMENT_TYPES.every((t) => verified.has(t));

    if (complete !== fp.onboardingCompleted) {
      await this.prisma.franchisePartner.update({
        where: { id: franchiseId },
        data: { onboardingCompleted: complete },
      });
    }
    return complete;
  }

  /**
   * The payout gate. Bank alone is not enough: without a signed agreement we have
   * no contract to pay against, and without a verified PAN the TDS is wrong.
   */
  async assertPayoutAllowed(franchiseId: string): Promise<void> {
    const status = await this.getKycStatus(franchiseId);

    const blockers: string[] = [];
    if (!status.agreementAccepted) blockers.push('the franchise agreement has not been accepted');
    if (!status.panVerified) blockers.push('the PAN card is not verified');
    if (!status.bankVerified) blockers.push('the bank account is not verified');

    if (blockers.length > 0) {
      throw new BadRequestException(`Cannot pay this partner yet — ${blockers.join(', ')}.`);
    }
  }
}

/** Documents an admin may see but that are not required for payout. */
export const OPTIONAL_DOCUMENT_TYPES: FranchiseDocumentType[] = Object.values(
  FranchiseDocumentType,
).filter((t) => !REQUIRED_DOCUMENT_TYPES.includes(t)) as FranchiseDocumentType[];

export type FranchiseDocumentMetadata = Prisma.JsonObject;

/** Human label for a document type — used in the messages we send partners. */
function label(type: FranchiseDocumentType): string {
  return type
    .toLowerCase()
    .split('_')
    .join(' ')
    .replace(/^\w/, (c) => c.toUpperCase());
}
