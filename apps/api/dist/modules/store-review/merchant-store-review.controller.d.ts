import { RequestUser } from '../../common/types';
import { StoreReviewService } from './store-review.service';
import { ListStoreReviewsDto, MerchantReplyDto } from './dto/store-review.dto';
export declare class MerchantStoreReviewController {
    private readonly service;
    constructor(service: StoreReviewService);
    overview(user: RequestUser, storeId: string): Promise<{
        success: boolean;
        data: {
            lowRatingAlerts: number;
            recentReviews: number;
            averageRating: number;
            totalReviews: number;
            distribution: Record<"1" | "2" | "3" | "4" | "5", number>;
            distributionPct: Record<"1" | "2" | "3" | "4" | "5", number>;
            repeatCustomers: number;
            responseRate: number;
            rankingScore: number;
        };
    }>;
    list(user: RequestUser, storeId: string, dto: ListStoreReviewsDto): Promise<{
        success: boolean;
        data: {
            id: any;
            orderId: any;
            storeId: any;
            rating: any;
            storeExperience: any;
            deliveryExperience: any;
            productQuality: any;
            title: any;
            review: any;
            images: any;
            verifiedPurchase: any;
            merchantReply: any;
            merchantRepliedAt: any;
            status: any;
            reportedAt: any;
            reportReason: any;
            buyer: {
                id: any;
                name: any;
            } | null;
            order: {
                id: any;
                orderNumber: any;
            } | null;
            store: {
                id: any;
                name: any;
                slug: any;
            } | null;
            createdAt: any;
            updatedAt: any;
        }[];
        meta: {
            page: number;
            limit: number;
            total: number;
        };
    }>;
    reply(user: RequestUser, storeId: string, reviewId: string, dto: MerchantReplyDto): Promise<{
        success: boolean;
        data: {
            id: any;
            orderId: any;
            storeId: any;
            rating: any;
            storeExperience: any;
            deliveryExperience: any;
            productQuality: any;
            title: any;
            review: any;
            images: any;
            verifiedPurchase: any;
            merchantReply: any;
            merchantRepliedAt: any;
            status: any;
            reportedAt: any;
            reportReason: any;
            buyer: {
                id: any;
                name: any;
            } | null;
            order: {
                id: any;
                orderNumber: any;
            } | null;
            store: {
                id: any;
                name: any;
                slug: any;
            } | null;
            createdAt: any;
            updatedAt: any;
        };
    }>;
}
