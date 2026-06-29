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
var IdempotencyInterceptor_1;
Object.defineProperty(exports, "__esModule", { value: true });
exports.IdempotencyInterceptor = void 0;
const common_1 = require("@nestjs/common");
const rxjs_1 = require("rxjs");
const operators_1 = require("rxjs/operators");
const prisma_service_1 = require("../../database/prisma.service");
const IDEMPOTENCY_TTL_MS = 24 * 60 * 60 * 1000;
let IdempotencyInterceptor = IdempotencyInterceptor_1 = class IdempotencyInterceptor {
    constructor(prisma) {
        this.prisma = prisma;
        this.logger = new common_1.Logger(IdempotencyInterceptor_1.name);
    }
    intercept(context, next) {
        const req = context.switchToHttp().getRequest();
        const idempKey = req.headers['idempotency-key'];
        if (!idempKey)
            return next.handle();
        if (!req.user?.id)
            return next.handle();
        return (0, rxjs_1.from)(this.resolveIdempotency(req, idempKey, next)).pipe((0, operators_1.mergeMap)((obs) => obs));
    }
    async resolveIdempotency(req, idempKey, next) {
        const userId = req.user.id;
        const endpoint = `${req.method}:${req.path}`;
        const existing = await this.prisma.idempotencyKey.findUnique({
            where: { key: idempKey },
        });
        if (existing) {
            if (existing.userId !== userId) {
                throw new common_1.ConflictException('Idempotency-Key was already used by another account');
            }
            if (existing.processing) {
                this.logger.warn(`Idempotency concurrent conflict: ${idempKey}`);
                throw Object.assign(new Error('Request is already being processed'), {
                    status: 409,
                    message: 'A request with this Idempotency-Key is already being processed.',
                });
            }
            this.logger.debug(`Idempotency cache hit: ${idempKey}`);
            return (0, rxjs_1.of)(existing.responseBody);
        }
        await this.prisma.idempotencyKey.create({
            data: {
                key: idempKey,
                userId,
                endpoint,
                responseCode: 0,
                responseBody: {},
                processing: true,
                expiresAt: new Date(Date.now() + IDEMPOTENCY_TTL_MS),
            },
        });
        return next.handle().pipe((0, operators_1.tap)({
            next: async (response) => {
                try {
                    await this.prisma.idempotencyKey.update({
                        where: { key: idempKey },
                        data: {
                            responseCode: 200,
                            responseBody: response,
                            processing: false,
                        },
                    });
                }
                catch (e) {
                    this.logger.error(`Idempotency persist error: ${e.message}`);
                }
            },
            error: async () => {
                try {
                    await this.prisma.idempotencyKey.delete({ where: { key: idempKey } });
                }
                catch (_) { }
            },
        }));
    }
};
exports.IdempotencyInterceptor = IdempotencyInterceptor;
exports.IdempotencyInterceptor = IdempotencyInterceptor = IdempotencyInterceptor_1 = __decorate([
    (0, common_1.Injectable)(),
    __metadata("design:paramtypes", [prisma_service_1.PrismaService])
], IdempotencyInterceptor);
//# sourceMappingURL=idempotency.interceptor.js.map