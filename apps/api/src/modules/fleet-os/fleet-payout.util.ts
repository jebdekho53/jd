export interface FleetPayoutInput {
  baseEarning: number;
  distanceKm: number;
  batchSize: number;
  optimized: boolean;
}

export interface FleetPayoutBreakdown {
  singleDeliveryPayout: number;
  batchBonus: number;
  distancePayout: number;
  efficiencyBonus: number;
  total: number;
}

/** Additive payout calculator — does not replace existing rider payout flow */
export function computeFleetPayout(input: FleetPayoutInput): FleetPayoutBreakdown {
  const singleDeliveryPayout = round(input.baseEarning);
  const batchBonus = input.batchSize > 1 ? round(input.baseEarning * 0.1 * (input.batchSize - 1)) : 0;
  const distancePayout = round(input.distanceKm * 8);
  const efficiencyBonus = input.optimized ? round(input.baseEarning * 0.05) : 0;
  const total = round(singleDeliveryPayout + batchBonus + distancePayout + efficiencyBonus);
  return { singleDeliveryPayout, batchBonus, distancePayout, efficiencyBonus, total };
}

function round(n: number): number {
  return Math.round(n * 100) / 100;
}
