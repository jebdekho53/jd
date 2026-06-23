import { NestFactory, Reflector } from '@nestjs/core';
import { ValidationPipe } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { DocumentBuilder, SwaggerModule } from '@nestjs/swagger';
import { Logger } from 'nestjs-pino';
import helmet from 'helmet';
import { AppModule } from './app.module';
import { HttpExceptionFilter } from './common/filters/http-exception.filter';
import { getConfig } from './config/configuration';

async function bootstrap(): Promise<void> {
  const app = await NestFactory.create(AppModule, {
    // Buffer logs until the Pino logger is attached
    bufferLogs: true,
    // rawBody required for Razorpay webhook signature verification
    rawBody: true,
  });

  // ── Pino structured logger ─────────────────────────────────────────────────
  app.useLogger(app.get(Logger));

  const configService = app.get(ConfigService);
  const cfg = getConfig(configService);

  // ── Security headers (Helmet) ─────────────────────────────────────────────
  app.use(
    helmet({
      contentSecurityPolicy: cfg.nodeEnv === 'production' ? undefined : false,
    }),
  );

  // ── CORS ───────────────────────────────────────────────────────────────────
  app.enableCors({
    origin: cfg.cors.origins,
    methods: ['GET', 'POST', 'PUT', 'PATCH', 'DELETE', 'OPTIONS'],
    allowedHeaders: ['Content-Type', 'Authorization', 'Idempotency-Key', 'X-Device-Id'],
    credentials: true,
  });

  // ── Global API prefix ─────────────────────────────────────────────────────
  app.setGlobalPrefix('api/v1', {
    // Health endpoints are NOT under /api/v1 for infrastructure tooling
    exclude: ['health', 'health/ready'],
  });

  // ── Global validation pipe ────────────────────────────────────────────────
  app.useGlobalPipes(
    new ValidationPipe({
      whitelist: true,
      forbidNonWhitelisted: true,
      transform: true,
      transformOptions: { enableImplicitConversion: true },
      stopAtFirstError: false,
    }),
  );

  // ── Global exception filter ───────────────────────────────────────────────
  app.useGlobalFilters(new HttpExceptionFilter());

  // ── Swagger (dev / staging only) ─────────────────────────────────────────
  if (cfg.nodeEnv !== 'production') {
    const swaggerConfig = new DocumentBuilder()
      .setTitle('Jebdekho API')
      .setDescription(
        'Hyperlocal commerce platform — buyer, merchant, rider, and admin API. ' +
        'Phase 1: Authentication & RBAC.',
      )
      .setVersion('1.0')
      .addBearerAuth(
        { type: 'http', scheme: 'bearer', bearerFormat: 'JWT' },
        'access-token',
      )
      .addServer(`http://localhost:${cfg.port}`, 'Local')
      .build();

    const document = SwaggerModule.createDocument(app, swaggerConfig);
    SwaggerModule.setup('api/docs', app, document, {
      swaggerOptions: { persistAuthorization: true },
    });
  }

  await app.listen(cfg.port, '0.0.0.0');

  app
    .get(Logger)
    .log(
      `🚀 Jebdekho API running on http://localhost:${cfg.port}/api/v1 [${cfg.nodeEnv}]`,
      'Bootstrap',
    );

  if (cfg.nodeEnv !== 'production') {
    app
      .get(Logger)
      .log(
        `📄 Swagger docs available at http://localhost:${cfg.port}/api/docs`,
        'Bootstrap',
      );
  }
}

bootstrap().catch((err: unknown) => {
  console.error('Fatal: failed to start application', err);
  process.exit(1);
});
