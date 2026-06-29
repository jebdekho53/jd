"use strict";
var __decorate = (this && this.__decorate) || function (decorators, target, key, desc) {
    var c = arguments.length, r = c < 3 ? target : desc === null ? desc = Object.getOwnPropertyDescriptor(target, key) : desc, d;
    if (typeof Reflect === "object" && typeof Reflect.decorate === "function") r = Reflect.decorate(decorators, target, key, desc);
    else for (var i = decorators.length - 1; i >= 0; i--) if (d = decorators[i]) r = (c < 3 ? d(r) : c > 3 ? d(target, key, r) : d(target, key)) || r;
    return c > 3 && r && Object.defineProperty(target, key, r), r;
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.CrmModule = void 0;
const common_1 = require("@nestjs/common");
const auth_module_1 = require("../auth/auth.module");
const support_module_1 = require("../support/support.module");
const push_module_1 = require("../push/push.module");
const segment_service_1 = require("./segment.service");
const customer_360_service_1 = require("./customer-360.service");
const notification_orchestrator_service_1 = require("./notification-orchestrator.service");
const journey_engine_service_1 = require("./journey-engine.service");
const cart_recovery_service_1 = require("./cart-recovery.service");
const marketing_event_service_1 = require("./marketing-event.service");
const recommendation_service_1 = require("./recommendation.service");
const crm_analytics_service_1 = require("./crm-analytics.service");
const merchant_crm_service_1 = require("./merchant-crm.service");
const admin_crm_controller_1 = require("./admin-crm.controller");
const buyer_crm_controller_1 = require("./buyer-crm.controller");
const merchant_crm_controller_1 = require("./merchant-crm.controller");
let CrmModule = class CrmModule {
};
exports.CrmModule = CrmModule;
exports.CrmModule = CrmModule = __decorate([
    (0, common_1.Module)({
        imports: [support_module_1.SupportModule, auth_module_1.AuthModule, (0, common_1.forwardRef)(() => push_module_1.PushModule)],
        controllers: [admin_crm_controller_1.AdminCrmController, buyer_crm_controller_1.BuyerCrmController, merchant_crm_controller_1.MerchantCrmController],
        providers: [
            segment_service_1.SegmentService,
            customer_360_service_1.Customer360Service,
            notification_orchestrator_service_1.NotificationOrchestratorService,
            journey_engine_service_1.JourneyEngineService,
            cart_recovery_service_1.CartRecoveryService,
            marketing_event_service_1.MarketingEventService,
            recommendation_service_1.RecommendationService,
            crm_analytics_service_1.CrmAnalyticsService,
            merchant_crm_service_1.MerchantCrmService,
        ],
        exports: [
            marketing_event_service_1.MarketingEventService,
            notification_orchestrator_service_1.NotificationOrchestratorService,
            segment_service_1.SegmentService,
            merchant_crm_service_1.MerchantCrmService,
        ],
    })
], CrmModule);
//# sourceMappingURL=crm.module.js.map