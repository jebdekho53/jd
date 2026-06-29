import { PrismaService } from '../../database/prisma.service';
import { BuyerCacheService } from './buyer-cache.service';
import { DiscoverStoresDto } from './dto/discover-stores.dto';
export interface StoreCard {
    id: string;
    name: string;
    slug: string;
    logoUrl: string | null;
    bannerUrl: string | null;
    description: string | null;
    address: {
        line1: string;
        line2: string | null;
        pincode: string;
    };
    ratingAvg: number;
    ratingCount: number;
    deliveryFee: number;
    minOrderAmount: number;
    avgPrepTimeMins: number;
    distanceKm: number;
    isOpen: boolean;
    todayHours: {
        openTime: string;
        closeTime: string;
    } | null;
}
export interface StoreDetail extends StoreCard {
    phone: string | null;
    email: string | null;
    hours: {
        day: string;
        openTime: string;
        closeTime: string;
        isClosed: boolean;
    }[];
    serviceAreas: {
        id: string;
        name: string;
        pincode: string | null;
    }[];
    categories: {
        id: string;
        name: string;
        slug: string;
    }[];
    productCount: number;
    verifications: {
        gst: boolean;
        kyc: boolean;
        fssai: boolean;
    };
    merchantSince: string;
    deliveryRadiusKm: number;
}
export declare class BuyerStoreService {
    private readonly prisma;
    private readonly cache;
    private readonly logger;
    constructor(prisma: PrismaService, cache: BuyerCacheService);
    discoverStores(dto: DiscoverStoresDto): Promise<{
        stores: StoreCard[];
        total: number;
    }>;
    listStoresForCategory(categoryId: string, dto: DiscoverStoresDto & {
        subcategoryId?: string;
    }): Promise<{
        stores: (StoreCard & {
            productCount: number;
        })[];
        total: number;
    }>;
    getStoreBySlug(slug: string): Promise<StoreDetail>;
}
