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
            registeredProviders: DeliveryProviderType[];
            activeProvider: DeliveryProviderType;
            todayShipments: any;
            successRate: number;
            failureRate: number;
            averageDeliveryCost: number | null;
            averageEtaMins: any;
            webhookFailures: any;
            providerHealth: any;
            retryQueue: any;
        };
    }>;
    healthCheck(): Promise<{
        success: boolean;
        data: {
            healthy: boolean;
            latencyMs?: number;
            message?: string;
            provider: DeliveryProviderType;
        };
    }>;
    recentWebhooks(): Promise<{
        success: boolean;
        data: any;
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
