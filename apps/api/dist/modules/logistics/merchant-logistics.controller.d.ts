import { RequestUser } from '../../common/types';
import { PrismaService } from '../../database/prisma.service';
import { DeliveryOrchestratorService } from './delivery-orchestrator.service';
export declare class MerchantLogisticsController {
    private readonly prisma;
    private readonly orchestrator;
    constructor(prisma: PrismaService, orchestrator: DeliveryOrchestratorService);
    getShipment(user: RequestUser, orderId: string): Promise<{
        success: boolean;
        data: {
            provider: {
                type: import("@prisma/client").$Enums.DeliveryProviderType;
                name: string;
            };
            events: {
                id: string;
                createdAt: Date;
                occurredAt: Date;
                description: string | null;
                lat: number | null;
                lng: number | null;
                shipmentId: string;
                providerStatus: string | null;
                normalizedStatus: import("@prisma/client").$Enums.ShipmentProviderStatus;
                rawPayload: import("@prisma/client/runtime/library").JsonValue | null;
            }[];
        } & {
            id: string;
            createdAt: Date;
            updatedAt: Date;
            cancelledAt: Date | null;
            vehicleType: string | null;
            orderId: string;
            estimatedArrivalAt: Date | null;
            deliveredAt: Date | null;
            providerType: import("@prisma/client").$Enums.DeliveryProviderType;
            deliveryId: string | null;
            trackingNumber: string | null;
            externalShipmentId: string | null;
            estimatedEtaMins: number | null;
            providerStatus: string | null;
            rawResponse: import("@prisma/client/runtime/library").JsonValue | null;
            deliveryCost: import("@prisma/client/runtime/library").Decimal | null;
            normalizedStatus: import("@prisma/client").$Enums.ShipmentProviderStatus;
            driverName: string | null;
            driverPhone: string | null;
            labelUrl: string | null;
            podUrl: string | null;
            providerId: string;
            retryCount: number;
            lastError: string | null;
        };
    }>;
    cancelShipment(user: RequestUser, orderId: string, body: {
        reason?: string;
    }): Promise<{
        success: boolean;
    }>;
    retryShipment(user: RequestUser, orderId: string): Promise<{
        success: boolean;
        data: {
            shipmentId: string;
            deliveryId: string;
            trackingNumber: string;
            estimatedEtaMins: number | null;
        };
    }>;
    private assertMerchantOrder;
}
