import { RequestUser } from '../../common/types';
import { ProductReviewService } from './product-review.service';
import { CreateProductReviewDto, ListProductReviewsDto } from './dto/product-review.dto';
export declare class BuyerProductReviewController {
    private readonly reviews;
    constructor(reviews: ProductReviewService);
    list(productId: string, dto: ListProductReviewsDto): Promise<{
        success: boolean;
        data: any;
        meta: {
            page: number;
            limit: number;
            total: any;
            aggregate: {
                ratingAvg: any;
                ratingCount: any;
            };
        };
    }>;
    create(user: RequestUser, productId: string, dto: CreateProductReviewDto): Promise<{
        success: boolean;
        data: {
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
        };
    }>;
}
