import { NestFactory, Reflector } from '@nestjs/core';
import { ValidationPipe } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { DocumentBuilder, SwaggerModule } from '@nestjs/swagger';
import { Logger } from 'nestjs-pino';
import helmet from 'helmet';
import { json, urlencoded, type Request, type Response } from 'express';
import { join } from 'path';
import type { NestExpressApplication } from '@nestjs/platform-express';
import { IoAdapter } from '@nestjs/platform-socket.io';
import { AppModule } from './app.module';
import { HttpExceptionFilter } from './common/filters/http-exception.filter';
import { getConfig } from './config/configuration';

async function bootstrap(): Promise<void> {
  const app = await NestFactory.create<NestExpressApplication>(AppModule, {
    bufferLogs: true,
    bodyParser: false,
  });

  // Category images and document uploads may be sent as base64 data URLs.
  // verify preserves rawBody for Razorpay webhook signature checks.
  app.use(
    json({
      limit: '5mb',
      verify: (req: Request, _res: Response, buf: Buffer) => {
        (req as Request & { rawBody?: Buffer }).rawBody = buf;
      },
    }),
  );
  app.use(urlencoded({ limit: '5mb', extended: true }));

  // ── Pino structured logger ─────────────────────────────────────────────────
  app.useLogger(app.get(Logger));

  const configService = app.get(ConfigService);
  const cfg = getConfig(configService);

  if (cfg.trustProxy || cfg.nodeEnv === 'production') {
    app.set('trust proxy', 1);
  }

  if (cfg.storage.provider === 'local' && cfg.storage.uploadDir) {
    app.useStaticAssets(join(cfg.storage.uploadDir), { prefix: '/uploads/' });
  }

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
    exclude: [
      'health',
      'health/ready',
      'sitemap.xml',
      'sitemap-products.xml',
      'sitemap-stores.xml',
      'sitemap-categories.xml',
      'sitemap-cities.xml',
      'sitemap-faq.xml',
      'robots.txt',
      'llms.txt',
    ],
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

  app.useWebSocketAdapter(new IoAdapter(app));

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
      .addServer(`http://127.0.0.1:${cfg.port}`, 'Local')
      .build();

    const document = SwaggerModule.createDocument(app, swaggerConfig);
    SwaggerModule.setup('api/docs', app, document, {
      swaggerOptions: { persistAuthorization: true },
    });
  }

  await app.listen(cfg.port, '0.0.0.0');

  const publicApiUrl =
    process.env.API_URL?.replace(/\/$/, '') ?? `http://127.0.0.1:${cfg.port}`;

  app
    .get(Logger)
    .log(
      `🚀 Jebdekho API running on ${publicApiUrl}/api/v1 [${cfg.nodeEnv}]`,
      'Bootstrap',
    );

  if (cfg.nodeEnv !== 'production') {
    app
      .get(Logger)
      .log(
        `📄 Swagger docs available at http://127.0.0.1:${cfg.port}/api/docs`,
        'Bootstrap',
      );
  }
}

bootstrap().catch((err: unknown) => {
  console.error('Fatal: failed to start application', err);
  process.exit(1);
});
