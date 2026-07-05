import { Prisma } from '@prisma/client';
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
    assertStoreOwnership(merchantProfileId: string, storeId: string): Promise<{
        id: string;
        status: import("@prisma/client").$Enums.StoreStatus;
        name: string;
        createdAt: Date;
        email: string | null;
        phone: string | null;
        updatedAt: Date;
        deletedAt: Date | null;
        description: string | null;
        deliveryFee: Prisma.Decimal;
        minOrderAmount: Prisma.Decimal;
        isActive: boolean;
        ratingAvg: number;
        ratingCount: number;
        latitude: number;
        longitude: number;
        submittedAt: Date | null;
        rejectionReason: string | null;
        merchantProfileId: string;
        cityId: string;
        slug: string;
        logoUrl: string | null;
        bannerUrl: string | null;
        line1: string;
        line2: string | null;
        pincode: string;
        locality: string | null;
        locationPincodeId: string | null;
        locationAreaId: string | null;
        locationCityId: string | null;
        deliveryRadiusKm: number;
        storeType: import("@prisma/client").$Enums.StoreType;
        reviewedAt: Date | null;
        reviewedBy: string | null;
        rejectionType: import("@prisma/client").$Enums.RejectionType | null;
        rejectionRevokedAt: Date | null;
        rejectionRevokedBy: string | null;
        rejectionRevokeReason: string | null;
        documentRequestReason: string | null;
        documentRequestAt: Date | null;
        documentRequestBy: string | null;
        requestedDocumentTypes: Prisma.JsonValue | null;
        avgPrepTimeMins: number;
        reputationStats: Prisma.JsonValue | null;
    }>;
    private assertFoodBusinessTypeApproved;
    private invalidateBuyerMenuCache;
    private assertStoreFssai;
    getBuyerMenu(storeSlug: string): Promise<{
        store: {
            restaurantProfile: ({
                cuisines: ({
                    cuisine: {
                        id: string;
                        name: string;
                        createdAt: Date;
                        updatedAt: Date;
                        description: string | null;
                        isActive: boolean;
                        slug: string;
                        sortOrder: number;
                        imageUrl: string | null;
                    };
                } & {
                    id: string;
                    storeId: string;
                    cuisineId: string;
                })[];
            } & {
                id: string;
                createdAt: Date;
                updatedAt: Date;
                storeId: string;
                packagingFee: Prisma.Decimal;
                minOrderAmount: Prisma.Decimal;
                acceptanceRate: number;
                avgPrepTimeMins: number;
                acceptsScheduled: boolean;
                isCloudKitchen: boolean;
                costForTwo: Prisma.Decimal | null;
            }) | null;
            businessTypes: {
                id: string;
                status: import("@prisma/client").$Enums.StoreBusinessTypeStatus;
                createdAt: Date;
                updatedAt: Date;
                storeId: string;
                rejectionReason: string | null;
                reviewedAt: Date | null;
                reviewedBy: string | null;
                businessType: import("@prisma/client").$Enums.VerticalBusinessType;
                isPrimary: boolean;
            }[];
        } & {
            id: string;
            status: import("@prisma/client").$Enums.StoreStatus;
            name: string;
            createdAt: Date;
            email: string | null;
            phone: string | null;
            updatedAt: Date;
            deletedAt: Date | null;
            description: string | null;
            deliveryFee: Prisma.Decimal;
            minOrderAmount: Prisma.Decimal;
            isActive: boolean;
            ratingAvg: number;
            ratingCount: number;
            latitude: number;
            longitude: number;
            submittedAt: Date | null;
            rejectionReason: string | null;
            merchantProfileId: string;
            cityId: string;
            slug: string;
            logoUrl: string | null;
            bannerUrl: string | null;
            line1: string;
            line2: string | null;
            pincode: string;
            locality: string | null;
            locationPincodeId: string | null;
            locationAreaId: string | null;
            locationCityId: string | null;
            deliveryRadiusKm: number;
            storeType: import("@prisma/client").$Enums.StoreType;
            reviewedAt: Date | null;
            reviewedBy: string | null;
            rejectionType: import("@prisma/client").$Enums.RejectionType | null;
            rejectionRevokedAt: Date | null;
            rejectionRevokedBy: string | null;
            rejectionRevokeReason: string | null;
            documentRequestReason: string | null;
            documentRequestAt: Date | null;
            documentRequestBy: string | null;
            requestedDocumentTypes: Prisma.JsonValue | null;
            avgPrepTimeMins: number;
            reputationStats: Prisma.JsonValue | null;
        };
        categories: ({
            items: ({
                addonGroups: ({
                    group: {
                        addons: {
                            id: string;
                            name: string;
                            createdAt: Date;
                            updatedAt: Date;
                            isActive: boolean;
                            sortOrder: number;
                            price: Prisma.Decimal;
                            dietType: import("@prisma/client").$Enums.DietType | null;
                            availability: import("@prisma/client").$Enums.MenuItemAvailability;
                            groupId: string;
                        }[];
                    } & {
                        id: string;
                        name: string;
                        createdAt: Date;
                        updatedAt: Date;
                        storeId: string;
                        isActive: boolean;
                        sortOrder: number;
                        selectionType: import("@prisma/client").$Enums.AddonSelectionType;
                        isRequired: boolean;
                        minSelections: number;
                        maxSelections: number;
                    };
                } & {
                    id: string;
                    sortOrder: number;
                    menuItemId: string;
                    groupId: string;
                })[];
                variants: {
                    id: string;
                    name: string;
                    createdAt: Date;
                    updatedAt: Date;
                    sortOrder: number;
                    isDefault: boolean;
                    price: Prisma.Decimal;
                    availability: import("@prisma/client").$Enums.MenuItemAvailability;
                    menuItemId: string;
                }[];
            } & {
                id: string;
                name: string;
                createdAt: Date;
                updatedAt: Date;
                description: string | null;
                storeId: string;
                categoryId: string;
                isActive: boolean;
                ratingAvg: number;
                ratingCount: number;
                slug: string;
                sortOrder: number;
                imageUrls: Prisma.JsonValue;
                basePrice: Prisma.Decimal;
                mrp: Prisma.Decimal | null;
                dietType: import("@prisma/client").$Enums.DietType;
                spiceLevel: import("@prisma/client").$Enums.SpiceLevel | null;
                prepTimeMins: number;
                servingSize: string | null;
                cuisineName: string | null;
                availability: import("@prisma/client").$Enums.MenuItemAvailability;
                allowsSpecialInstructions: boolean;
                isCombo: boolean;
                orderCount: number;
            })[];
        } & {
            id: string;
            name: string;
            createdAt: Date;
            updatedAt: Date;
            description: string | null;
            storeId: string;
            isActive: boolean;
            slug: string;
            sortOrder: number;
            imageUrl: string | null;
            platformCategoryId: string | null;
            categorySlug: import("@prisma/client").$Enums.MenuCategorySlug | null;
        })[];
        combos: ({
            items: ({
                menuItem: {
                    id: string;
                    name: string;
                    imageUrls: Prisma.JsonValue;
                    dietType: import("@prisma/client").$Enums.DietType;
                };
            } & {
                id: string;
                quantity: number;
                sortOrder: number;
                menuItemId: string;
                comboId: string;
            })[];
        } & {
            id: string;
            name: string;
            createdAt: Date;
            updatedAt: Date;
            description: string | null;
            storeId: string;
            isActive: boolean;
            slug: string;
            sortOrder: number;
            imageUrl: string | null;
            comboPrice: Prisma.Decimal;
        })[];
    }>;
    listCategories(merchantProfileId: string, storeId: string): Promise<({
        _count: {
            items: number;
        };
        platformCategory: {
            id: string;
            name: string;
            slug: string;
            catalogKind: import("@prisma/client").$Enums.CategoryCatalogKind;
        } | null;
    } & {
        id: string;
        name: string;
        createdAt: Date;
        updatedAt: Date;
        description: string | null;
        storeId: string;
        isActive: boolean;
        slug: string;
        sortOrder: number;
        imageUrl: string | null;
        platformCategoryId: string | null;
        categorySlug: import("@prisma/client").$Enums.MenuCategorySlug | null;
    })[]>;
    getMerchantMenu(merchantProfileId: string, storeId: string): Promise<{
        categories: ({
            items: ({
                addonGroups: ({
                    group: {
                        addons: {
                            id: string;
                            name: string;
                            createdAt: Date;
                            updatedAt: Date;
                            isActive: boolean;
                            sortOrder: number;
                            price: Prisma.Decimal;
                            dietType: import("@prisma/client").$Enums.DietType | null;
                            availability: import("@prisma/client").$Enums.MenuItemAvailability;
                            groupId: string;
                        }[];
                    } & {
                        id: string;
                        name: string;
                        createdAt: Date;
                        updatedAt: Date;
                        storeId: string;
                        isActive: boolean;
                        sortOrder: number;
                        selectionType: import("@prisma/client").$Enums.AddonSelectionType;
                        isRequired: boolean;
                        minSelections: number;
                        maxSelections: number;
                    };
                } & {
                    id: string;
                    sortOrder: number;
                    menuItemId: string;
                    groupId: string;
                })[];
                variants: {
                    id: string;
                    name: string;
                    createdAt: Date;
                    updatedAt: Date;
                    sortOrder: number;
                    isDefault: boolean;
                    price: Prisma.Decimal;
                    availability: import("@prisma/client").$Enums.MenuItemAvailability;
                    menuItemId: string;
                }[];
            } & {
                id: string;
                name: string;
                createdAt: Date;
                updatedAt: Date;
                description: string | null;
                storeId: string;
                categoryId: string;
                isActive: boolean;
                ratingAvg: number;
                ratingCount: number;
                slug: string;
                sortOrder: number;
                imageUrls: Prisma.JsonValue;
                basePrice: Prisma.Decimal;
                mrp: Prisma.Decimal | null;
                dietType: import("@prisma/client").$Enums.DietType;
                spiceLevel: import("@prisma/client").$Enums.SpiceLevel | null;
                prepTimeMins: number;
                servingSize: string | null;
                cuisineName: string | null;
                availability: import("@prisma/client").$Enums.MenuItemAvailability;
                allowsSpecialInstructions: boolean;
                isCombo: boolean;
                orderCount: number;
            })[];
            platformCategory: {
                id: string;
                name: string;
                slug: string;
            } | null;
        } & {
            id: string;
            name: string;
            createdAt: Date;
            updatedAt: Date;
            description: string | null;
            storeId: string;
            isActive: boolean;
            slug: string;
            sortOrder: number;
            imageUrl: string | null;
            platformCategoryId: string | null;
            categorySlug: import("@prisma/client").$Enums.MenuCategorySlug | null;
        })[];
        addonGroups: ({
            addons: {
                id: string;
                name: string;
                createdAt: Date;
                updatedAt: Date;
                isActive: boolean;
                sortOrder: number;
                price: Prisma.Decimal;
                dietType: import("@prisma/client").$Enums.DietType | null;
                availability: import("@prisma/client").$Enums.MenuItemAvailability;
                groupId: string;
            }[];
        } & {
            id: string;
            name: string;
            createdAt: Date;
            updatedAt: Date;
            storeId: string;
            isActive: boolean;
            sortOrder: number;
            selectionType: import("@prisma/client").$Enums.AddonSelectionType;
            isRequired: boolean;
            minSelections: number;
            maxSelections: number;
        })[];
        combos: ({
            items: ({
                menuItem: {
                    id: string;
                    name: string;
                };
            } & {
                id: string;
                quantity: number;
                sortOrder: number;
                menuItemId: string;
                comboId: string;
            })[];
        } & {
            id: string;
            name: string;
            createdAt: Date;
            updatedAt: Date;
            description: string | null;
            storeId: string;
            isActive: boolean;
            slug: string;
            sortOrder: number;
            imageUrl: string | null;
            comboPrice: Prisma.Decimal;
        })[];
    }>;
    createCategory(merchantProfileId: string, storeId: string, dto: CreateMenuCategoryDto): Promise<{
        platformCategory: {
            id: string;
            name: string;
            slug: string;
        } | null;
    } & {
        id: string;
        name: string;
        createdAt: Date;
        updatedAt: Date;
        description: string | null;
        storeId: string;
        isActive: boolean;
        slug: string;
        sortOrder: number;
        imageUrl: string | null;
        platformCategoryId: string | null;
        categorySlug: import("@prisma/client").$Enums.MenuCategorySlug | null;
    }>;
    createMenuItem(merchantProfileId: string, storeId: string, dto: CreateMenuItemDto): Promise<{
        variants: {
            id: string;
            name: string;
            createdAt: Date;
            updatedAt: Date;
            sortOrder: number;
            isDefault: boolean;
            price: Prisma.Decimal;
            availability: import("@prisma/client").$Enums.MenuItemAvailability;
            menuItemId: string;
        }[];
    } & {
        id: string;
        name: string;
        createdAt: Date;
        updatedAt: Date;
        description: string | null;
        storeId: string;
        categoryId: string;
        isActive: boolean;
        ratingAvg: number;
        ratingCount: number;
        slug: string;
        sortOrder: number;
        imageUrls: Prisma.JsonValue;
        basePrice: Prisma.Decimal;
        mrp: Prisma.Decimal | null;
        dietType: import("@prisma/client").$Enums.DietType;
        spiceLevel: import("@prisma/client").$Enums.SpiceLevel | null;
        prepTimeMins: number;
        servingSize: string | null;
        cuisineName: string | null;
        availability: import("@prisma/client").$Enums.MenuItemAvailability;
        allowsSpecialInstructions: boolean;
        isCombo: boolean;
        orderCount: number;
    }>;
    createAddonGroup(merchantProfileId: string, storeId: string, dto: CreateAddonGroupDto): Promise<{
        addons: {
            id: string;
            name: string;
            createdAt: Date;
            updatedAt: Date;
            isActive: boolean;
            sortOrder: number;
            price: Prisma.Decimal;
            dietType: import("@prisma/client").$Enums.DietType | null;
            availability: import("@prisma/client").$Enums.MenuItemAvailability;
            groupId: string;
        }[];
    } & {
        id: string;
        name: string;
        createdAt: Date;
        updatedAt: Date;
        storeId: string;
        isActive: boolean;
        sortOrder: number;
        selectionType: import("@prisma/client").$Enums.AddonSelectionType;
        isRequired: boolean;
        minSelections: number;
        maxSelections: number;
    }>;
    linkAddonGroupToItem(merchantProfileId: string, storeId: string, menuItemId: string, groupId: string): Promise<{
        id: string;
        sortOrder: number;
        menuItemId: string;
        groupId: string;
    }>;
    createCombo(merchantProfileId: string, storeId: string, dto: CreateComboDto): Promise<{
        items: ({
            menuItem: {
                id: string;
                name: string;
                createdAt: Date;
                updatedAt: Date;
                description: string | null;
                storeId: string;
                categoryId: string;
                isActive: boolean;
                ratingAvg: number;
                ratingCount: number;
                slug: string;
                sortOrder: number;
                imageUrls: Prisma.JsonValue;
                basePrice: Prisma.Decimal;
                mrp: Prisma.Decimal | null;
                dietType: import("@prisma/client").$Enums.DietType;
                spiceLevel: import("@prisma/client").$Enums.SpiceLevel | null;
                prepTimeMins: number;
                servingSize: string | null;
                cuisineName: string | null;
                availability: import("@prisma/client").$Enums.MenuItemAvailability;
                allowsSpecialInstructions: boolean;
                isCombo: boolean;
                orderCount: number;
            };
        } & {
            id: string;
            quantity: number;
            sortOrder: number;
            menuItemId: string;
            comboId: string;
        })[];
    } & {
        id: string;
        name: string;
        createdAt: Date;
        updatedAt: Date;
        description: string | null;
        storeId: string;
        isActive: boolean;
        slug: string;
        sortOrder: number;
        imageUrl: string | null;
        comboPrice: Prisma.Decimal;
    }>;
    upsertSearchIndex(menuItemId: string): Promise<void>;
}
