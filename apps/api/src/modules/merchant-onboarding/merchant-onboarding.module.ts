import { Module } from '@nestjs/common';
import { MerchantModule } from '../merchant/merchant.module';
import { StoreModule } from '../store/store.module';
import { AdminModule } from '../admin/admin.module';
import { CrmModule } from '../crm/crm.module';
import { TrustSafetyModule } from '../trust-safety/trust-safety.module';
import { SupportModule } from '../support/support.module';
import { EmailModule } from '../email/email.module';
import { GeoModule } from '../geo/geo.module';
import { GeocodingModule } from '../geocoding/geocoding.module';
import { LocationDirectoryModule } from '../location-directory/location-directory.module';
import { StoreVerticalModule } from '../store-vertical/store-vertical.module';
import { FranchiseModule } from '../franchise/franchise.module';
import { PasswordService } from '../auth/password.service';
import { MerchantOnboardingService } from './merchant-onboarding.service';
import { MerchantApplicationRiskService } from './merchant-application-risk.service';
import { MerchantOnboardingController } from './merchant-onboarding.controller';
import { AdminMerchantApplicationController } from './admin-merchant-application.controller';

@Module({
  imports: [
    MerchantModule,
    StoreModule,
    AdminModule,
    CrmModule,
    TrustSafetyModule,
    SupportModule,
    EmailModule,
    GeoModule,
    GeocodingModule,
    LocationDirectoryModule,
    StoreVerticalModule,
    FranchiseModule,
  ],
  controllers: [MerchantOnboardingController, AdminMerchantApplicationController],
  providers: [
    MerchantOnboardingService,
    MerchantApplicationRiskService,
    PasswordService,
  ],
  exports: [MerchantOnboardingService],
})
export class MerchantOnboardingModule {}
