import { MerchantProfile } from '@prisma/client';
import { PrismaService } from '../../database/prisma.service';
import { AuditService } from '../audit/audit.service';
import { VerificationBlocklistService } from './verification-blocklist.service';
import { CreateMerchantProfileDto } from './dto/create-merchant-profile.dto';
import { UpdateMerchantProfileDto } from './dto/update-merchant-profile.dto';
export declare class MerchantService {
    private readonly prisma;
    private readonly audit;
    private readonly blocklist;
    private readonly logger;
    constructor(prisma: PrismaService, audit: AuditService, blocklist: VerificationBlocklistService);
    createProfile(userId: string, dto: CreateMerchantProfileDto, ipAddress?: string): Promise<MerchantProfile>;
    ensureMerchantRole(userId: string): Promise<void>;
    getProfile(userId: string): Promise<MerchantProfile>;
    updateProfile(userId: string, dto: UpdateMerchantProfileDto, ipAddress?: string): Promise<MerchantProfile>;
    requireMerchantProfile(userId: string): Promise<MerchantProfile>;
}
