import { FoodKitchenStatus } from '@prisma/client';
import { RequestUser } from '../../common/types';
import { FoodOrderService } from './food-order.service';
import { MenuService } from './menu.service';
import { MenuOcrService } from './menu-ocr.service';
import { CreateMenuCategoryDto } from './dto/create-menu-category.dto';
import { CreateMenuItemDto } from './dto/create-menu-item.dto';
import { CreateAddonGroupDto } from './dto/create-addon-group.dto';
import { CreateComboDto } from './dto/create-combo.dto';
import { MerchantService } from '../merchant/merchant.service';
export declare class MerchantRestaurantController {
    private readonly menu;
    private readonly foodOrder;
    private readonly menuOcr;
    private readonly merchantService;
    constructor(menu: MenuService, foodOrder: FoodOrderService, menuOcr: MenuOcrService, merchantService: MerchantService);
    private profileId;
    getMenu(user: RequestUser, storeId: string): Promise<{
        success: boolean;
        data: {
            categories: any;
            addonGroups: any;
            combos: any;
        };
    }>;
    listCategories(user: RequestUser, storeId: string): Promise<{
        success: boolean;
        data: any;
    }>;
    createCategory(user: RequestUser, storeId: string, dto: CreateMenuCategoryDto): Promise<{
        success: boolean;
        data: any;
    }>;
    createItem(user: RequestUser, storeId: string, dto: CreateMenuItemDto): Promise<{
        success: boolean;
        data: any;
    }>;
    createAddonGroup(user: RequestUser, storeId: string, dto: CreateAddonGroupDto): Promise<{
        success: boolean;
        data: any;
    }>;
    linkAddon(user: RequestUser, storeId: string, menuItemId: string, groupId: string): Promise<{
        success: boolean;
        data: any;
    }>;
    createCombo(user: RequestUser, storeId: string, dto: CreateComboDto): Promise<{
        success: boolean;
        data: any;
    }>;
    kitchenQueue(user: RequestUser, storeId: string): Promise<{
        success: boolean;
        data: {
            new: any;
            preparing: any;
            ready: any;
            completed: any;
        };
    }>;
    updateKitchenStatus(user: RequestUser, _storeId: string, orderId: string, status: FoodKitchenStatus): Promise<{
        success: boolean;
        data: any;
    }>;
    dashboard(user: RequestUser, storeId: string): Promise<{
        success: boolean;
        data: {
            todayOrders: any;
            cancelledOrders: any;
            revenue: number;
            acceptanceRate: any;
            avgPrepTimeMins: any;
            popularDishes: any;
            kitchenQueue: any;
        };
    }>;
    uploadMenuOcr(user: RequestUser, storeId: string, imageUrl: string): Promise<{
        success: boolean;
        data: any;
    }>;
    getOcrJob(user: RequestUser, storeId: string, jobId: string): Promise<{
        success: boolean;
        data: any;
    }>;
    publishOcr(user: RequestUser, storeId: string, jobId: string): Promise<{
        success: boolean;
        data: any;
    }>;
}
export declare class MerchantFoodOrderController {
    private readonly foodOrder;
    constructor(foodOrder: FoodOrderService);
    accept(user: RequestUser, orderId: string): Promise<{
        success: boolean;
        data: any;
    }>;
    preparing(user: RequestUser, orderId: string): Promise<{
        success: boolean;
        data: any;
    }>;
    ready(user: RequestUser, orderId: string): Promise<{
        success: boolean;
        data: any;
    }>;
}
