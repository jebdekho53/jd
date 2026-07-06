import { PrismaService } from '../../database/prisma.service';
import { CreateVendorProductDto, ShipVendorOrderDto } from './dto/procurement.dto';
export declare class VendorPortalService {
    private readonly prisma;
    constructor(prisma: PrismaService);
    resolveVendorId(userId: string): Promise<string>;
    listOrders(userId: string): Promise<any>;
    shipOrder(userId: string, orderId: string, dto: ShipVendorOrderDto): Promise<any>;
    deliverOrder(userId: string, orderId: string): Promise<any>;
    getCatalog(userId: string): Promise<any>;
    createProduct(userId: string, dto: CreateVendorProductDto): Promise<any>;
}
