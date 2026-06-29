import { Prisma } from '@prisma/client';
import { PrismaService } from '../../database/prisma.service';
import { AddFoodCartItemDto, UpdateFoodCartItemDto } from './dto/add-food-cart-item.dto';
export declare class FoodCartService {
    private readonly prisma;
    constructor(prisma: PrismaService);
    private getBuyerProfileId;
    getFoodCart(userId: string): Promise<{
        id: string;
        storeId: string;
        store: {
            minOrderAmount: number;
            deliveryFee: number;
            packagingFee: number;
            id: string;
            name: string;
            slug: string;
            restaurantProfile: {
                packagingFee: Prisma.Decimal;
                minOrderAmount: Prisma.Decimal | null;
            } | null;
        };
        items: {
            id: string;
            menuItemId: string;
            variantId: string | null;
            quantity: number;
            unitPrice: number;
            lineTotal: number;
            specialInstructions: string | null;
            menuItem: {
                imageUrls: any[];
                id: string;
                name: string;
                dietType: string;
            };
            variantName: string | undefined;
            addons: {
                name: string;
                price: number;
            }[];
        }[];
        totals: {
            subtotal: number;
            packagingFee: number;
            deliveryFee: number;
            tax: number;
            grandTotal: number;
        };
        itemCount: number;
    } | null>;
    addItem(userId: string, dto: AddFoodCartItemDto): Promise<{
        id: string;
        storeId: string;
        store: {
            minOrderAmount: number;
            deliveryFee: number;
            packagingFee: number;
            id: string;
            name: string;
            slug: string;
            restaurantProfile: {
                packagingFee: Prisma.Decimal;
                minOrderAmount: Prisma.Decimal | null;
            } | null;
        };
        items: {
            id: string;
            menuItemId: string;
            variantId: string | null;
            quantity: number;
            unitPrice: number;
            lineTotal: number;
            specialInstructions: string | null;
            menuItem: {
                imageUrls: any[];
                id: string;
                name: string;
                dietType: string;
            };
            variantName: string | undefined;
            addons: {
                name: string;
                price: number;
            }[];
        }[];
        totals: {
            subtotal: number;
            packagingFee: number;
            deliveryFee: number;
            tax: number;
            grandTotal: number;
        };
        itemCount: number;
    } | null>;
    private validateAndPriceAddons;
    private buildAddonRows;
    updateItem(userId: string, cartItemId: string, dto: UpdateFoodCartItemDto): Promise<{
        id: string;
        storeId: string;
        store: {
            minOrderAmount: number;
            deliveryFee: number;
            packagingFee: number;
            id: string;
            name: string;
            slug: string;
            restaurantProfile: {
                packagingFee: Prisma.Decimal;
                minOrderAmount: Prisma.Decimal | null;
            } | null;
        };
        items: {
            id: string;
            menuItemId: string;
            variantId: string | null;
            quantity: number;
            unitPrice: number;
            lineTotal: number;
            specialInstructions: string | null;
            menuItem: {
                imageUrls: any[];
                id: string;
                name: string;
                dietType: string;
            };
            variantName: string | undefined;
            addons: {
                name: string;
                price: number;
            }[];
        }[];
        totals: {
            subtotal: number;
            packagingFee: number;
            deliveryFee: number;
            tax: number;
            grandTotal: number;
        };
        itemCount: number;
    } | null>;
    removeItem(userId: string, cartItemId: string): Promise<{
        id: string;
        storeId: string;
        store: {
            minOrderAmount: number;
            deliveryFee: number;
            packagingFee: number;
            id: string;
            name: string;
            slug: string;
            restaurantProfile: {
                packagingFee: Prisma.Decimal;
                minOrderAmount: Prisma.Decimal | null;
            } | null;
        };
        items: {
            id: string;
            menuItemId: string;
            variantId: string | null;
            quantity: number;
            unitPrice: number;
            lineTotal: number;
            specialInstructions: string | null;
            menuItem: {
                imageUrls: any[];
                id: string;
                name: string;
                dietType: string;
            };
            variantName: string | undefined;
            addons: {
                name: string;
                price: number;
            }[];
        }[];
        totals: {
            subtotal: number;
            packagingFee: number;
            deliveryFee: number;
            tax: number;
            grandTotal: number;
        };
        itemCount: number;
    } | null>;
    clearCart(userId: string): Promise<null>;
    private cleanupEmptyCart;
    private toCartView;
}
