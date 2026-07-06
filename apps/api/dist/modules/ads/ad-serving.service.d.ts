import { AdPlacement } from '@prisma/client';
import { PrismaService } from '../../database/prisma.service';
import { KeywordAuctionService } from './keyword-auction.service';
import { AdBudgetService } from './ad-budget.service';
import { AdFraudGuardService } from './ad-fraud-guard.service';
export declare class AdServingService {
    private readonly prisma;
    private readonly auction;
    private readonly budget;
    private readonly fraudGuard;
    constructor(prisma: PrismaService, auction: KeywordAuctionService, budget: AdBudgetService, fraudGuard: AdFraudGuardService);
    getSponsoredProductsForSearch(query: string, limit?: number): Promise<any[]>;
    getSponsoredStoresForHome(limit?: number): Promise<any>;
    getSponsoredProductsForHome(limit?: number): Promise<any>;
    recordImpression(campaignId: string, placement: AdPlacement, userId?: string, cost?: number): Promise<any>;
    recordClick(campaignId: string, userId?: string, cost?: number): Promise<any>;
    recordConversion(campaignId: string, orderId: string, revenue: number): Promise<any>;
}
