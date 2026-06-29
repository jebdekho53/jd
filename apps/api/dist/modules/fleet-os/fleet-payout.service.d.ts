import { PrismaService } from '../../database/prisma.service';
export declare class FleetPayoutService {
    private readonly prisma;
    constructor(prisma: PrismaService);
    estimateDeliveryPayout(deliveryId: string): Promise<import("./fleet-payout.util").FleetPayoutBreakdown | null>;
}
