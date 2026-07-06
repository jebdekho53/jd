import { RequestUser } from '../../common/types';
import { PurchaseRecommendationService } from './purchase-recommendation.service';
import { ProcurementMarketplaceService } from './procurement-marketplace.service';
import { ProcurementCartService } from './procurement-cart.service';
import { ProcurementOrderService } from './procurement-order.service';
import { ProcurementAnalyticsService } from './procurement-analytics.service';
import { AddCartItemDto, CreateVendorOrderDto, ProcurementQueryDto, UpdateCartDto } from './dto/procurement.dto';
import { PrismaService } from '../../database/prisma.service';
export declare class MerchantProcurementController {
    private readonly recommendations;
    private readonly marketplace;
    private readonly cart;
    private readonly orders;
    private readonly analytics;
    private readonly prisma;
    constructor(recommendations: PurchaseRecommendationService, marketplace: ProcurementMarketplaceService, cart: ProcurementCartService, orders: ProcurementOrderService, analytics: ProcurementAnalyticsService, prisma: PrismaService);
    private merchantId;
    getRecommendations(user: RequestUser, query: ProcurementQueryDto): Promise<{
        success: boolean;
        data: any;
    }>;
    vendors(query: ProcurementQueryDto): Promise<{
        success: boolean;
        data: any;
    }>;
    products(query: ProcurementQueryDto): Promise<{
        success: boolean;
        data: any;
    }>;
    credit(user: RequestUser): Promise<{
        success: boolean;
        data: any;
    }>;
    getCart(user: RequestUser, query: ProcurementQueryDto): Promise<{
        success: boolean;
        data: any;
    }>;
    updateCart(user: RequestUser, dto: UpdateCartDto): Promise<{
        success: boolean;
        data: any;
    }>;
    addCartItem(user: RequestUser, dto: AddCartItemDto, query: ProcurementQueryDto): Promise<{
        success: boolean;
        data: any;
    }>;
    createOrder(user: RequestUser, dto: CreateVendorOrderDto): Promise<{
        success: boolean;
        data: any;
    }>;
    listOrders(user: RequestUser, query: ProcurementQueryDto): Promise<{
        success: boolean;
        data: any;
    }>;
    getAnalytics(user: RequestUser, query: ProcurementQueryDto): Promise<{
        success: boolean;
        data: {};
    }>;
}
