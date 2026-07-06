import { VerticalBusinessType } from '@prisma/client';
import { PrismaService } from '../../database/prisma.service';
export declare class RestaurantDiscoveryService {
    private readonly prisma;
    constructor(prisma: PrismaService);
    getHomeVerticals(): {
        label: string;
        slug: string;
        businessType: VerticalBusinessType;
        href: string;
    }[];
    listRestaurants(opts: {
        lat?: number;
        lng?: number;
        pincode?: string;
        cuisineSlug?: string;
        vertical?: VerticalBusinessType;
        page?: number;
        limit?: number;
    }): Promise<any>;
    getRestaurantDetail(slug: string): Promise<{
        id: any;
        name: any;
        slug: any;
        description: any;
        bannerUrl: any;
        logoUrl: any;
        ratingAvg: any;
        ratingCount: any;
        phone: any;
        line1: any;
        locality: any;
        pincode: any;
        latitude: any;
        longitude: any;
        avgPrepTimeMins: any;
        packagingFee: number;
        minOrderAmount: number;
        costForTwo: number | null;
        cuisines: any;
        reviews: any;
        acceptsScheduled: any;
    }>;
    listCuisines(): Promise<any>;
}
