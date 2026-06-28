import {
  ClaimApprovalMode,
  ClaimProofRequirement,
  OrderClaimType,
  PreparedFoodPolicy,
  ReturnClaimReason,
} from '@prisma/client';
import {
  evaluateClaimEligibility,
  formatReturnWindow,
  suggestDefaultReturnPolicy,
  validateEvidenceForPolicy,
} from './product-return-policy.util';

describe('product-return-policy.util', () => {
  const basePolicy = {
    isReturnable: true,
    isRefundable: true,
    isReplaceable: true,
    returnWindowHours: 72,
    approvalMode: ClaimApprovalMode.MANUAL,
    proofRequired: ClaimProofRequirement.PHOTO,
    autoApproveBelowAmount: null,
    returnReasons: [ReturnClaimReason.DAMAGED],
    restockingFee: 0,
    refundMethod: 'ORIGINAL_PAYMENT' as const,
    returnPolicyText: null,
    replacementPolicyText: null,
    preparedFoodPolicy: null,
    allowCustomerChangedMind: false,
  };

  it('formats return window', () => {
    expect(formatReturnWindow(2)).toBe('Within 2 Hours');
    expect(formatReturnWindow(72)).toBe('Within 3 Days');
  });

  it('rejects no-refund product', () => {
    const result = evaluateClaimEligibility({
      policy: { ...basePolicy, isRefundable: false, isReturnable: false, isReplaceable: false },
      claimType: OrderClaimType.REFUND,
      reason: ReturnClaimReason.DAMAGED,
      deliveredAt: new Date(),
      completedAt: null,
      requestedAmount: 100,
    });
    expect(result.eligible).toBe(false);
  });

  it('enforces food refund-only policy', () => {
    const result = evaluateClaimEligibility({
      policy: {
        ...basePolicy,
        isReturnable: false,
        isReplaceable: false,
        preparedFoodPolicy: PreparedFoodPolicy.REFUND_ONLY,
      },
      claimType: OrderClaimType.REPLACEMENT,
      reason: ReturnClaimReason.DAMAGED,
      deliveredAt: new Date(),
      completedAt: null,
      requestedAmount: 50,
    });
    expect(result.eligible).toBe(false);
  });

  it('blocks customer changed mind unless allowed', () => {
    const result = evaluateClaimEligibility({
      policy: basePolicy,
      claimType: OrderClaimType.REFUND,
      reason: ReturnClaimReason.CUSTOMER_CHANGED_MIND,
      deliveredAt: new Date(),
      completedAt: null,
      requestedAmount: 50,
    });
    expect(result.eligible).toBe(false);
  });

  it('auto approves below threshold', () => {
    const result = evaluateClaimEligibility({
      policy: {
        ...basePolicy,
        approvalMode: ClaimApprovalMode.AUTO,
        autoApproveBelowAmount: 200,
      },
      claimType: OrderClaimType.REFUND,
      reason: ReturnClaimReason.DAMAGED,
      deliveredAt: new Date(),
      completedAt: null,
      requestedAmount: 150,
    });
    expect(result.eligible).toBe(true);
    expect(result.autoApprove).toBe(true);
  });

  it('requires photo evidence when configured', () => {
    expect(
      validateEvidenceForPolicy(
        { ...basePolicy, proofRequired: ClaimProofRequirement.PHOTO },
        0,
        0,
      ),
    ).toContain('photo');
  });

  it('suggests dairy replacement window', () => {
    const suggestion = suggestDefaultReturnPolicy({
      productName: 'Amul Milk',
      categorySlug: 'dairy',
    });
    expect(suggestion.isReplaceable).toBe(true);
    expect(suggestion.returnWindowHours).toBe(2);
  });
});
