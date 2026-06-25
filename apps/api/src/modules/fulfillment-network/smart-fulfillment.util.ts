/** Routing score inputs — lower score wins. */
export interface RoutingScoreInput {
  inventoryAvailability: number; // 0–1, higher is better → inverted in score
  etaMins: number;
  capacityLoadPct: number; // 0–100
  deliverySuccessRate: number; // 0–1
  fulfillmentCost: number; // normalized 0–1
}

const WEIGHTS = {
  inventory: 0.4,
  eta: 0.25,
  capacity: 0.15,
  deliverySuccess: 0.1,
  cost: 0.1,
} as const;

const MAX_ETA_MINS = 60;
const MAX_COST = 100;

export function computeRoutingScore(input: RoutingScoreInput): number {
  const inventoryPenalty = 1 - Math.min(1, Math.max(0, input.inventoryAvailability));
  const etaNorm = Math.min(1, input.etaMins / MAX_ETA_MINS);
  const capacityNorm = Math.min(1, input.capacityLoadPct / 100);
  const successPenalty = 1 - Math.min(1, Math.max(0, input.deliverySuccessRate));
  const costNorm = Math.min(1, input.fulfillmentCost / MAX_COST);

  return (
    inventoryPenalty * WEIGHTS.inventory +
    etaNorm * WEIGHTS.eta +
    capacityNorm * WEIGHTS.capacity +
    successPenalty * WEIGHTS.deliverySuccess +
    costNorm * WEIGHTS.cost
  );
}

export function estimateEtaMins(distanceKm: number, avgPrepTimeMins: number): number {
  const travelMins = Math.ceil((distanceKm / 20) * 60);
  return avgPrepTimeMins + travelMins;
}

export const CAPACITY_OVERLOAD_THRESHOLD = 90;
