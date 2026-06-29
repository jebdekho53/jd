"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const core_1 = require("@nestjs/core");
const common_1 = require("@nestjs/common");
const config_1 = require("@nestjs/config");
const swagger_1 = require("@nestjs/swagger");
const nestjs_pino_1 = require("nestjs-pino");
const helmet_1 = require("helmet");
const express_1 = require("express");
const path_1 = require("path");
const platform_socket_io_1 = require("@nestjs/platform-socket.io");
const app_module_1 = require("./app.module");
const http_exception_filter_1 = require("./common/filters/http-exception.filter");
const configuration_1 = require("./config/configuration");
const sentry_1 = require("./monitoring/sentry");
async function bootstrap() {
    (0, sentry_1.initSentry)();
    const app = await core_1.NestFactory.create(app_module_1.AppModule, {
        bufferLogs: true,
        bodyParser: false,
    });
    app.use((0, express_1.json)({
        limit: '5mb',
        verify: (req, _res, buf) => {
            req.rawBody = buf;
        },
    }));
    app.use((0, express_1.urlencoded)({ limit: '5mb', extended: true }));
    app.useLogger(app.get(nestjs_pino_1.Logger));
    const configService = app.get(config_1.ConfigService);
    const cfg = (0, configuration_1.getConfig)(configService);
    if (cfg.trustProxy || cfg.nodeEnv === 'production') {
        app.set('trust proxy', 1);
    }
    if (cfg.storage.provider === 'local' && cfg.storage.uploadDir) {
        app.useStaticAssets((0, path_1.join)(cfg.storage.uploadDir), { prefix: '/uploads/' });
    }
    app.use((0, helmet_1.default)({
        contentSecurityPolicy: cfg.nodeEnv === 'production' ? undefined : false,
    }));
    app.enableCors({
        origin: cfg.cors.origins,
        methods: ['GET', 'POST', 'PUT', 'PATCH', 'DELETE', 'OPTIONS'],
        allowedHeaders: ['Content-Type', 'Authorization', 'Idempotency-Key', 'X-Device-Id'],
        credentials: true,
    });
    app.setGlobalPrefix('api/v1', {
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
    app.useGlobalPipes(new common_1.ValidationPipe({
        whitelist: true,
        forbidNonWhitelisted: true,
        transform: true,
        transformOptions: { enableImplicitConversion: true },
        stopAtFirstError: false,
    }));
    app.useGlobalFilters(new http_exception_filter_1.HttpExceptionFilter());
    app.useWebSocketAdapter(new platform_socket_io_1.IoAdapter(app));
    if (cfg.nodeEnv !== 'production') {
        const swaggerConfig = new swagger_1.DocumentBuilder()
            .setTitle('Jebdekho API')
            .setDescription('Hyperlocal commerce platform — buyer, merchant, rider, and admin API. ' +
            'Phase 1: Authentication & RBAC.')
            .setVersion('1.0')
            .addBearerAuth({ type: 'http', scheme: 'bearer', bearerFormat: 'JWT' }, 'access-token')
            .addServer(`http://127.0.0.1:${cfg.port}`, 'Local')
            .build();
        const document = swagger_1.SwaggerModule.createDocument(app, swaggerConfig);
        swagger_1.SwaggerModule.setup('api/docs', app, document, {
            swaggerOptions: { persistAuthorization: true },
        });
    }
    await app.listen(cfg.port, '0.0.0.0');
    const publicApiUrl = process.env.API_URL?.replace(/\/$/, '') ?? `http://127.0.0.1:${cfg.port}`;
    app
        .get(nestjs_pino_1.Logger)
        .log(`🚀 Jebdekho API running on ${publicApiUrl}/api/v1 [${cfg.nodeEnv}] pid=${process.pid}`, 'Bootstrap');
    if (cfg.nodeEnv !== 'production') {
        app
            .get(nestjs_pino_1.Logger)
            .log(`📄 Swagger docs available at http://127.0.0.1:${cfg.port}/api/docs`, 'Bootstrap');
    }
}
bootstrap().catch((err) => {
    console.error('Fatal: failed to start application', err);
    process.exit(1);
});
//# sourceMappingURL=main.js.map