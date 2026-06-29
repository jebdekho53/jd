import { AICommerceOrchestratorService } from './ai-commerce-orchestrator.service';
import { HotspotService } from './hotspot.service';
import { DemandForecastService } from './demand-forecast.service';
export declare class AdminAICommerceController {
    private readonly orchestrator;
    private readonly hotspots;
    private readonly demand;
    constructor(orchestrator: AICommerceOrchestratorService, hotspots: HotspotService, demand: DemandForecastService);
    overview(): Promise<{
        success: boolean;
        data: {
            forecasts: ({
                store: {
                    name: string;
                };
                product: {
                    name: string;
                };
            } & {
                id: string;
                createdAt: Date;
                updatedAt: Date;
                storeId: string;
                productId: string;
                forecastDate: Date;
                predictedDemand: number;
                confidenceScore: number;
                actualDemand: number | null;
            })[];
            hotspots: ({
                category: {
                    name: string;
                } | null;
            } & {
                city: string;
                id: string;
                createdAt: Date;
                updatedAt: Date;
                categoryId: string | null;
                locality: string;
                demandScore: number;
            })[];
            accuracy: {
                accuracyPct: number;
                samples: number;
            };
            crises: ({
                store: {
                    name: string;
                };
                product: {
                    name: string;
                };
            } & {
                id: string;
                createdAt: Date;
                updatedAt: Date;
                storeId: string;
                productId: string;
                daysUntilStockout: number;
                recommendedQty: number;
                urgency: import("@prisma/client").$Enums.InventoryForecastUrgency;
            })[];
            recommendations: {
                id: string;
                createdAt: Date;
                updatedAt: Date;
                description: string;
                title: string;
                priority: import("@prisma/client").$Enums.AIRecommendationPriority;
                entityType: import("@prisma/client").$Enums.AIRecommendationEntityType;
                entityId: string;
            }[];
            trending: {
                category: string;
                demandScore: number;
                city: string;
            }[];
        };
    }>;
    hotspotList(): Promise<{
        success: boolean;
        data: ({
            category: {
                name: string;
            } | null;
        } & {
            city: string;
            id: string;
            createdAt: Date;
            updatedAt: Date;
            categoryId: string | null;
            locality: string;
            demandScore: number;
        })[];
    }>;
    forecasts(): Promise<{
        success: boolean;
        data: ({
            store: {
                name: string;
            };
            product: {
                name: string;
            };
        } & {
            id: string;
            createdAt: Date;
            updatedAt: Date;
            storeId: string;
            productId: string;
            forecastDate: Date;
            predictedDemand: number;
            confidenceScore: number;
            actualDemand: number | null;
        })[];
    }>;
}
