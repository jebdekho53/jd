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
var MerchantAiWalletService_1;
Object.defineProperty(exports, "__esModule", { value: true });
exports.MerchantAiWalletService = exports.INSUFFICIENT_AI_WALLET_MESSAGE = void 0;
const common_1 = require("@nestjs/common");
const config_1 = require("@nestjs/config");
const client_1 = require("@prisma/client");
const prisma_service_1 = require("../../database/prisma.service");
const audit_service_1 = require("../audit/audit.service");
const razorpay_service_1 = require("../payment/razorpay.service");
exports.INSUFFICIENT_AI_WALLET_MESSAGE = 'Insufficient AI wallet balance. Please recharge minimum ₹100 to continue.';
let MerchantAiWalletService = MerchantAiWalletService_1 = class MerchantAiWalletService {
    constructor(prisma, config, razorpay, audit) {
        this.prisma = prisma;
        this.config = config;
        this.razorpay = razorpay;
        this.audit = audit;
        this.logger = new common_1.Logger(MerchantAiWalletService_1.name);
    }
    getMinRechargePaise() {
        return this.config.get('AI_WALLET_MIN_RECHARGE_PAISE', 10_000);
    }
    getProductCostPaise() {
        return this.config.get('AI_PRODUCT_ANALYSIS_PRICE_PAISE', 150);
    }
    buildDebitIdempotencyKey(merchantProfileId, storeId, analysisId) {
        return `${merchantProfileId}:${storeId}:${analysisId}:AI_PRODUCT_CREATE`;
    }
    buildRefundIdempotencyKey(debitKey) {
        return `${debitKey}:REFUND`;
    }
    async getOrCreateWallet(merchantProfileId) {
        return this.prisma.merchantAiWallet.upsert({
            where: { merchantProfileId },
            create: { merchantProfileId },
            update: {},
        });
    }
    async getWalletSummary(merchantProfileId, page = 1, limit = 50) {
        const wallet = await this.getOrCreateWallet(merchantProfileId);
        const [transactions, total] = await Promise.all([
            this.prisma.merchantAiWalletTransaction.findMany({
                where: { merchantProfileId },
                orderBy: { createdAt: 'desc' },
                skip: (page - 1) * limit,
                take: limit,
                include: {
                    analysis: {
                        select: {
                            id: true,
                            createdProductId: true,
                            extractedJson: true,
                            createdProduct: { select: { id: true, name: true } },
                        },
                    },
                },
            }),
            this.prisma.merchantAiWalletTransaction.count({ where: { merchantProfileId } }),
        ]);
        return {
            balancePaise: wallet.balancePaise,
            balanceRupee: wallet.balancePaise / 100,
            minimumRechargePaise: this.getMinRechargePaise(),
            minimumRechargeRupee: this.getMinRechargePaise() / 100,
            aiProductCostPaise: this.getProductCostPaise(),
            aiProductCostRupee: this.getProductCostPaise() / 100,
            totalSpentPaise: wallet.totalSpentPaise,
            totalRechargedPaise: wallet.totalRechargedPaise,
            totalRefundedPaise: wallet.totalRefundedPaise,
            transactions: transactions.map((tx) => ({
                id: tx.id,
                type: tx.type,
                status: tx.status,
                amountPaise: tx.amountPaise,
                amountRupee: tx.amountPaise / 100,
                balanceBeforePaise: tx.balanceBeforePaise,
                balanceAfterPaise: tx.balanceAfterPaise,
                reason: tx.reason,
                storeId: tx.storeId,
                analysisId: tx.analysisId,
                productName: tx.analysis?.createdProduct?.name ??
                    tx.analysis?.extractedJson?.name ??
                    null,
                createdAt: tx.createdAt,
            })),
            meta: { page, limit, total, totalPages: Math.ceil(total / limit) },
        };
    }
    async createRechargeOrder(merchantProfileId, amountPaise, userId, ip) {
        const min = this.getMinRechargePaise();
        if (amountPaise < min) {
            throw new common_1.BadRequestException(`Minimum recharge is ₹${min / 100}`);
        }
        if (!this.razorpay.isConfigured()) {
            throw new common_1.BadRequestException('Online payments are not configured');
        }
        const wallet = await this.getOrCreateWallet(merchantProfileId);
        const receipt = `ai-wallet-${merchantProfileId.slice(-8)}-${Date.now()}`;
        const rzpOrder = await this.razorpay.createOrder(amountPaise / 100, receipt);
        const idempotencyKey = `recharge:${merchantProfileId}:${rzpOrder.id}`;
        const tx = await this.prisma.merchantAiWalletTransaction.create({
            data: {
                merchantProfileId,
                type: client_1.MerchantAiWalletTransactionType.RECHARGE,
                amountPaise,
                balanceBeforePaise: wallet.balancePaise,
                balanceAfterPaise: wallet.balancePaise,
                status: client_1.MerchantAiWalletTransactionStatus.PENDING,
                razorpayOrderId: rzpOrder.id,
                reason: 'AI wallet recharge',
                idempotencyKey,
            },
        });
        await this.audit.log({
            actorId: userId,
            action: 'AI_WALLET_RECHARGE_INITIATED',
            resourceType: 'merchant_ai_wallet_transaction',
            resourceId: tx.id,
            ipAddress: ip,
            metadata: { amountPaise, razorpayOrderId: rzpOrder.id },
        });
        return {
            transactionId: tx.id,
            razorpayOrderId: rzpOrder.id,
            keyId: this.razorpay.keyId,
            amount: rzpOrder.amount,
            currency: rzpOrder.currency,
            amountPaise,
        };
    }
    async verifyRecharge(merchantProfileId, razorpayOrderId, razorpayPaymentId, razorpaySignature, userId, ip) {
        if (!this.razorpay.verifyPaymentSignature(razorpayOrderId, razorpayPaymentId, razorpaySignature)) {
            throw new common_1.UnauthorizedException('Invalid payment signature');
        }
        const pending = await this.prisma.merchantAiWalletTransaction.findFirst({
            where: {
                merchantProfileId,
                razorpayOrderId,
                type: client_1.MerchantAiWalletTransactionType.RECHARGE,
            },
        });
        if (!pending)
            throw new common_1.BadRequestException('Recharge transaction not found');
        if (pending.status === client_1.MerchantAiWalletTransactionStatus.SUCCESS) {
            const wallet = await this.getOrCreateWallet(merchantProfileId);
            return {
                success: true,
                alreadyProcessed: true,
                balancePaise: wallet.balancePaise,
                transactionId: pending.id,
            };
        }
        const result = await this.prisma.$transaction(async (tx) => {
            const current = await tx.merchantAiWalletTransaction.findUnique({
                where: { id: pending.id },
            });
            if (!current || current.status === client_1.MerchantAiWalletTransactionStatus.SUCCESS) {
                const wallet = await tx.merchantAiWallet.findUnique({ where: { merchantProfileId } });
                return { wallet: wallet, transactionId: current?.id ?? pending.id, credited: false };
            }
            const wallet = await tx.merchantAiWallet.upsert({
                where: { merchantProfileId },
                create: {
                    merchantProfileId,
                    balancePaise: current.amountPaise,
                    totalRechargedPaise: current.amountPaise,
                },
                update: {
                    balancePaise: { increment: current.amountPaise },
                    totalRechargedPaise: { increment: current.amountPaise },
                },
            });
            await tx.merchantAiWalletTransaction.update({
                where: { id: current.id },
                data: {
                    status: client_1.MerchantAiWalletTransactionStatus.SUCCESS,
                    razorpayPaymentId,
                    balanceBeforePaise: wallet.balancePaise - current.amountPaise,
                    balanceAfterPaise: wallet.balancePaise,
                },
            });
            return { wallet, transactionId: current.id, credited: true };
        });
        if (result.credited) {
            await this.audit.log({
                actorId: userId,
                action: 'AI_WALLET_RECHARGED',
                resourceType: 'merchant_ai_wallet_transaction',
                resourceId: result.transactionId,
                ipAddress: ip,
                metadata: { amountPaise: pending.amountPaise, razorpayPaymentId },
            });
        }
        return {
            success: true,
            alreadyProcessed: !result.credited,
            balancePaise: result.wallet.balancePaise,
            transactionId: result.transactionId,
        };
    }
    async debitForProductCreation(merchantProfileId, storeId, analysisId, userId, ip) {
        const amountPaise = this.getProductCostPaise();
        const idempotencyKey = this.buildDebitIdempotencyKey(merchantProfileId, storeId, analysisId);
        const existing = await this.prisma.merchantAiWalletTransaction.findUnique({
            where: { idempotencyKey },
        });
        if (existing?.status === client_1.MerchantAiWalletTransactionStatus.SUCCESS) {
            return { charged: false, amountPaise: existing.amountPaise, transactionId: existing.id };
        }
        try {
            const result = await this.prisma.$transaction(async (tx) => {
                const wallet = await tx.merchantAiWallet.upsert({
                    where: { merchantProfileId },
                    create: { merchantProfileId },
                    update: {},
                });
                if (wallet.balancePaise < amountPaise) {
                    throw new common_1.HttpException({ message: exports.INSUFFICIENT_AI_WALLET_MESSAGE, code: 'INSUFFICIENT_AI_WALLET' }, common_1.HttpStatus.PAYMENT_REQUIRED);
                }
                const updatedWallet = await tx.merchantAiWallet.update({
                    where: { merchantProfileId },
                    data: {
                        balancePaise: { decrement: amountPaise },
                        totalSpentPaise: { increment: amountPaise },
                    },
                });
                if (updatedWallet.balancePaise < 0) {
                    throw new common_1.HttpException({ message: exports.INSUFFICIENT_AI_WALLET_MESSAGE, code: 'INSUFFICIENT_AI_WALLET' }, common_1.HttpStatus.PAYMENT_REQUIRED);
                }
                const walletTx = await tx.merchantAiWalletTransaction.create({
                    data: {
                        merchantProfileId,
                        storeId,
                        analysisId,
                        type: client_1.MerchantAiWalletTransactionType.DEBIT,
                        amountPaise,
                        balanceBeforePaise: wallet.balancePaise,
                        balanceAfterPaise: updatedWallet.balancePaise,
                        status: client_1.MerchantAiWalletTransactionStatus.SUCCESS,
                        reason: 'AI product creation confirmed',
                        idempotencyKey,
                    },
                });
                return walletTx;
            });
            await this.audit.log({
                actorId: userId,
                action: 'AI_WALLET_DEBIT',
                resourceType: 'merchant_ai_wallet_transaction',
                resourceId: result.id,
                ipAddress: ip,
                metadata: { analysisId, storeId, amountPaise },
            });
            return { charged: true, amountPaise, transactionId: result.id };
        }
        catch (e) {
            if (e instanceof common_1.HttpException)
                throw e;
            const dup = await this.prisma.merchantAiWalletTransaction.findUnique({
                where: { idempotencyKey },
            });
            if (dup) {
                return { charged: false, amountPaise: dup.amountPaise, transactionId: dup.id };
            }
            throw e;
        }
    }
    async refundOnProductCreationFailure(merchantProfileId, storeId, analysisId, reason, userId, ip) {
        const debitKey = this.buildDebitIdempotencyKey(merchantProfileId, storeId, analysisId);
        const debit = await this.prisma.merchantAiWalletTransaction.findUnique({
            where: { idempotencyKey: debitKey },
        });
        if (!debit || debit.status !== client_1.MerchantAiWalletTransactionStatus.SUCCESS)
            return;
        const refundKey = this.buildRefundIdempotencyKey(debitKey);
        const existingRefund = await this.prisma.merchantAiWalletTransaction.findUnique({
            where: { idempotencyKey: refundKey },
        });
        if (existingRefund)
            return;
        await this.prisma.$transaction(async (tx) => {
            const wallet = await tx.merchantAiWallet.findUnique({ where: { merchantProfileId } });
            if (!wallet)
                return;
            const updatedWallet = await tx.merchantAiWallet.update({
                where: { merchantProfileId },
                data: {
                    balancePaise: { increment: debit.amountPaise },
                    totalRefundedPaise: { increment: debit.amountPaise },
                    totalSpentPaise: { decrement: debit.amountPaise },
                },
            });
            await tx.merchantAiWalletTransaction.create({
                data: {
                    merchantProfileId,
                    storeId,
                    analysisId,
                    type: client_1.MerchantAiWalletTransactionType.REFUND,
                    amountPaise: debit.amountPaise,
                    balanceBeforePaise: wallet.balancePaise,
                    balanceAfterPaise: updatedWallet.balancePaise,
                    status: client_1.MerchantAiWalletTransactionStatus.REFUNDED,
                    reason,
                    idempotencyKey: refundKey,
                },
            });
            await tx.merchantAiWalletTransaction.update({
                where: { id: debit.id },
                data: { status: client_1.MerchantAiWalletTransactionStatus.REFUNDED },
            });
        });
        if (analysisId) {
            await this.prisma.aIProductAnalysis.updateMany({
                where: { id: analysisId },
                data: { chargedAt: null },
            });
        }
        if (userId) {
            await this.audit.log({
                actorId: userId,
                action: 'AI_WALLET_REFUND',
                resourceType: 'merchant_ai_wallet_transaction',
                resourceId: debit.id,
                ipAddress: ip,
                metadata: { analysisId, reason, amountPaise: debit.amountPaise },
            });
        }
    }
    async adminAdjust(merchantProfileId, amountPaise, reason, adminUserId, ip) {
        if (amountPaise === 0)
            throw new common_1.BadRequestException('Adjustment amount cannot be zero');
        const idempotencyKey = `adjust:${merchantProfileId}:${Date.now()}:${amountPaise}`;
        const result = await this.prisma.$transaction(async (tx) => {
            const wallet = await tx.merchantAiWallet.upsert({
                where: { merchantProfileId },
                create: { merchantProfileId, balancePaise: Math.max(0, amountPaise) },
                update: amountPaise > 0
                    ? { balancePaise: { increment: amountPaise } }
                    : { balancePaise: { decrement: Math.abs(amountPaise) } },
            });
            if (wallet.balancePaise < 0) {
                throw new common_1.BadRequestException('Adjustment would result in negative balance');
            }
            const walletTx = await tx.merchantAiWalletTransaction.create({
                data: {
                    merchantProfileId,
                    type: client_1.MerchantAiWalletTransactionType.ADJUSTMENT,
                    amountPaise: Math.abs(amountPaise),
                    balanceBeforePaise: amountPaise > 0 ? wallet.balancePaise - amountPaise : wallet.balancePaise + Math.abs(amountPaise),
                    balanceAfterPaise: wallet.balancePaise,
                    status: client_1.MerchantAiWalletTransactionStatus.SUCCESS,
                    reason,
                    idempotencyKey,
                },
            });
            return { wallet, walletTx };
        });
        await this.audit.log({
            actorId: adminUserId,
            action: 'AI_WALLET_ADMIN_ADJUST',
            resourceType: 'merchant_ai_wallet',
            resourceId: merchantProfileId,
            ipAddress: ip,
            metadata: { amountPaise, reason },
        });
        return {
            balancePaise: result.wallet.balancePaise,
            transactionId: result.walletTx.id,
        };
    }
    async listWalletsForAdmin(page = 1, limit = 50) {
        const [items, total] = await Promise.all([
            this.prisma.merchantAiWallet.findMany({
                orderBy: { updatedAt: 'desc' },
                skip: (page - 1) * limit,
                take: limit,
                include: {
                    merchantProfile: {
                        select: {
                            id: true,
                            businessName: true,
                            user: { select: { email: true, phone: true } },
                        },
                    },
                },
            }),
            this.prisma.merchantAiWallet.count(),
        ]);
        return {
            items: items.map((w) => ({
                merchantProfileId: w.merchantProfileId,
                businessName: w.merchantProfile.businessName,
                email: w.merchantProfile.user?.email,
                phone: w.merchantProfile.user?.phone,
                balancePaise: w.balancePaise,
                totalRechargedPaise: w.totalRechargedPaise,
                totalSpentPaise: w.totalSpentPaise,
                totalRefundedPaise: w.totalRefundedPaise,
                updatedAt: w.updatedAt,
            })),
            meta: { page, limit, total, totalPages: Math.ceil(total / limit) },
        };
    }
    async getWalletForAdmin(merchantProfileId) {
        const wallet = await this.getOrCreateWallet(merchantProfileId);
        const transactions = await this.prisma.merchantAiWalletTransaction.findMany({
            where: { merchantProfileId },
            orderBy: { createdAt: 'desc' },
            take: 100,
        });
        const profile = await this.prisma.merchantProfile.findUnique({
            where: { id: merchantProfileId },
            select: { businessName: true, user: { select: { email: true, phone: true } } },
        });
        return {
            merchantProfileId,
            businessName: profile?.businessName,
            email: profile?.user?.email,
            phone: profile?.user?.phone,
            balancePaise: wallet.balancePaise,
            totalRechargedPaise: wallet.totalRechargedPaise,
            totalSpentPaise: wallet.totalSpentPaise,
            totalRefundedPaise: wallet.totalRefundedPaise,
            transactions,
        };
    }
    async getWalletStatsForAdmin() {
        const [rechargeAgg, debitAgg, refundAgg, outstanding] = await Promise.all([
            this.prisma.merchantAiWalletTransaction.aggregate({
                where: { type: client_1.MerchantAiWalletTransactionType.RECHARGE, status: client_1.MerchantAiWalletTransactionStatus.SUCCESS },
                _sum: { amountPaise: true },
                _count: true,
            }),
            this.prisma.merchantAiWalletTransaction.aggregate({
                where: { type: client_1.MerchantAiWalletTransactionType.DEBIT, status: client_1.MerchantAiWalletTransactionStatus.SUCCESS },
                _sum: { amountPaise: true },
                _count: true,
            }),
            this.prisma.merchantAiWalletTransaction.aggregate({
                where: { type: client_1.MerchantAiWalletTransactionType.REFUND, status: client_1.MerchantAiWalletTransactionStatus.REFUNDED },
                _sum: { amountPaise: true },
                _count: true,
            }),
            this.prisma.merchantAiWallet.aggregate({ _sum: { balancePaise: true }, _count: true }),
        ]);
        const topMerchants = await this.prisma.merchantAiWalletTransaction.groupBy({
            by: ['merchantProfileId'],
            where: { type: client_1.MerchantAiWalletTransactionType.DEBIT, status: client_1.MerchantAiWalletTransactionStatus.SUCCESS },
            _sum: { amountPaise: true },
            _count: true,
            orderBy: { _sum: { amountPaise: 'desc' } },
            take: 10,
        });
        return {
            totalRechargesPaise: rechargeAgg._sum.amountPaise ?? 0,
            totalRechargeCount: rechargeAgg._count,
            totalAiSpendPaise: debitAgg._sum.amountPaise ?? 0,
            totalDebitCount: debitAgg._count,
            totalRefundsPaise: refundAgg._sum.amountPaise ?? 0,
            totalRefundCount: refundAgg._count,
            outstandingBalancePaise: outstanding._sum.balancePaise ?? 0,
            merchantsWithBalance: outstanding._count,
            topMerchantsBySpend: topMerchants,
        };
    }
};
exports.MerchantAiWalletService = MerchantAiWalletService;
exports.MerchantAiWalletService = MerchantAiWalletService = MerchantAiWalletService_1 = __decorate([
    (0, common_1.Injectable)(),
    __metadata("design:paramtypes", [prisma_service_1.PrismaService,
        config_1.ConfigService,
        razorpay_service_1.RazorpayService,
        audit_service_1.AuditService])
], MerchantAiWalletService);
//# sourceMappingURL=merchant-ai-wallet.service.js.map