import { RequestUser } from '../../common/types';
import { MerchantService } from './merchant.service';
import { CreateMerchantProfileDto } from './dto/create-merchant-profile.dto';
import { UpdateMerchantProfileDto } from './dto/update-merchant-profile.dto';
export declare class MerchantController {
    private readonly merchantService;
    constructor(merchantService: MerchantService);
    createProfile(user: RequestUser, dto: CreateMerchantProfileDto, ip: string): Promise<{
        success: boolean;
        data: {
            id: string;
            createdAt: Date;
            userId: string;
            updatedAt: Date;
            businessName: string;
            gstNumber: string | null;
            panNumber: string | null;
            kycStatus: import("@prisma/client").$Enums.KycStatus;
            kycDocuments: import("@prisma/client/runtime/library").JsonValue | null;
            isBlacklisted: boolean;
            blacklistReason: string | null;
            blacklistedAt: Date | null;
            blacklistedBy: string | null;
            blacklistRemovedAt: Date | null;
            blacklistRemovedBy: string | null;
        };
    }>;
    getProfile(user: RequestUser): Promise<{
        success: boolean;
        data: {
            id: string;
            createdAt: Date;
            userId: string;
            updatedAt: Date;
            businessName: string;
            gstNumber: string | null;
            panNumber: string | null;
            kycStatus: import("@prisma/client").$Enums.KycStatus;
            kycDocuments: import("@prisma/client/runtime/library").JsonValue | null;
            isBlacklisted: boolean;
            blacklistReason: string | null;
            blacklistedAt: Date | null;
            blacklistedBy: string | null;
            blacklistRemovedAt: Date | null;
            blacklistRemovedBy: string | null;
        };
    }>;
    updateProfile(user: RequestUser, dto: UpdateMerchantProfileDto, ip: string): Promise<{
        success: boolean;
        data: {
            id: string;
            createdAt: Date;
            userId: string;
            updatedAt: Date;
            businessName: string;
            gstNumber: string | null;
            panNumber: string | null;
            kycStatus: import("@prisma/client").$Enums.KycStatus;
            kycDocuments: import("@prisma/client/runtime/library").JsonValue | null;
            isBlacklisted: boolean;
            blacklistReason: string | null;
            blacklistedAt: Date | null;
            blacklistedBy: string | null;
            blacklistRemovedAt: Date | null;
            blacklistRemovedBy: string | null;
        };
    }>;
    updateBankAccount(user: RequestUser, dto: any): Promise<{
        success: boolean;
        message: string;
    }>;
}
