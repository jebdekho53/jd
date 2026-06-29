import { CreateProductDto } from './create-product.dto';
declare const UpdateProductDto_base: import("@nestjs/common").Type<Partial<Omit<CreateProductDto, "quantity" | "lowStockThreshold" | "variants">>>;
export declare class UpdateProductDto extends UpdateProductDto_base {
}
export {};
