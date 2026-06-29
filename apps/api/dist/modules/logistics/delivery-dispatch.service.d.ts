import { ConfigService } from '@nestjs/config';
import { PrismaService } from '../../database/prisma.service';
import { RiderAssignmentService } from '../rider-assignment/rider-assignment.service';
import { DeliveryOrchestratorService } from './delivery-orchestrator.service';
export type DispatchResult = {
    mode: 'own_fleet' | 'provider';
    deliveryId?: string;
    riderProfileId?: string;
    shipmentId?: string;
    trackingNumber?: string;
    estimatedEtaMins?: number | null;
} | null;
export declare class DeliveryDispatchService {
    private readonly config;
    private readonly prisma;
    private readonly riderAssignment;
    private readonly orchestrator;
    private readonly logger;
    constructor(config: ConfigService, prisma: PrismaService, riderAssignment: RiderAssignmentService, orchestrator: DeliveryOrchestratorService);
    dispatchAfterOrderPlaced(orderId: string): Promise<DispatchResult>;
    dispatchAfterReadyForPickup(orderId: string): Promise<DispatchResult>;
    private dispatchViaProvider;
}
