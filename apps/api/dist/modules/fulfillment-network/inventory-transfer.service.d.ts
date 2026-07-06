import { PrismaService } from '../../database/prisma.service';
import { MerchantDashboardService } from '../merchant-dashboard/merchant-dashboard.service';
import { CreateTransferDto } from './dto/fulfillment.dto';
export declare class InventoryTransferService {
    private readonly prisma;
    private readonly merchantDashboard;
    constructor(prisma: PrismaService, merchantDashboard: MerchantDashboardService);
    createTransfer(userId: string, dto: CreateTransferDto): Promise<any>;
    listTransfers(userId: string, storeId?: string): Promise<any>;
    approveTransfer(userId: string, transferId: string): Promise<any>;
    completeTransfer(userId: string, transferId: string): Promise<any>;
    private getOwnedTransfer;
}
