import { Module } from '@nestjs/common';
import { MerchantService } from './merchant.service';
import { MerchantController } from './merchant.controller';
import { VerificationBlocklistService } from './verification-blocklist.service';

@Module({
  controllers: [MerchantController],
  providers: [MerchantService, VerificationBlocklistService],
  exports: [MerchantService, VerificationBlocklistService],
})
export class MerchantModule {}
