import { ReviewStatus } from '@prisma/client';
import { PrismaService } from '../../database/prisma.service';
import { StoreReputationService } from './store-reputation.service';
import { CreateStoreReviewDto, ListStoreReviewsDto, MerchantReplyDto, ReportReviewDto, UpdateStoreReviewDto } from './dto/store-review.dto';
export declare class StoreReviewService {
    private readonly prisma;
    private readonly reputation;
    constructor(prisma: PrismaService, reputation: StoreReputationService);
    createReview(userId: string, orderId: string, dto: CreateStoreReviewDto): Promise<{
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
    }>;
    getOrderReview(userId: string, orderId: string): Promise<{
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
    } | null>;
    updateReview(userId: string, orderId: string, dto: UpdateStoreReviewDto): Promise<{
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
    }>;
    reportReview(userId: string, reviewId: string, dto: ReportReviewDto): Promise<{
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
    }>;
    listPublicStoreReviews(storeSlug: string, dto: ListStoreReviewsDto): Promise<{
        reviews: any;
        total: any;
        page: number;
        limit: number;
    }>;
    getPublicStoreReputation(storeSlug: string): Promise<import("./store-reputation.service").StoreReputationView>;
    listMerchantReviews(userId: string, storeId: string, dto: ListStoreReviewsDto): Promise<{
        reviews: any;
        total: any;
        page: number;
        limit: number;
    }>;
    getMerchantOverview(userId: string, storeId: string): Promise<{
        lowRatingAlerts: any;
        recentReviews: any;
        averageRating: number;
        totalReviews: number;
        distribution: Record<"1" | "2" | "3" | "4" | "5", number>;
        distributionPct: Record<"1" | "2" | "3" | "4" | "5", number>;
        repeatCustomers: number;
        responseRate: number;
        rankingScore: number;
    }>;
    replyToReview(userId: string, storeId: string, reviewId: string, dto: MerchantReplyDto): Promise<{
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
    }>;
    listAdminReviews(dto: ListStoreReviewsDto & {
        status?: ReviewStatus;
    }): Promise<{
        reviews: any;
        total: any;
        page: number;
        limit: number;
    }>;
    moderateReview(reviewId: string, adminUserId: string, action: 'approve' | 'hide' | 'restore' | 'remove', reason?: string): Promise<{
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
    }>;
    getPlatformAnalytics(): Promise<{
        platformRating: any;
        totalReviews: any;
        distribution: {
            [k: string]: any;
        };
        worstRatedStores: any;
        bestRatedStores: any;
    }>;
    private listStoreReviews;
    private serializeReview;
    private requireBuyerProfile;
    private requireVisibleStore;
    private assertStoreOwned;
}
