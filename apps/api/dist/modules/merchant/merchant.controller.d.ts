import { RequestUser } from '../../common/types';
import { MerchantService } from './merchant.service';
import { CreateMerchantProfileDto } from './dto/create-merchant-profile.dto';
import { UpdateMerchantProfileDto } from './dto/update-merchant-profile.dto';
export declare class MerchantController {
    private readonly merchantService;
    constructor(merchantService: MerchantService);
    createProfile(user: RequestUser, dto: CreateMerchantProfileDto, ip: string): Promise<{
        success: boolean;
        data: MerchantProfile;
    }>;
    getProfile(user: RequestUser): Promise<{
        success: boolean;
        data: MerchantProfile;
    }>;
    updateProfile(user: RequestUser, dto: UpdateMerchantProfileDto, ip: string): Promise<{
        success: boolean;
        data: MerchantProfile;
    }>;
    updateBankAccount(user: RequestUser, dto: any): Promise<{
        success: boolean;
        message: string;
    }>;
}
