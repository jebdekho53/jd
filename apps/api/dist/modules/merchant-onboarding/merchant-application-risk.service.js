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
Object.defineProperty(exports, "__esModule", { value: true });
exports.MerchantApplicationRiskService = void 0;
const common_1 = require("@nestjs/common");
const prisma_service_1 = require("../../database/prisma.service");
let MerchantApplicationRiskService = class MerchantApplicationRiskService {
    constructor(prisma) {
        this.prisma = prisma;
    }
    async assess(input) {
        const flags = [];
        let riskScore = 0;
        const checks = [];
        if (input.gstNumber) {
            checks.push(this.prisma.merchantProfile
                .findFirst({
                where: {
                    gstNumber: input.gstNumber,
                    ...(input.applicationId && {
                        merchantApplication: { id: { not: input.applicationId } },
                    }),
                },
            })
                .then((dup) => {
                if (dup) {
                    flags.push('DUPLICATE_GST');
                    riskScore += 40;
                }
            }));
        }
        if (input.panNumber) {
            checks.push(this.prisma.merchantProfile
                .findFirst({
                where: {
                    panNumber: input.panNumber,
                    ...(input.applicationId && {
                        merchantApplication: { id: { not: input.applicationId } },
                    }),
                },
            })
                .then((dup) => {
                if (dup) {
                    flags.push('DUPLICATE_PAN');
                    riskScore += 35;
                }
            }));
        }
        if (input.ownerPhone) {
            checks.push(this.prisma.user
                .findFirst({
                where: {
                    phone: input.ownerPhone,
                    id: { not: input.userId },
                    merchantProfile: { isNot: null },
                },
            })
                .then((dup) => {
                if (dup) {
                    flags.push('DUPLICATE_MOBILE');
                    riskScore += 30;
                }
            }));
        }
        if (input.ownerEmail) {
            checks.push(this.prisma.user
                .findFirst({
                where: {
                    email: input.ownerEmail,
                    id: { not: input.userId },
                    merchantProfile: { isNot: null },
                },
            })
                .then((dup) => {
                if (dup) {
                    flags.push('DUPLICATE_EMAIL');
                    riskScore += 25;
                }
            }));
        }
        if (input.accountNumber) {
            checks.push(this.prisma.merchantBankAccount
                .findFirst({
                where: {
                    accountNumber: input.accountNumber,
                    ...(input.applicationId && { applicationId: { not: input.applicationId } }),
                },
            })
                .then((dup) => {
                if (dup) {
                    flags.push('DUPLICATE_BANK_ACCOUNT');
                    riskScore += 35;
                }
            }));
        }
        const deviceCount = await this.prisma.deviceFingerprint.count({
            where: { userId: input.userId },
        });
        if (deviceCount > 3) {
            flags.push('MULTIPLE_DEVICES');
            riskScore += 10;
        }
        await Promise.all(checks);
        return {
            riskScore: Math.min(100, riskScore),
            riskFlags: flags,
        };
    }
    flagsToJson(flags) {
        return flags;
    }
};
exports.MerchantApplicationRiskService = MerchantApplicationRiskService;
exports.MerchantApplicationRiskService = MerchantApplicationRiskService = __decorate([
    (0, common_1.Injectable)(),
    __metadata("design:paramtypes", [prisma_service_1.PrismaService])
], MerchantApplicationRiskService);
//# sourceMappingURL=merchant-application-risk.service.js.map