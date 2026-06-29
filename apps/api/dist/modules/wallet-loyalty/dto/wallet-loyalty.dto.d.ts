export declare class ApplyReferralDto {
    code: string;
    deviceFingerprint?: string;
}
export declare class CheckoutWalletDto {
    walletAmountToUse?: number;
    rewardPointsToRedeem?: number;
    referralCode?: string;
    deviceFingerprint?: string;
}
export declare class AdminAdjustWalletDto {
    amount: number;
    reason: string;
}
export declare class AdminAdjustPointsDto {
    points: number;
    reason: string;
}
export declare class UpdateRewardConfigDto {
    value: Record<string, unknown>;
}
export declare class ResolveFraudReviewDto {
    approve: boolean;
}
