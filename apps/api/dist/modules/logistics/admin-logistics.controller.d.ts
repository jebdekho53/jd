import { DeliveryOrchestratorService } from './delivery-orchestrator.service';
import { LogisticsProviderRegistry } from './logistics-provider.registry';
import { PrismaService } from '../../database/prisma.service';
export declare class AdminLogisticsController {
    private readonly orchestrator;
    private readonly registry;
    private readonly prisma;
    constructor(orchestrator: DeliveryOrchestratorService, registry: LogisticsProviderRegistry, prisma: PrismaService);
    dashboard(): Promise<{
        success: boolean;
        data: {
            registeredProviders: import("@prisma/client").$Enums.DeliveryProviderType[];
            activeProvider: import("@prisma/client").$Enums.DeliveryProviderType;
            todayShipments: number;
            successRate: number;
            failureRate: number;
            averageDeliveryCost: number | null;
            averageEtaMins: number | null;
            webhookFailures: number;
            providerHealth: {
                id: string;
                metadata: import("@prisma/client/runtime/library").JsonValue | null;
                providerType: import("@prisma/client").$Enums.DeliveryProviderType;
                latencyMs: number | null;
                providerId: string;
                lastError: string | null;
                isHealthy: boolean;
                lastCheckedAt: Date;
            } | null;
            retryQueue: number;
        };
    }>;
    healthCheck(): Promise<{
        success: boolean;
        data: {
            healthy: boolean;
            latencyMs?: number;
            message?: string;
            provider: import("@prisma/client").$Enums.DeliveryProviderType;
        };
    }>;
    recentWebhooks(): Promise<{
        success: boolean;
        data: {
            id: string;
            eventId: string | null;
            status: import("@prisma/client").$Enums.ProviderWebhookStatus;
            errorMessage: string | null;
            processedAt: Date | null;
            createdAt: Date;
            providerType: import("@prisma/client").$Enums.DeliveryProviderType;
        }[];
    }>;
    retryShipment(shipmentId: string): Promise<{
        success: boolean;
        message: string;
        data?: undefined;
    } | {
        success: boolean;
        data: {
            shipmentId: string;
            deliveryId: string;
            trackingNumber: string;
            estimatedEtaMins: number | null;
        };
        message?: undefined;
    }>;
}
