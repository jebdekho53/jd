import { InventoryForecastUrgency } from '@prisma/client';
export interface InventoryForecastInput {
    availableQty: number;
    soldQty30d: number;
    leadTimeDays: number;
}
export interface InventoryForecastResult {
    daysUntilStockout: number;
    recommendedQty: number;
    urgency: InventoryForecastUrgency;
}
export declare function predictStockout(input: InventoryForecastInput): InventoryForecastResult;
