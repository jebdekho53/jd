export interface CompareStoreOffer {
    storeId: string;
    storeName: string;
    storeSlug: string;
    productId: string;
    variantId: string;
    price: number;
    offerPrice: number;
    mrp: number | null;
    discount: number;
    discountPercent: number;
    deliveryFee: number;
    minimumOrder: number;
    distanceKm: number | null;
    etaMins: number | null;
    rating: number | null;
    stock: number;
    finalPayableAmount: number;
    serviceable: boolean;
    cheapest: boolean;
    deliveryPartner: string;
}
export interface CompareProductResult {
    productId: string;
    name: string;
    unit: string;
    imageUrl: string | null;
    bestPrice: number;
    savings: number;
    savingsPercent: number;
    stores: CompareStoreOffer[];
}
export declare function buildCompareResult(anchor: {
    id: string;
    name: string;
    unit: string;
    imageUrls: string[];
}, offers: CompareStoreOffer[]): CompareProductResult | null;
