/** Launch readiness inputs — output 0–100 */
export interface LaunchReadinessInput {
  storeDensity: number; // 0–1 normalized
  riderSupply: number; // 0–1
  searchDemand: number; // 0–1
  population: number; // 0–1
  procurementCoverage: number; // 0–1
}

const WEIGHTS = {
  storeDensity: 0.3,
  riderSupply: 0.2,
  searchDemand: 0.2,
  population: 0.15,
  procurementCoverage: 0.15,
} as const;

export function computeLaunchReadiness(input: LaunchReadinessInput): number {
  const score =
    input.storeDensity * WEIGHTS.storeDensity +
    input.riderSupply * WEIGHTS.riderSupply +
    input.searchDemand * WEIGHTS.searchDemand +
    input.population * WEIGHTS.population +
    input.procurementCoverage * WEIGHTS.procurementCoverage;
  return Math.min(100, Math.round(score * 100));
}

export function computeFranchiseShare(commissionBase: number, commissionPercent: number): {
  franchiseShare: number;
  platformShare: number;
} {
  const franchiseShare = round(commissionBase * (commissionPercent / 100));
  return { franchiseShare, platformShare: round(commissionBase - franchiseShare) };
}

function round(n: number): number {
  return Math.round(n * 100) / 100;
}

export function pincodeSetsOverlap(a: string[], b: string[]): string[] {
  const setB = new Set(b);
  return a.filter((p) => setB.has(p));
}
