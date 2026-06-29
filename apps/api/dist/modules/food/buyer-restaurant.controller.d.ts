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
        data: {
            id: string;
            name: string;
            slug: string;
            bannerUrl: string | null;
            logoUrl: string | null;
            ratingAvg: number;
            ratingCount: number;
            avgPrepTimeMins: number;
            costForTwo: number | null;
            cuisines: {
                id: string;
                name: string;
                createdAt: Date;
                updatedAt: Date;
                description: string | null;
                isActive: boolean;
                slug: string;
                sortOrder: number;
                imageUrl: string | null;
            }[];
            businessTypes: import("@prisma/client").$Enums.VerticalBusinessType[];
            isCloudKitchen: boolean;
            distanceKm: number | null;
        }[];
    }>;
    getRestaurant(slug: string): Promise<{
        success: boolean;
        data: {
            id: string;
            name: string;
            slug: string;
            description: string | null;
            bannerUrl: string | null;
            logoUrl: string | null;
            ratingAvg: number;
            ratingCount: number;
            phone: string | null;
            line1: string;
            locality: string | null;
            pincode: string;
            latitude: number;
            longitude: number;
            avgPrepTimeMins: number;
            packagingFee: number;
            minOrderAmount: number;
            costForTwo: number | null;
            cuisines: {
                id: string;
                name: string;
                createdAt: Date;
                updatedAt: Date;
                description: string | null;
                isActive: boolean;
                slug: string;
                sortOrder: number;
                imageUrl: string | null;
            }[];
            reviews: {
                id: string;
                status: import("@prisma/client").$Enums.ReviewStatus;
                createdAt: Date;
                userId: string;
                updatedAt: Date;
                storeId: string;
                title: string | null;
                buyerProfileId: string;
                productId: string | null;
                orderId: string;
                rating: number;
                storeExperience: number;
                deliveryExperience: number;
                productQuality: number;
                comment: string | null;
                images: string[];
                verifiedPurchase: boolean;
                merchantReply: string | null;
                merchantRepliedAt: Date | null;
                reportedAt: Date | null;
                reportReason: string | null;
                moderatedBy: string | null;
                moderatedAt: Date | null;
            }[];
            acceptsScheduled: boolean;
        };
    }>;
    getMenu(slug: string): Promise<{
        success: boolean;
        data: {
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
                    packagingFee: import("@prisma/client/runtime/library").Decimal;
                    minOrderAmount: import("@prisma/client/runtime/library").Decimal;
                    acceptanceRate: number;
                    avgPrepTimeMins: number;
                    acceptsScheduled: boolean;
                    isCloudKitchen: boolean;
                    costForTwo: import("@prisma/client/runtime/library").Decimal | null;
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
                phone: string | null;
                email: string | null;
                id: string;
                status: import("@prisma/client").$Enums.StoreStatus;
                name: string;
                createdAt: Date;
                updatedAt: Date;
                deletedAt: Date | null;
                description: string | null;
                deliveryFee: import("@prisma/client/runtime/library").Decimal;
                minOrderAmount: import("@prisma/client/runtime/library").Decimal;
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
                requestedDocumentTypes: import("@prisma/client/runtime/library").JsonValue | null;
                avgPrepTimeMins: number;
                reputationStats: import("@prisma/client/runtime/library").JsonValue | null;
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
                                price: import("@prisma/client/runtime/library").Decimal;
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
                        price: import("@prisma/client/runtime/library").Decimal;
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
                    imageUrls: import("@prisma/client/runtime/library").JsonValue;
                    basePrice: import("@prisma/client/runtime/library").Decimal;
                    mrp: import("@prisma/client/runtime/library").Decimal | null;
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
                        imageUrls: import("@prisma/client/runtime/library").JsonValue;
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
                comboPrice: import("@prisma/client/runtime/library").Decimal;
            })[];
        };
    }>;
    listCuisines(): Promise<{
        success: boolean;
        data: {
            id: string;
            name: string;
            createdAt: Date;
            updatedAt: Date;
            description: string | null;
            isActive: boolean;
            slug: string;
            sortOrder: number;
            imageUrl: string | null;
        }[];
    }>;
}
