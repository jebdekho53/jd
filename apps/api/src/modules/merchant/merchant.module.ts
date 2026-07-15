import { Module } from '@nestjs/common';
import { MerchantService } from './merchant.service';
import { MerchantController } from './merchant.controller';
import { VerificationBlocklistService } from './verification-blocklist.service';
import { MarketingModule } from '../marketing/marketing.module';

@Module({
  imports: [MarketingModule],
  controllers: [MerchantController],
  providers: [MerchantService, VerificationBlocklistService],
  exports: [MerchantService, VerificationBlocklistService],
})
export class MerchantModule {}
