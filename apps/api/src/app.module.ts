import { Module } from '@nestjs/common';
import { ConfigModule, ConfigService } from '@nestjs/config';
import { APP_FILTER, APP_GUARD, APP_INTERCEPTOR } from '@nestjs/core';
import { EventEmitterModule } from '@nestjs/event-emitter';
import { ThrottlerModule, ThrottlerGuard } from '@nestjs/throttler';
import { ScheduleModule } from '@nestjs/schedule';
import { validationSchema } from './config/env.validation';
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
import { RiderModule } from './modules/rider/rider.module';
import { HttpExceptionFilter } from './common/filters/http-exception.filter';
import { LoggingInterceptor } from './common/interceptors/logging.interceptor';

@Module({
  imports: [
    // ── Config ──────────────────────────────────────────────────────────────
    ConfigModule.forRoot({
      isGlobal: true,
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

    // ── Feature modules ───────────────────────────────────────────────────────
    HealthModule,
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
    RiderModule,
  ],
  providers: [
    // Apply global throttle guard to every route
    { provide: APP_GUARD, useClass: ThrottlerGuard },

    // Global exception filter — structured error responses
    { provide: APP_FILTER, useClass: HttpExceptionFilter },

    // Global logging interceptor — request timing + user context
    { provide: APP_INTERCEPTOR, useClass: LoggingInterceptor },
  ],
})
export class AppModule {}
