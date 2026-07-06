import { Body } from '@nestjs/common';
import { RequestUser } from '../../common/types';
import { FoodCartService } from './food-cart.service';
import { AddFoodCartItemDto, UpdateFoodCartItemDto } from './dto/add-food-cart-item.dto';
export declare class FoodCartController {
    private readonly foodCart;
    constructor(foodCart: FoodCartService);
    getCart(user: RequestUser): Promise<{
        success: boolean;
        data: {
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
                    packagingFee: Body;
                    minOrderAmount: Body | null;
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
        } | null;
    }>;
    addItem(user: RequestUser, dto: AddFoodCartItemDto): Promise<{
        success: boolean;
        data: {
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
                    packagingFee: Body;
                    minOrderAmount: Body | null;
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
        } | null;
    }>;
    updateItem(user: RequestUser, id: string, dto: UpdateFoodCartItemDto): Promise<{
        success: boolean;
        data: {
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
                    packagingFee: Body;
                    minOrderAmount: Body | null;
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
        } | null;
    }>;
    removeItem(user: RequestUser, id: string): Promise<{
        success: boolean;
        data: {
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
                    packagingFee: Body;
                    minOrderAmount: Body | null;
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
        } | null;
    }>;
    clearCart(user: RequestUser): Promise<{
        success: boolean;
        data: null;
    }>;
}
