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
    getSponsoredProductsForSearch(query: string, limit?: number): Promise<{
        sponsored: boolean;
        campaignId: string;
        auctionScore: number;
        id?: string | undefined;
        name?: string | undefined;
        storeId?: string | undefined;
        slug?: string | undefined;
        imageUrls?: string[] | undefined;
        basePrice?: import("@prisma/client/runtime/library").Decimal | undefined;
    }[]>;
    getSponsoredStoresForHome(limit?: number): Promise<{
        sponsored: boolean;
        campaignId: string;
        priority: number;
        id: string;
        name: string;
        slug: string;
        logoUrl: string | null;
    }[]>;
    getSponsoredProductsForHome(limit?: number): Promise<{
        sponsored: boolean;
        campaignId: string;
        id: string;
        name: string;
        storeId: string;
        slug: string;
        imageUrls: string[];
        basePrice: import("@prisma/client/runtime/library").Decimal;
    }[]>;
    recordImpression(campaignId: string, placement: AdPlacement, userId?: string, cost?: number): Promise<{
        id: string;
        createdAt: Date;
        userId: string | null;
        campaignId: string;
        placement: import("@prisma/client").$Enums.AdPlacement;
        cost: import("@prisma/client/runtime/library").Decimal;
    } | null>;
    recordClick(campaignId: string, userId?: string, cost?: number): Promise<{
        id: string;
        createdAt: Date;
        userId: string | null;
        campaignId: string;
        cost: import("@prisma/client/runtime/library").Decimal;
    } | null>;
    recordConversion(campaignId: string, orderId: string, revenue: number): Promise<{
        id: string;
        createdAt: Date;
        orderId: string;
        campaignId: string;
        revenue: import("@prisma/client/runtime/library").Decimal;
    }>;
}
