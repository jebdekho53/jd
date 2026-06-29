export declare class ComboItemDto {
    menuItemId: string;
    quantity?: number;
}
export declare class CreateComboDto {
    name: string;
    slug?: string;
    description?: string;
    imageUrl?: string;
    comboPrice: number;
    sortOrder?: number;
    items: ComboItemDto[];
}
