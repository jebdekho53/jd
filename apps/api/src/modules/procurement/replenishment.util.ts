export function computeReplenishmentQty(currentStock: number, avgDailySales: number): number {
  const targetDays = 14;
  const targetStock = Math.ceil(avgDailySales * targetDays);
  return Math.max(10, targetStock - currentStock);
}

export function predictOosDays(currentStock: number, avgDailySales: number): number {
  if (avgDailySales <= 0) return 999;
  return currentStock / avgDailySales;
}
