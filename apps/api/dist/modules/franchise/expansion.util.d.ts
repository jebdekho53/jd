export interface LaunchReadinessInput {
    storeDensity: number;
    riderSupply: number;
    searchDemand: number;
    population: number;
    procurementCoverage: number;
}
export declare function computeLaunchReadiness(input: LaunchReadinessInput): number;
export declare function computeFranchiseShare(gmv: number, commissionPercent: number): {
    franchiseShare: number;
    platformShare: number;
};
export declare function pincodeSetsOverlap(a: string[], b: string[]): string[];
