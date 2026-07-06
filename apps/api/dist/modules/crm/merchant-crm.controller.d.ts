import { RequestUser } from '../../common/types';
import { MerchantCrmService } from './merchant-crm.service';
export declare class MerchantCrmController {
    private readonly crm;
    constructor(crm: MerchantCrmService);
    customers(user: RequestUser, storeId?: string): Promise<{
        success: boolean;
        data: {
            repeatCustomers: any;
            topSpenders: any;
            loyaltyMembers: any;
            winBack: any;
            couponUsers: any;
            campaignPerformance: any;
        };
    }>;
}
