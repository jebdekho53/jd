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

export function predictStockout(input: InventoryForecastInput): InventoryForecastResult {
  const dailyVelocity = input.soldQty30d / 30;
  const daysUntilStockout =
    dailyVelocity > 0 ? Math.max(0, Math.floor(input.availableQty / dailyVelocity)) : 999;

  const safetyDays = Math.max(input.leadTimeDays, 3);
  const targetDays = safetyDays + 7;
  const recommendedQty = Math.max(0, Math.ceil(dailyVelocity * targetDays - input.availableQty));

  let urgency: InventoryForecastUrgency = 'LOW';
  if (daysUntilStockout <= input.leadTimeDays) urgency = 'CRITICAL';
  else if (daysUntilStockout <= input.leadTimeDays + 2) urgency = 'HIGH';
  else if (daysUntilStockout <= 7) urgency = 'MEDIUM';

  return { daysUntilStockout: Math.min(daysUntilStockout, 999), recommendedQty, urgency };
}
