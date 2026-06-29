export declare class CreateAiWalletRechargeDto {
    amountPaise: number;
}
export declare class VerifyAiWalletRechargeDto {
    razorpayOrderId: string;
    razorpayPaymentId: string;
    razorpaySignature: string;
}
export declare class AdminAdjustAiWalletDto {
    amountPaise: number;
    reason: string;
}
