import { RequestUser } from '../../common/types';
import { PrismaService } from '../../database/prisma.service';
import { DeliveryOrchestratorService } from './delivery-orchestrator.service';
export declare class MerchantLogisticsController {
    private readonly prisma;
    private readonly orchestrator;
    constructor(prisma: PrismaService, orchestrator: DeliveryOrchestratorService);
    getShipment(user: RequestUser, orderId: string): Promise<{
        success: boolean;
        data: any;
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
