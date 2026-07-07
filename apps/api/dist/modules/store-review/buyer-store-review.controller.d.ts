import { RequestUser } from '../../common/types';
import { StoreReviewService } from './store-review.service';
import { CreateStoreReviewDto, ListStoreReviewsDto, ReportReviewDto, UpdateStoreReviewDto } from './dto/store-review.dto';
export declare class BuyerStoreReviewController {
    private readonly service;
    constructor(service: StoreReviewService);
    create(user: RequestUser, orderId: string, dto: CreateStoreReviewDto): Promise<{
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
    get(user: RequestUser, orderId: string): Promise<{
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
        } | null;
    }>;
    update(user: RequestUser, orderId: string, dto: UpdateStoreReviewDto): Promise<{
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
    report(user: RequestUser, reviewId: string, dto: ReportReviewDto): Promise<{
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
export declare class PublicStoreReviewController {
    private readonly service;
    constructor(service: StoreReviewService);
    list(slug: string, dto: ListStoreReviewsDto): Promise<{
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
    reputation(slug: string): Promise<{
        success: boolean;
        data: import("./store-reputation.service").StoreReputationView;
    }>;
}
