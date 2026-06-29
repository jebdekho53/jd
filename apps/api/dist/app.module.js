"use strict";
var __decorate = (this && this.__decorate) || function (decorators, target, key, desc) {
    var c = arguments.length, r = c < 3 ? target : desc === null ? desc = Object.getOwnPropertyDescriptor(target, key) : desc, d;
    if (typeof Reflect === "object" && typeof Reflect.decorate === "function") r = Reflect.decorate(decorators, target, key, desc);
    else for (var i = decorators.length - 1; i >= 0; i--) if (d = decorators[i]) r = (c < 3 ? d(r) : c > 3 ? d(target, key, r) : d(target, key)) || r;
    return c > 3 && r && Object.defineProperty(target, key, r), r;
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.AppModule = void 0;
const common_1 = require("@nestjs/common");
const config_1 = require("@nestjs/config");
const core_1 = require("@nestjs/core");
const event_emitter_1 = require("@nestjs/event-emitter");
const throttler_1 = require("@nestjs/throttler");
const demo_aware_throttler_guard_1 = require("./common/guards/demo-aware-throttler.guard");
const schedule_1 = require("@nestjs/schedule");
const env_validation_1 = require("./config/env.validation");
const env_path_1 = require("./config/env-path");
const logger_module_1 = require("./logger/logger.module");
const prisma_module_1 = require("./database/prisma.module");
const redis_module_1 = require("./redis/redis.module");
const webhooks_module_1 = require("./common/webhooks/webhooks.module");
const health_module_1 = require("./health/health.module");
const audit_module_1 = require("./modules/audit/audit.module");
const domain_events_module_1 = require("./modules/domain-events/domain-events.module");
const auth_module_1 = require("./modules/auth/auth.module");
const merchant_module_1 = require("./modules/merchant/merchant.module");
const store_module_1 = require("./modules/store/store.module");
const admin_module_1 = require("./modules/admin/admin.module");
const product_module_1 = require("./modules/product/product.module");
const buyer_module_1 = require("./modules/buyer/buyer.module");
const cart_module_1 = require("./modules/cart/cart.module");
const checkout_module_1 = require("./modules/checkout/checkout.module");
const payment_module_1 = require("./modules/payment/payment.module");
const order_module_1 = require("./modules/order/order.module");
const order_claim_module_1 = require("./modules/order-claim/order-claim.module");
const order_timeline_module_1 = require("./modules/order/order-timeline.module");
const rider_assignment_module_1 = require("./modules/rider-assignment/rider-assignment.module");
const rider_module_1 = require("./modules/rider/rider.module");
const geo_module_1 = require("./modules/geo/geo.module");
const location_directory_module_1 = require("./modules/location-directory/location-directory.module");
const upload_module_1 = require("./modules/upload/upload.module");
const category_governance_module_1 = require("./modules/category-governance/category-governance.module");
const merchant_dashboard_module_1 = require("./modules/merchant-dashboard/merchant-dashboard.module");
const admin_dashboard_module_1 = require("./modules/admin-dashboard/admin-dashboard.module");
const settlement_module_1 = require("./modules/settlement/settlement.module");
const inventory_module_1 = require("./modules/inventory/inventory.module");
const delivery_tracking_module_1 = require("./modules/delivery-tracking/delivery-tracking.module");
const store_review_module_1 = require("./modules/store-review/store-review.module");
const promotion_module_1 = require("./modules/promotion/promotion.module");
const geospatial_module_1 = require("./modules/geospatial/geospatial.module");
const wallet_loyalty_module_1 = require("./modules/wallet-loyalty/wallet-loyalty.module");
const analytics_module_1 = require("./modules/analytics/analytics.module");
const search_discovery_module_1 = require("./modules/search-discovery/search-discovery.module");
const finance_module_1 = require("./modules/finance/finance.module");
const compliance_module_1 = require("./modules/compliance/compliance.module");
const trust_safety_module_1 = require("./modules/trust-safety/trust-safety.module");
const support_module_1 = require("./modules/support/support.module");
const crm_module_1 = require("./modules/crm/crm.module");
const merchant_growth_module_1 = require("./modules/merchant-growth/merchant-growth.module");
const fulfillment_network_module_1 = require("./modules/fulfillment-network/fulfillment-network.module");
const procurement_module_1 = require("./modules/procurement/procurement.module");
const franchise_module_1 = require("./modules/franchise/franchise.module");
const ai_commerce_module_1 = require("./modules/ai-commerce/ai-commerce.module");
const fleet_os_module_1 = require("./modules/fleet-os/fleet-os.module");
const ads_module_1 = require("./modules/ads/ads.module");
const membership_module_1 = require("./modules/membership/membership.module");
const corporate_module_1 = require("./modules/corporate/corporate.module");
const seo_module_1 = require("./modules/seo/seo.module");
const email_module_1 = require("./modules/email/email.module");
const merchant_onboarding_module_1 = require("./modules/merchant-onboarding/merchant-onboarding.module");
const admin_auth_module_1 = require("./modules/admin-auth/admin-auth.module");
const delivery_coverage_module_1 = require("./modules/delivery-coverage/delivery-coverage.module");
const food_module_1 = require("./modules/food/food.module");
const logistics_module_1 = require("./modules/logistics/logistics.module");
const geocoding_module_1 = require("./modules/geocoding/geocoding.module");
const push_module_1 = require("./modules/push/push.module");
const http_exception_filter_1 = require("./common/filters/http-exception.filter");
const logging_interceptor_1 = require("./common/interceptors/logging.interceptor");
const request_id_interceptor_1 = require("./common/interceptors/request-id.interceptor");
let AppModule = class AppModule {
};
exports.AppModule = AppModule;
exports.AppModule = AppModule = __decorate([
    (0, common_1.Module)({
        imports: [
            config_1.ConfigModule.forRoot({
                isGlobal: true,
                envFilePath: (0, env_path_1.resolveEnvFilePaths)(),
                validationSchema: env_validation_1.validationSchema,
                validationOptions: { abortEarly: false },
                expandVariables: true,
            }),
            logger_module_1.LoggerModule,
            schedule_1.ScheduleModule.forRoot(),
            event_emitter_1.EventEmitterModule.forRoot({
                wildcard: false,
                delimiter: '.',
                maxListeners: 20,
                ignoreErrors: false,
            }),
            throttler_1.ThrottlerModule.forRootAsync({
                inject: [config_1.ConfigService],
                useFactory: (config) => ({
                    throttlers: [
                        {
                            name: 'default',
                            ttl: config.get('THROTTLE_TTL', 60000),
                            limit: config.get('THROTTLE_LIMIT', 100),
                        },
                    ],
                }),
            }),
            prisma_module_1.PrismaModule,
            redis_module_1.RedisModule,
            webhooks_module_1.WebhooksModule,
            order_timeline_module_1.OrderTimelineModule,
            health_module_1.HealthModule,
            email_module_1.EmailModule,
            merchant_onboarding_module_1.MerchantOnboardingModule,
            admin_auth_module_1.AdminAuthModule,
            audit_module_1.AuditModule,
            domain_events_module_1.DomainEventsModule,
            auth_module_1.AuthModule,
            merchant_module_1.MerchantModule,
            store_module_1.StoreModule,
            admin_module_1.AdminModule,
            product_module_1.ProductModule,
            buyer_module_1.BuyerModule,
            cart_module_1.CartModule,
            checkout_module_1.CheckoutModule,
            payment_module_1.PaymentModule,
            order_module_1.OrderModule,
            order_claim_module_1.OrderClaimModule,
            logistics_module_1.LogisticsModule,
            geocoding_module_1.GeocodingModule,
            rider_assignment_module_1.RiderAssignmentModule,
            rider_module_1.RiderModule,
            geo_module_1.GeoModule,
            location_directory_module_1.LocationDirectoryModule,
            upload_module_1.UploadModule,
            category_governance_module_1.CategoryGovernanceModule,
            merchant_dashboard_module_1.MerchantDashboardModule,
            admin_dashboard_module_1.AdminDashboardModule,
            settlement_module_1.SettlementModule,
            inventory_module_1.InventoryModule,
            delivery_tracking_module_1.DeliveryTrackingModule,
            store_review_module_1.StoreReviewModule,
            promotion_module_1.PromotionModule,
            geospatial_module_1.GeospatialModule,
            wallet_loyalty_module_1.WalletLoyaltyModule,
            analytics_module_1.AnalyticsModule,
            search_discovery_module_1.SearchDiscoveryModule,
            finance_module_1.FinanceModule,
            compliance_module_1.ComplianceModule,
            trust_safety_module_1.TrustSafetyModule,
            support_module_1.SupportModule,
            crm_module_1.CrmModule,
            push_module_1.PushModule,
            merchant_growth_module_1.MerchantGrowthModule,
            fulfillment_network_module_1.FulfillmentNetworkModule,
            procurement_module_1.ProcurementModule,
            franchise_module_1.FranchiseModule,
            ai_commerce_module_1.AICommerceModule,
            fleet_os_module_1.FleetOsModule,
            ads_module_1.AdsModule,
            membership_module_1.MembershipModule,
            corporate_module_1.CorporateModule,
            seo_module_1.SeoModule,
            delivery_coverage_module_1.DeliveryCoverageModule,
            food_module_1.FoodModule,
        ],
        providers: [
            { provide: core_1.APP_GUARD, useClass: demo_aware_throttler_guard_1.DemoAwareThrottlerGuard },
            { provide: core_1.APP_FILTER, useClass: http_exception_filter_1.HttpExceptionFilter },
            { provide: core_1.APP_INTERCEPTOR, useClass: request_id_interceptor_1.RequestIdInterceptor },
            { provide: core_1.APP_INTERCEPTOR, useClass: logging_interceptor_1.LoggingInterceptor },
        ],
    })
], AppModule);
//# sourceMappingURL=app.module.js.map