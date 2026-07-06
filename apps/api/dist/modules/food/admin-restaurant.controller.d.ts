import { VerticalBusinessType } from '@prisma/client';
import { RequestUser } from '../../common/types';
import { VerticalService } from './vertical.service';
import { RestaurantDiscoveryService } from './restaurant-discovery.service';
import { PrismaService } from '../../database/prisma.service';
export declare class AdminRestaurantController {
    private readonly vertical;
    private readonly discovery;
    private readonly prisma;
    constructor(vertical: VerticalService, discovery: RestaurantDiscoveryService, prisma: PrismaService);
    pendingApprovals(page?: number): Promise<{
        success: boolean;
        data: any;
    }>;
    approveType(user: RequestUser, storeId: string, businessType: VerticalBusinessType): Promise<{
        success: boolean;
        data: any;
    }>;
    rejectType(user: RequestUser, storeId: string, businessType: VerticalBusinessType, reason: string): Promise<{
        success: boolean;
        data: any;
    }>;
    listCuisines(): Promise<{
        success: boolean;
        data: any;
    }>;
    foodOrderAnalytics(days?: number): Promise<{
        success: boolean;
        data: {
            totalOrders: any;
            revenue: number;
            byStatus: any;
        };
    }>;
    popularDishes(limit?: number): Promise<{
        success: boolean;
        data: any;
    }>;
    pendingFoodCheckouts(page?: number): Promise<{
        success: boolean;
        data: {
            items: any;
            total: any;
            page: number;
        };
    }>;
    foodOrdersOverview(): Promise<{
        success: boolean;
        data: {
            pendingOnlineCheckouts: any;
            paidAwaitingKitchen: any;
            codActive: any;
            failedOrCancelled: any;
            readyForPickup: any;
            shadowfaxShipments: any;
        };
    }>;
}
