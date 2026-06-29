import { RequestUser } from '../../common/types';
import { FranchiseExpansionMerchantService } from './franchise-expansion-merchant.service';
export declare class MerchantFranchiseExpansionController {
    private readonly merchantExpansion;
    constructor(merchantExpansion: FranchiseExpansionMerchantService);
    getExpansion(user: RequestUser, storeId?: string): Promise<{
        success: boolean;
        data: {
            id: string;
            title: string;
            description: string;
            impact: string;
            type: string;
        }[];
    }>;
}
