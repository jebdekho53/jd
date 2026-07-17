import { BadRequestException } from '@nestjs/common';
import { FranchiseDocumentStatus, FranchiseDocumentType } from '@prisma/client';
import { computeFranchiseTax } from './franchise-tax.util';
import { FranchiseKycService, REQUIRED_DOCUMENT_TYPES } from './franchise-kyc.service';

// ---------------------------------------------------------------------------
// TDS — s.194H vs s.206AA
// ---------------------------------------------------------------------------

describe('TDS rate depends on whether a PAN is verified', () => {
  it('PAN verified -> 5% (194H): ₹12 share, net ₹13.56 with GST', () => {
    const tax = computeFranchiseTax({ franchiseShare: 12, gstRegistered: true, panVerified: true });
    expect(tax.tdsPercent).toBe(5);
    expect(tax.tdsAmount).toBe(0.6);
    expect(tax.netPayable).toBe(13.56);
  });

  it('NO PAN -> 20% (206AA), not 5% — deducting less makes us liable for the shortfall', () => {
    const tax = computeFranchiseTax({ franchiseShare: 12, gstRegistered: true, panVerified: false });
    expect(tax.tdsPercent).toBe(20);
    expect(tax.tdsAmount).toBe(2.4); // 20% of 12, not 5%
    expect(tax.netPayable).toBe(11.76); // 12 + 2.16 − 2.40
  });

  it('206AA still applies to the commission only, never to the GST', () => {
    const tax = computeFranchiseTax({ franchiseShare: 100, gstRegistered: true, panVerified: false });
    expect(tax.tdsAmount).toBe(20); // 20% of 100, not of 118
    expect(tax.netPayable).toBe(98); // 100 + 18 − 20
  });

  it('no PAN and no GST: ₹12 -> ₹9.60', () => {
    const tax = computeFranchiseTax({ franchiseShare: 12, gstRegistered: false, panVerified: false });
    expect(tax.netPayable).toBe(9.6);
  });
});

// ---------------------------------------------------------------------------
// KYC gate + computed onboarding
// ---------------------------------------------------------------------------

const PAN = {
  documentType: FranchiseDocumentType.PAN_CARD,
  status: FranchiseDocumentStatus.VERIFIED,
};
const CHEQUE = {
  documentType: FranchiseDocumentType.CANCELLED_CHEQUE,
  status: FranchiseDocumentStatus.VERIFIED,
};

function harness(partner: Record<string, unknown>) {
  const update = jest.fn().mockResolvedValue({});
  const prisma = {
    franchisePartner: {
      findUnique: jest.fn().mockResolvedValue(partner),
      update,
    },
    franchiseDocument: { upsert: jest.fn(), update: jest.fn(), findMany: jest.fn() },
  } as never;
  // Notifications are best-effort side effects; stub them out.
  const notifications = {
    documentReviewed: jest.fn(),
    onboardingComplete: jest.fn(),
  } as never;
  // Acceptance evidence is written through LegalService; stub it so these tests
  // stay about the KYC gate.
  const legal = { accept: jest.fn().mockResolvedValue(undefined) } as never;
  return { svc: new FranchiseKycService(prisma, notifications, legal), update, notifications, legal };
}

describe('assertPayoutAllowed — the payout gate', () => {
  it('allows payout when agreement, PAN and bank are all in place', async () => {
    const { svc } = harness({
      agreementAcceptedAt: new Date(),
      onboardingCompleted: true,
      documents: [PAN, CHEQUE],
      bankAccount: { verified: true },
    });

    await expect(svc.assertPayoutAllowed('fr-1')).resolves.toBeUndefined();
  });

  it('blocks payout when the agreement was never accepted', async () => {
    const { svc } = harness({
      agreementAcceptedAt: null,
      onboardingCompleted: false,
      documents: [PAN, CHEQUE],
      bankAccount: { verified: true },
    });

    await expect(svc.assertPayoutAllowed('fr-1')).rejects.toThrow(/agreement has not been accepted/i);
  });

  it('blocks payout when the PAN is not verified — the TDS would be at the wrong rate', async () => {
    const { svc } = harness({
      agreementAcceptedAt: new Date(),
      onboardingCompleted: false,
      documents: [CHEQUE],
      bankAccount: { verified: true },
    });

    await expect(svc.assertPayoutAllowed('fr-1')).rejects.toThrow(/PAN card is not verified/i);
  });

  it('blocks payout when the bank account is unverified', async () => {
    const { svc } = harness({
      agreementAcceptedAt: new Date(),
      onboardingCompleted: false,
      documents: [PAN, CHEQUE],
      bankAccount: { verified: false },
    });

    await expect(svc.assertPayoutAllowed('fr-1')).rejects.toThrow(/bank account is not verified/i);
  });

  it('names every blocker at once, so the admin does not fix them one at a time', async () => {
    const { svc } = harness({
      agreementAcceptedAt: null,
      onboardingCompleted: false,
      documents: [],
      bankAccount: null,
    });

    await expect(svc.assertPayoutAllowed('fr-1')).rejects.toThrow(BadRequestException);
    await expect(svc.assertPayoutAllowed('fr-1')).rejects.toThrow(
      /agreement.*PAN.*bank account/is,
    );
  });
});

describe('refreshOnboarding — computed, never hand-set', () => {
  it('is true only when agreement + bank + every required document are verified', async () => {
    const { svc, update } = harness({
      agreementAcceptedAt: new Date(),
      onboardingCompleted: false,
      documents: [PAN, CHEQUE],
      bankAccount: { verified: true },
    });

    await expect(svc.refreshOnboarding('fr-1')).resolves.toBe(true);
    expect(update.mock.calls[0][0].data).toEqual({ onboardingCompleted: true });
  });

  it('falls back to false when a required document is missing', async () => {
    const { svc, update } = harness({
      agreementAcceptedAt: new Date(),
      onboardingCompleted: true, // stale — e.g. seeded, or a doc was just rejected
      documents: [PAN], // cheque missing
      bankAccount: { verified: true },
    });

    await expect(svc.refreshOnboarding('fr-1')).resolves.toBe(false);
    expect(update.mock.calls[0][0].data).toEqual({ onboardingCompleted: false });
  });

  it('does not write when the flag is already correct', async () => {
    const { svc, update } = harness({
      agreementAcceptedAt: new Date(),
      onboardingCompleted: true,
      documents: [PAN, CHEQUE],
      bankAccount: { verified: true },
    });

    await svc.refreshOnboarding('fr-1');
    expect(update).not.toHaveBeenCalled();
  });

  it('PAN and cancelled cheque are the required set', () => {
    expect(REQUIRED_DOCUMENT_TYPES).toEqual([
      FranchiseDocumentType.PAN_CARD,
      FranchiseDocumentType.CANCELLED_CHEQUE,
    ]);
  });
});
