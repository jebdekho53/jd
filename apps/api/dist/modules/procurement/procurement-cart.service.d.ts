import { PrismaService } from '../../database/prisma.service';
import { MerchantDashboardService } from '../merchant-dashboard/merchant-dashboard.service';
import { AddCartItemDto, UpdateCartDto } from './dto/procurement.dto';
export declare class ProcurementCartService {
    private readonly prisma;
    private readonly merchantDashboard;
    constructor(prisma: PrismaService, merchantDashboard: MerchantDashboardService);
    getCart(userId: string, storeId?: string): Promise<any>;
    updateCart(userId: string, dto: UpdateCartDto): Promise<any>;
    addItem(userId: string, dto: AddCartItemDto, storeId?: string): Promise<any>;
    private resolveMerchant;
}
