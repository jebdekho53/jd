export declare class CreatePayoutRequestDto {
    amount: number;
    accountHolderName: string;
    accountNumber: string;
    ifsc: string;
    bankName?: string;
}
export declare class RejectPayoutRequestDto {
    reason: string;
}
export declare class ListSettlementsQueryDto {
    status?: string;
    page?: number;
    limit?: number;
}
