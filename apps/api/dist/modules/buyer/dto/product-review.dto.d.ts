export declare const MAX_REVIEW_IMAGES = 5;
export declare class CreateProductReviewDto {
    rating: number;
    comment?: string;
    images?: string[];
    orderId?: string;
}
export declare class ListProductReviewsDto {
    page?: number;
    limit?: number;
}
