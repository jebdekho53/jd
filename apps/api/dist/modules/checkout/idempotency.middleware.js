"use strict";
var __decorate = (this && this.__decorate) || function (decorators, target, key, desc) {
    var c = arguments.length, r = c < 3 ? target : desc === null ? desc = Object.getOwnPropertyDescriptor(target, key) : desc, d;
    if (typeof Reflect === "object" && typeof Reflect.decorate === "function") r = Reflect.decorate(decorators, target, key, desc);
    else for (var i = decorators.length - 1; i >= 0; i--) if (d = decorators[i]) r = (c < 3 ? d(r) : c > 3 ? d(target, key, r) : d(target, key)) || r;
    return c > 3 && r && Object.defineProperty(target, key, r), r;
};
var __metadata = (this && this.__metadata) || function (k, v) {
    if (typeof Reflect === "object" && typeof Reflect.metadata === "function") return Reflect.metadata(k, v);
};
var IdempotencyMiddleware_1;
Object.defineProperty(exports, "__esModule", { value: true });
exports.IdempotencyMiddleware = void 0;
const common_1 = require("@nestjs/common");
const prisma_service_1 = require("../../database/prisma.service");
const IDEMPOTENCY_TTL_MS = 24 * 60 * 60 * 1000;
let IdempotencyMiddleware = IdempotencyMiddleware_1 = class IdempotencyMiddleware {
    constructor(prisma) {
        this.prisma = prisma;
        this.logger = new common_1.Logger(IdempotencyMiddleware_1.name);
    }
    async use(req, res, next) {
        const idempotencyKey = req.headers['idempotency-key'];
        if (!idempotencyKey) {
            next();
            return;
        }
        const userId = req.user?.id;
        const endpoint = `${req.method}:${req.path}`;
        const existing = await this.prisma.idempotencyKey.findUnique({
            where: { key: idempotencyKey },
        });
        if (existing) {
            if (existing.userId && userId && existing.userId !== userId) {
                res.status(403).json({
                    success: false,
                    error: { code: 'IDEMPOTENCY_KEY_MISMATCH', message: 'Idempotency key belongs to a different user' },
                });
                return;
            }
            if (existing.processing) {
                res.status(409).json({
                    success: false,
                    error: {
                        code: 'IDEMPOTENCY_CONFLICT',
                        message: 'A request with this idempotency key is currently being processed',
                    },
                });
                return;
            }
            this.logger.debug(`Idempotency cache hit: ${idempotencyKey}`);
            res.status(existing.responseCode).json(existing.responseBody);
            return;
        }
        try {
            await this.prisma.idempotencyKey.create({
                data: {
                    key: idempotencyKey,
                    userId: userId ?? '',
                    endpoint,
                    responseCode: 0,
                    responseBody: {},
                    processing: true,
                    expiresAt: new Date(Date.now() + IDEMPOTENCY_TTL_MS),
                },
            });
        }
        catch {
            res.status(409).json({
                success: false,
                error: {
                    code: 'IDEMPOTENCY_CONFLICT',
                    message: 'A request with this idempotency key is currently being processed',
                },
            });
            return;
        }
        const originalJson = res.json.bind(res);
        const originalStatus = res.status.bind(res);
        let capturedStatus = 200;
        res.status = (code) => {
            capturedStatus = code;
            return originalStatus(code);
        };
        res.json = (body) => {
            this.prisma.idempotencyKey
                .update({
                where: { key: idempotencyKey },
                data: {
                    responseCode: capturedStatus,
                    responseBody: body,
                    processing: false,
                },
            })
                .catch((err) => this.logger.warn(`Failed to persist idempotency response: ${err.message}`));
            return originalJson(body);
        };
        next();
    }
};
exports.IdempotencyMiddleware = IdempotencyMiddleware;
exports.IdempotencyMiddleware = IdempotencyMiddleware = IdempotencyMiddleware_1 = __decorate([
    (0, common_1.Injectable)(),
    __metadata("design:paramtypes", [prisma_service_1.PrismaService])
], IdempotencyMiddleware);
//# sourceMappingURL=idempotency.middleware.js.map