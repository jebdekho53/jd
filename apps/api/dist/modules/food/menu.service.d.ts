import { PrismaService } from '../../database/prisma.service';
import { StoreCategoryAccessService } from '../category-governance/store-category-access.service';
import { VerticalService } from '../store-vertical/vertical.service';
import { BuyerCacheService } from '../buyer/buyer-cache.service';
import { CreateMenuCategoryDto } from './dto/create-menu-category.dto';
import { CreateMenuItemDto } from './dto/create-menu-item.dto';
import { CreateAddonGroupDto } from './dto/create-addon-group.dto';
import { CreateComboDto } from './dto/create-combo.dto';
export declare class MenuService {
    private readonly prisma;
    private readonly categoryAccess;
    private readonly verticalService;
    private readonly buyerCache;
    constructor(prisma: PrismaService, categoryAccess: StoreCategoryAccessService, verticalService: VerticalService, buyerCache: BuyerCacheService);
    assertStoreOwnership(merchantProfileId: string, storeId: string): Promise<any>;
    private assertFoodBusinessTypeApproved;
    private invalidateBuyerMenuCache;
    private assertStoreFssai;
    getBuyerMenu(storeSlug: string): Promise<{
        store: any;
        categories: any;
        combos: any;
    }>;
    listCategories(merchantProfileId: string, storeId: string): Promise<any>;
    getMerchantMenu(merchantProfileId: string, storeId: string): Promise<{
        categories: any;
        addonGroups: any;
        combos: any;
    }>;
    createCategory(merchantProfileId: string, storeId: string, dto: CreateMenuCategoryDto): Promise<any>;
    createMenuItem(merchantProfileId: string, storeId: string, dto: CreateMenuItemDto): Promise<any>;
    createAddonGroup(merchantProfileId: string, storeId: string, dto: CreateAddonGroupDto): Promise<any>;
    linkAddonGroupToItem(merchantProfileId: string, storeId: string, menuItemId: string, groupId: string): Promise<any>;
    createCombo(merchantProfileId: string, storeId: string, dto: CreateComboDto): Promise<any>;
    upsertSearchIndex(menuItemId: string): Promise<void>;
}
