import { RequestUser } from '../../common/types';
import { StoreReviewService } from './store-review.service';
import { ListStoreReviewsDto, ModerateReviewDto } from './dto/store-review.dto';
export declare class AdminStoreReviewController {
    private readonly service;
    constructor(service: StoreReviewService);
    list(dto: ListStoreReviewsDto): Promise<{
        success: boolean;
        data: any;
        meta: {
            page: number;
            limit: number;
            total: any;
        };
    }>;
    analytics(): Promise<{
        success: boolean;
        data: {
            platformRating: any;
            totalReviews: any;
            distribution: {
                [k: string]: any;
            };
            worstRatedStores: any;
            bestRatedStores: any;
        };
    }>;
    approve(user: RequestUser, id: string): Promise<{
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
    hide(user: RequestUser, id: string, dto: ModerateReviewDto): Promise<{
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
    restore(user: RequestUser, id: string): Promise<{
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
    remove(user: RequestUser, id: string, dto: ModerateReviewDto): Promise<{
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
