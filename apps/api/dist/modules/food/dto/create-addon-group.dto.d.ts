import { AddonSelectionType, DietType } from '@prisma/client';
export declare class AddonDto {
    name: string;
    price?: number;
    dietType?: DietType;
}
export declare class CreateAddonGroupDto {
    name: string;
    selectionType?: AddonSelectionType;
    isRequired?: boolean;
    minSelections?: number;
    maxSelections?: number;
    sortOrder?: number;
    addons?: AddonDto[];
}
