import { ReviewStatus } from '@prisma/client';
export declare class CreateStoreReviewDto {
    rating: number;
    storeExperience: number;
    deliveryExperience: number;
    productQuality: number;
    title?: string;
    review?: string;
    images?: string[];
}
export declare class UpdateStoreReviewDto {
    rating?: number;
    storeExperience?: number;
    deliveryExperience?: number;
    productQuality?: number;
    title?: string;
    review?: string;
    images?: string[];
}
export declare class MerchantReplyDto {
    reply: string;
}
export declare class ReportReviewDto {
    reason: string;
}
export declare class ModerateReviewDto {
    reason?: string;
}
export declare class ListStoreReviewsDto {
    page?: number;
    limit?: number;
    rating?: number;
    q?: string;
    status?: ReviewStatus;
}
