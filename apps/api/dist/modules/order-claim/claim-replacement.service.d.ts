import { ClaimActorType } from '@prisma/client';
import { PrismaService } from '../../database/prisma.service';
import { DeliveryOrchestratorService } from '../logistics/delivery-orchestrator.service';
import { ClaimEligibilityService } from './claim-eligibility.service';
export declare class ClaimReplacementService {
    private readonly prisma;
    private readonly delivery;
    private readonly eligibility;
    private readonly logger;
    constructor(prisma: PrismaService, delivery: DeliveryOrchestratorService, eligibility: ClaimEligibilityService);
    issueReplacement(claimId: string, actorId: string, actorType: ClaimActorType, dispatchShipment?: boolean): Promise<{
        replacementOrderId: string;
        shipmentId?: string;
    }>;
    private dispatchReplacementShipment;
}
