import { PrismaService } from '../../database/prisma.service';
export declare class InventoryAlertService {
    private readonly prisma;
    private readonly logger;
    constructor(prisma: PrismaService);
    checkAndNotifyLowStock(variantId: string, actorUserId?: string): Promise<void>;
    private createAlert;
}
