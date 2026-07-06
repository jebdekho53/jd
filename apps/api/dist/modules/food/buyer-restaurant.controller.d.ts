import { RestaurantDiscoveryService } from './restaurant-discovery.service';
import { MenuService } from './menu.service';
import { VerticalBusinessType } from '@prisma/client';
export declare class BuyerRestaurantController {
    private readonly discovery;
    private readonly menu;
    constructor(discovery: RestaurantDiscoveryService, menu: MenuService);
    getVerticals(): {
        success: boolean;
        data: {
            label: string;
            slug: string;
            businessType: VerticalBusinessType;
            href: string;
        }[];
    };
    listRestaurants(lat?: number, lng?: number, pincode?: string, cuisineSlug?: string, vertical?: VerticalBusinessType, page?: number, limit?: number): Promise<{
        success: boolean;
        data: any;
    }>;
    getRestaurant(slug: string): Promise<{
        success: boolean;
        data: {
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
        };
    }>;
    getMenu(slug: string): Promise<{
        success: boolean;
        data: {
            store: any;
            categories: any;
            combos: any;
        };
    }>;
    listCuisines(): Promise<{
        success: boolean;
        data: any;
    }>;
}
