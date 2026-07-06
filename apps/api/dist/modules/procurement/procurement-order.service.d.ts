import { PrismaService } from '../../database/prisma.service';
import { CreateVendorOrderDto } from './dto/procurement.dto';
import { ProcurementCartService } from './procurement-cart.service';
export declare class ProcurementOrderService {
    private readonly prisma;
    private readonly cartService;
    constructor(prisma: PrismaService, cartService: ProcurementCartService);
    createOrder(userId: string, dto: CreateVendorOrderDto): Promise<any>;
    listOrders(userId: string, storeId?: string): Promise<any>;
}
