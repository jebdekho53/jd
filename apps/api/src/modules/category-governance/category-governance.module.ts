import { Module } from '@nestjs/common';
import { MerchantModule } from '../merchant/merchant.module';
import { BuyerModule } from '../buyer/buyer.module';
import { AdminCategoryGovernanceService } from './admin-category-governance.service';
import { AdminCategoryGovernanceController } from './admin-category-governance.controller';
import { MerchantCategoryRequestService } from './merchant-category-request.service';
import { MerchantCategoryGovernanceController } from './merchant-category-governance.controller';
import { MerchantCategoryAccessService } from './merchant-category-access.service';
import { StoreCategoryAccessService } from './store-category-access.service';
import { StoreCategoryRequestService } from './store-category-request.service';

@Module({
  imports: [MerchantModule, BuyerModule],
  controllers: [AdminCategoryGovernanceController, MerchantCategoryGovernanceController],
  providers: [
    AdminCategoryGovernanceService,
    MerchantCategoryRequestService,
    MerchantCategoryAccessService,
    StoreCategoryAccessService,
    StoreCategoryRequestService,
  ],
  exports: [
    AdminCategoryGovernanceService,
    MerchantCategoryRequestService,
    MerchantCategoryAccessService,
    StoreCategoryAccessService,
    StoreCategoryRequestService,
  ],
})
export class CategoryGovernanceModule {}
