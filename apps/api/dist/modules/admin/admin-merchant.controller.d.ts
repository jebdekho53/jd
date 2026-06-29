import { Request } from 'express';
import { RequestUser } from '../../common/types';
import { AdminMerchantService } from './admin-merchant.service';
import { RemoveBlacklistDto } from './dto/remove-blacklist.dto';
export declare class AdminMerchantController {
    private readonly adminMerchantService;
    constructor(adminMerchantService: AdminMerchantService);
    removeBlacklist(user: RequestUser, merchantProfileId: string, dto: RemoveBlacklistDto, ip: string, req: Request): Promise<{
        success: boolean;
        data: {
            merchantProfileId: string;
            isBlacklisted: boolean;
            reopenedStoreId?: string;
        };
    }>;
}
