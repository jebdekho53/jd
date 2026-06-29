"use strict";
var __decorate = (this && this.__decorate) || function (decorators, target, key, desc) {
    var c = arguments.length, r = c < 3 ? target : desc === null ? desc = Object.getOwnPropertyDescriptor(target, key) : desc, d;
    if (typeof Reflect === "object" && typeof Reflect.decorate === "function") r = Reflect.decorate(decorators, target, key, desc);
    else for (var i = decorators.length - 1; i >= 0; i--) if (d = decorators[i]) r = (c < 3 ? d(r) : c > 3 ? d(target, key, r) : d(target, key)) || r;
    return c > 3 && r && Object.defineProperty(target, key, r), r;
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.MerchantOnboardingModule = void 0;
const common_1 = require("@nestjs/common");
const merchant_module_1 = require("../merchant/merchant.module");
const store_module_1 = require("../store/store.module");
const admin_module_1 = require("../admin/admin.module");
const crm_module_1 = require("../crm/crm.module");
const trust_safety_module_1 = require("../trust-safety/trust-safety.module");
const support_module_1 = require("../support/support.module");
const email_module_1 = require("../email/email.module");
const geo_module_1 = require("../geo/geo.module");
const geocoding_module_1 = require("../geocoding/geocoding.module");
const location_directory_module_1 = require("../location-directory/location-directory.module");
const store_vertical_module_1 = require("../store-vertical/store-vertical.module");
const password_service_1 = require("../auth/password.service");
const merchant_onboarding_service_1 = require("./merchant-onboarding.service");
const merchant_application_risk_service_1 = require("./merchant-application-risk.service");
const merchant_onboarding_controller_1 = require("./merchant-onboarding.controller");
const admin_merchant_application_controller_1 = require("./admin-merchant-application.controller");
let MerchantOnboardingModule = class MerchantOnboardingModule {
};
exports.MerchantOnboardingModule = MerchantOnboardingModule;
exports.MerchantOnboardingModule = MerchantOnboardingModule = __decorate([
    (0, common_1.Module)({
        imports: [
            merchant_module_1.MerchantModule,
            store_module_1.StoreModule,
            admin_module_1.AdminModule,
            crm_module_1.CrmModule,
            trust_safety_module_1.TrustSafetyModule,
            support_module_1.SupportModule,
            email_module_1.EmailModule,
            geo_module_1.GeoModule,
            geocoding_module_1.GeocodingModule,
            location_directory_module_1.LocationDirectoryModule,
            store_vertical_module_1.StoreVerticalModule,
        ],
        controllers: [merchant_onboarding_controller_1.MerchantOnboardingController, admin_merchant_application_controller_1.AdminMerchantApplicationController],
        providers: [
            merchant_onboarding_service_1.MerchantOnboardingService,
            merchant_application_risk_service_1.MerchantApplicationRiskService,
            password_service_1.PasswordService,
        ],
        exports: [merchant_onboarding_service_1.MerchantOnboardingService],
    })
], MerchantOnboardingModule);
//# sourceMappingURL=merchant-onboarding.module.js.map