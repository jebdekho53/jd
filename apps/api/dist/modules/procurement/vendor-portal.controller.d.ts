import { RequestUser } from '../../common/types';
import { VendorPortalService } from './vendor-portal.service';
import { CreateVendorProductDto, ShipVendorOrderDto } from './dto/procurement.dto';
export declare class VendorPortalController {
    private readonly vendor;
    constructor(vendor: VendorPortalService);
    orders(user: RequestUser): Promise<{
        success: boolean;
        data: any;
    }>;
    ship(user: RequestUser, id: string, dto: ShipVendorOrderDto): Promise<{
        success: boolean;
        data: any;
    }>;
    deliver(user: RequestUser, id: string): Promise<{
        success: boolean;
        data: any;
    }>;
    catalog(user: RequestUser): Promise<{
        success: boolean;
        data: any;
    }>;
    createProduct(user: RequestUser, dto: CreateVendorProductDto): Promise<{
        success: boolean;
        data: any;
    }>;
}
