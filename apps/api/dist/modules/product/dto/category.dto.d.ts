export declare class CreateCategoryDto {
    name: string;
    imageUrl?: string;
    parentId?: string;
    sortOrder?: number;
}
declare const UpdateCategoryDto_base: any;
export declare class UpdateCategoryDto extends UpdateCategoryDto_base {
    isActive?: boolean;
}
export {};
