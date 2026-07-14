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
import { RedisIoAdapter } from './common/websocket/redis-io.adapter';
import { AppModule } from './app.module';
import { HttpExceptionFilter } from './common/filters/http-exception.filter';
import { getConfig } from './config/configuration';
import { initSentry } from './monitoring/sentry';

async function bootstrap(): Promise<void> {
  initSentry();
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
    // In production Nginx serves /uploads/ directly (see deploy/nginx). This
    // Node handler is the dev / fallback path — mirror the same safe headers so
    // behaviour is identical whichever tier answers: long-lived public cache
    // (upload filenames are UUID/content-addressed, so a replaced image gets a
    // new URL and never a stale hit) + nosniff. index:false disables serving
    // any index file, so a directory request 404s instead of listing.
    app.useStaticAssets(join(cfg.storage.uploadDir), {
      prefix: '/uploads/',
      index: false,
      setHeaders: (res: Response) => {
        res.setHeader('Cache-Control', 'public, max-age=86400, stale-while-revalidate=604800');
        res.setHeader('X-Content-Type-Options', 'nosniff');
      },
    });
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
      'health/db',
      'health/redis',
      'health/ready',
      'health/uptime',
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

  // ── Socket.IO adapter ─────────────────────────────────────────────────────
  // Production runs >1 replica, where in-memory rooms silently drop events that
  // originate on another instance. Redis pub/sub is mandatory there; locally we
  // degrade to the in-memory adapter so the API still boots without Redis.
  const redisAdapter = new RedisIoAdapter(app);
  try {
    await redisAdapter.connect();
    app.useWebSocketAdapter(redisAdapter);
  } catch (err) {
    if (cfg.nodeEnv === 'production') throw err;
    app
      .get(Logger)
      .warn(
        `Redis unavailable (${(err as Error).message}) — falling back to the in-memory ` +
          'Socket.IO adapter. Single-process only; cross-replica events will not fan out.',
        'Bootstrap',
      );
    app.useWebSocketAdapter(new IoAdapter(app));
  }

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
      `🚀 Jebdekho API running on ${publicApiUrl}/api/v1 [${cfg.nodeEnv}] pid=${process.pid}`,
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
