import { Module } from '@nestjs/common';
import { ConfigModule, ConfigService } from '@nestjs/config';
import { APP_FILTER, APP_GUARD, APP_INTERCEPTOR } from '@nestjs/core';
import { EventEmitterModule } from '@nestjs/event-emitter';
import { ThrottlerModule } from '@nestjs/throttler';
import { DemoAwareThrottlerGuard } from './common/guards/demo-aware-throttler.guard';
import { ScheduleModule } from '@nestjs/schedule';
import { validationSchema } from './config/env.validation';
import { resolveEnvFilePaths } from './config/env-path';
import { LoggerModule } from './logger/logger.module';
import { PrismaModule } from './database/prisma.module';
import { RedisModule } from './redis/redis.module';
import { HealthModule } from './health/health.module';
import { AuditModule } from './modules/audit/audit.module';
import { DomainEventsModule } from './modules/domain-events/domain-events.module';
import { AuthModule } from './modules/auth/auth.module';
import { MerchantModule } from './modules/merchant/merchant.module';
import { StoreModule } from './modules/store/store.module';
import { AdminModule } from './modules/admin/admin.module';
import { ProductModule } from './modules/product/product.module';
import { BuyerModule } from './modules/buyer/buyer.module';
import { CartModule } from './modules/cart/cart.module';
import { CheckoutModule } from './modules/checkout/checkout.module';
import { PaymentModule } from './modules/payment/payment.module';
import { OrderModule } from './modules/order/order.module';
import { OrderTimelineModule } from './modules/order/order-timeline.module';
import { RiderAssignmentModule } from './modules/rider-assignment/rider-assignment.module';
import { RiderModule } from './modules/rider/rider.module';
import { GeoModule } from './modules/geo/geo.module';
import { LocationDirectoryModule } from './modules/location-directory/location-directory.module';
import { UploadModule } from './modules/upload/upload.module';
import { CategoryGovernanceModule } from './modules/category-governance/category-governance.module';
import { MerchantDashboardModule } from './modules/merchant-dashboard/merchant-dashboard.module';
import { AdminDashboardModule } from './modules/admin-dashboard/admin-dashboard.module';
import { SettlementModule } from './modules/settlement/settlement.module';
import { InventoryModule } from './modules/inventory/inventory.module';
import { DeliveryTrackingModule } from './modules/delivery-tracking/delivery-tracking.module';
import { StoreReviewModule } from './modules/store-review/store-review.module';
import { PromotionModule } from './modules/promotion/promotion.module';
import { GeospatialModule } from './modules/geospatial/geospatial.module';
import { WalletLoyaltyModule } from './modules/wallet-loyalty/wallet-loyalty.module';
import { AnalyticsModule } from './modules/analytics/analytics.module';
import { SearchDiscoveryModule } from './modules/search-discovery/search-discovery.module';
import { FinanceModule } from './modules/finance/finance.module';
import { ComplianceModule } from './modules/compliance/compliance.module';
import { TrustSafetyModule } from './modules/trust-safety/trust-safety.module';
import { SupportModule } from './modules/support/support.module';
import { CrmModule } from './modules/crm/crm.module';
import { MerchantGrowthModule } from './modules/merchant-growth/merchant-growth.module';
import { FulfillmentNetworkModule } from './modules/fulfillment-network/fulfillment-network.module';
import { ProcurementModule } from './modules/procurement/procurement.module';
import { FranchiseModule } from './modules/franchise/franchise.module';
import { AICommerceModule } from './modules/ai-commerce/ai-commerce.module';
import { FleetOsModule } from './modules/fleet-os/fleet-os.module';
import { AdsModule } from './modules/ads/ads.module';
import { MembershipModule } from './modules/membership/membership.module';
import { CorporateModule } from './modules/corporate/corporate.module';
import { SeoModule } from './modules/seo/seo.module';
import { EmailModule } from './modules/email/email.module';
import { MerchantOnboardingModule } from './modules/merchant-onboarding/merchant-onboarding.module';
import { AdminAuthModule } from './modules/admin-auth/admin-auth.module';
import { DeliveryCoverageModule } from './modules/delivery-coverage/delivery-coverage.module';
import { HttpExceptionFilter } from './common/filters/http-exception.filter';
import { LoggingInterceptor } from './common/interceptors/logging.interceptor';

@Module({
  imports: [
    // ── Config ──────────────────────────────────────────────────────────────
    ConfigModule.forRoot({
      isGlobal: true,
      envFilePath: resolveEnvFilePaths(),
      validationSchema,
      validationOptions: { abortEarly: false },
      expandVariables: true,
    }),

    // ── Logging ──────────────────────────────────────────────────────────────
    LoggerModule,

    // ── Scheduler (cron jobs for reservation cleanup) ─────────────────────────
    ScheduleModule.forRoot(),

    // ── Event bus ────────────────────────────────────────────────────────────
    EventEmitterModule.forRoot({
      wildcard: false,
      delimiter: '.',
      maxListeners: 20,
      ignoreErrors: false,
    }),

    // ── Rate limiting ────────────────────────────────────────────────────────
    ThrottlerModule.forRootAsync({
      inject: [ConfigService],
      useFactory: (config: ConfigService) => ({
        throttlers: [
          {
            name: 'default',
            ttl: config.get<number>('THROTTLE_TTL', 60000),
            limit: config.get<number>('THROTTLE_LIMIT', 100),
          },
        ],
      }),
    }),

    // ── Infrastructure ────────────────────────────────────────────────────────
    PrismaModule,
    RedisModule,
    OrderTimelineModule,

    // ── Feature modules ───────────────────────────────────────────────────────
    HealthModule,
    EmailModule,
    MerchantOnboardingModule,
    AdminAuthModule,
    AuditModule,
    DomainEventsModule,
    AuthModule,
    MerchantModule,
    StoreModule,
    AdminModule,
    ProductModule,
    BuyerModule,
    CartModule,
    CheckoutModule,
    PaymentModule,
    OrderModule,
    RiderAssignmentModule,
    RiderModule,
    GeoModule,
    LocationDirectoryModule,
    UploadModule,
    CategoryGovernanceModule,
    MerchantDashboardModule,
    AdminDashboardModule,
    SettlementModule,
    InventoryModule,
    DeliveryTrackingModule,
    StoreReviewModule,
    PromotionModule,
    GeospatialModule,
    WalletLoyaltyModule,
    AnalyticsModule,
    SearchDiscoveryModule,
    FinanceModule,
    ComplianceModule,
    TrustSafetyModule,
    SupportModule,
    CrmModule,
    MerchantGrowthModule,
    FulfillmentNetworkModule,
    ProcurementModule,
    FranchiseModule,
    AICommerceModule,
    FleetOsModule,
    AdsModule,
    MembershipModule,
    CorporateModule,
    SeoModule,
    DeliveryCoverageModule,
  ],
  providers: [
    // Apply global throttle guard to every route
    { provide: APP_GUARD, useClass: DemoAwareThrottlerGuard },

    // Global exception filter — structured error responses
    { provide: APP_FILTER, useClass: HttpExceptionFilter },

    // Global logging interceptor — request timing + user context
    { provide: APP_INTERCEPTOR, useClass: LoggingInterceptor },
  ],
})
export class AppModule {}
