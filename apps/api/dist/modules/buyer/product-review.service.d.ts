import { PrismaService } from '../../database/prisma.service';
import { CreateProductReviewDto, ListProductReviewsDto } from './dto/product-review.dto';
export declare class ProductReviewService {
    private readonly prisma;
    constructor(prisma: PrismaService);
    listProductReviews(productId: string, dto: ListProductReviewsDto): Promise<{
        reviews: {
            id: string;
            productId: string;
            rating: number;
            comment: string | null;
            images: string[];
            verifiedPurchase: boolean;
            buyer: {
                id: string;
                name: string;
            } | null;
            order: {
                id: string;
                orderNumber: string;
            } | null;
            createdAt: string;
        }[];
        aggregate: {
            ratingAvg: number;
            ratingCount: number;
        };
        page: number;
        limit: number;
        total: number;
    }>;
    getProductRatingSummary(productId: string): Promise<{
        ratingAvg: number;
        ratingCount: number;
    }>;
    createProductReview(userId: string, productId: string, dto: CreateProductReviewDto): Promise<{
        id: string;
        productId: string;
        rating: number;
        comment: string | null;
        images: string[];
        verifiedPurchase: boolean;
        buyer: {
            id: string;
            name: string;
        } | null;
        order: {
            id: string;
            orderNumber: string;
        } | null;
        createdAt: string;
    }>;
    private findVerifiedPurchase;
    private serialize;
}
