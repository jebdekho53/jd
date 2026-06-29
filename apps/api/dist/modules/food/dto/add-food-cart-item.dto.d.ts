export declare class AddFoodCartItemDto {
    menuItemId: string;
    variantId?: string;
    comboId?: string;
    quantity?: number;
    addonIds?: string[];
    specialInstructions?: string;
}
export declare class UpdateFoodCartItemDto {
    quantity: number;
}
