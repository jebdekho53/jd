import {
  ClaimApprovalMode,
  ClaimProofRequirement,
  ClaimRefundMethod,
  OrderClaimType,
  PreparedFoodPolicy,
  ReturnClaimReason,
} from '@prisma/client';
import {
  buildReturnPolicySummary,
  evaluateClaimEligibility,
  formatReturnWindow,
  validateEvidenceForPolicy,
  type ProductPolicyInput,
} from './product-return-policy.util';

const basePolicy: ProductPolicyInput = {
  isReturnable: true,
  isRefundable: true,
  isReplaceable: true,
  returnWindowHours: 48,
  approvalMode: ClaimApprovalMode.MANUAL,
  proofRequired: ClaimProofRequirement.NONE,
  autoApproveBelowAmount: null,
  returnReasons: [],
  restockingFee: 0,
  refundMethod: ClaimRefundMethod.ORIGINAL_PAYMENT,
  returnPolicyText: null,
  replacementPolicyText: null,
  preparedFoodPolicy: null,
  allowCustomerChangedMind: true,
};

describe('formatReturnWindow', () => {
  it('formats hours and days, handling singular/plural', () => {
    expect(formatReturnWindow(1)).toBe('Within 1 Hour');
    expect(formatReturnWindow(5)).toBe('Within 5 Hours');
    expect(formatReturnWindow(24)).toBe('Within 1 Day');
    expect(formatReturnWindow(72)).toBe('Within 3 Days');
  });

  it('returns null for null/zero/negative', () => {
    expect(formatReturnWindow(null)).toBeNull();
    expect(formatReturnWindow(0)).toBeNull();
    expect(formatReturnWindow(-5)).toBeNull();
  });
});

describe('buildReturnPolicySummary', () => {
  it('surfaces highlights for an open policy', () => {
    const s = buildReturnPolicySummary(basePolicy);
    expect(s.highlights).toEqual(expect.arrayContaining(['Return Accepted', 'Refund Available']));
    expect(s.returnAllowed).toBe(true);
  });

  it('marks a no-return/no-refund product clearly', () => {
    const s = buildReturnPolicySummary({
      ...basePolicy,
      isReturnable: false,
      isRefundable: false,
      isReplaceable: false,
      returnWindowHours: null,
    });
    expect(s.highlights).toEqual(expect.arrayContaining(['No Return', 'No Refund']));
  });
});

describe('evaluateClaimEligibility (refund/return money path)', () => {
  const deliveredAt = new Date('2026-07-01T10:00:00Z');

  it('is ineligible before delivery', () => {
    const r = evaluateClaimEligibility({
      policy: basePolicy,
      claimType: OrderClaimType.REFUND,
      reason: ReturnClaimReason.DAMAGED,
      deliveredAt: null,
      completedAt: null,
      requestedAmount: 100,
    });
    expect(r.eligible).toBe(false);
    expect(r.reason).toMatch(/not yet delivered/i);
  });

  it('is eligible within the return window', () => {
    const r = evaluateClaimEligibility({
      policy: basePolicy,
      claimType: OrderClaimType.REFUND,
      reason: ReturnClaimReason.DAMAGED,
      deliveredAt,
      completedAt: null,
      now: new Date(deliveredAt.getTime() + 60 * 60 * 1000), // +1h
      requestedAmount: 100,
    });
    expect(r.eligible).toBe(true);
  });

  it('rejects once the return window has expired', () => {
    const r = evaluateClaimEligibility({
      policy: basePolicy,
      claimType: OrderClaimType.REFUND,
      reason: ReturnClaimReason.DAMAGED,
      deliveredAt,
      completedAt: null,
      now: new Date(deliveredAt.getTime() + 49 * 60 * 60 * 1000), // +49h > 48h window
      requestedAmount: 100,
    });
    expect(r.eligible).toBe(false);
    expect(r.reason).toMatch(/expired/i);
  });

  it('blocks a claim type the product does not allow', () => {
    const r = evaluateClaimEligibility({
      policy: { ...basePolicy, isRefundable: false },
      claimType: OrderClaimType.REFUND,
      reason: ReturnClaimReason.DAMAGED,
      deliveredAt,
      completedAt: null,
      now: deliveredAt,
      requestedAmount: 100,
    });
    expect(r.eligible).toBe(false);
  });

  it('rejects "changed mind" when the product disallows it', () => {
    const r = evaluateClaimEligibility({
      policy: { ...basePolicy, allowCustomerChangedMind: false },
      claimType: OrderClaimType.RETURN,
      reason: ReturnClaimReason.CUSTOMER_CHANGED_MIND,
      deliveredAt,
      completedAt: null,
      now: deliveredAt,
      requestedAmount: 100,
    });
    expect(r.eligible).toBe(false);
  });

  it('auto-approves a small refund only when AUTO mode + under the cap', () => {
    const autoPolicy: ProductPolicyInput = {
      ...basePolicy,
      approvalMode: ClaimApprovalMode.AUTO,
      autoApproveBelowAmount: 200,
    };
    const under = evaluateClaimEligibility({
      policy: autoPolicy,
      claimType: OrderClaimType.REFUND,
      reason: ReturnClaimReason.DAMAGED,
      deliveredAt,
      completedAt: null,
      now: deliveredAt,
      requestedAmount: 150,
    });
    expect(under).toEqual({ eligible: true, autoApprove: true });

    const over = evaluateClaimEligibility({
      policy: autoPolicy,
      claimType: OrderClaimType.REFUND,
      reason: ReturnClaimReason.DAMAGED,
      deliveredAt,
      completedAt: null,
      now: deliveredAt,
      requestedAmount: 500, // above the ₹200 cap → must NOT auto-approve
    });
    expect(over.eligible).toBe(true);
    expect(over.autoApprove).toBe(false);
  });

  it('prepared-food NO_RETURN policy blocks all claim types', () => {
    const r = evaluateClaimEligibility({
      policy: { ...basePolicy, preparedFoodPolicy: PreparedFoodPolicy.NO_RETURN },
      claimType: OrderClaimType.REFUND,
      reason: ReturnClaimReason.DAMAGED,
      deliveredAt,
      completedAt: null,
      now: deliveredAt,
      requestedAmount: 50,
    });
    expect(r.eligible).toBe(false);
  });
});

describe('validateEvidenceForPolicy', () => {
  it('requires nothing for NONE', () => {
    expect(validateEvidenceForPolicy(basePolicy, 0, 0)).toBeNull();
  });

  it('enforces a photo when required', () => {
    const p = { ...basePolicy, proofRequired: ClaimProofRequirement.PHOTO };
    expect(validateEvidenceForPolicy(p, 0, 0)).toMatch(/photo/i);
    expect(validateEvidenceForPolicy(p, 1, 0)).toBeNull();
  });

  it('enforces both photo and video when required', () => {
    const p = { ...basePolicy, proofRequired: ClaimProofRequirement.PHOTO_AND_VIDEO };
    expect(validateEvidenceForPolicy(p, 0, 1)).toMatch(/photo/i);
    expect(validateEvidenceForPolicy(p, 1, 0)).toMatch(/video/i);
    expect(validateEvidenceForPolicy(p, 1, 1)).toBeNull();
  });
});
