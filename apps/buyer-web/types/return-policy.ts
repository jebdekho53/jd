export interface ReturnPolicySummary {
  returnAllowed: boolean;
  refundAllowed: boolean;
  replacementAllowed: boolean;
  windowLabel: string | null;
  windowHours: number | null;
  proofRequired: string;
  proofLabel: string | null;
  approvalMode: string;
  refundMethod: string;
  restockingFee: number;
  returnReasons: string[];
  returnPolicyText: string | null;
  replacementPolicyText: string | null;
  preparedFoodPolicy: string | null;
  highlights: string[];
}
