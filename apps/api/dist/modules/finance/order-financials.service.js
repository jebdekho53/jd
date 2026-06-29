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
var OrderFinancialsService_1;
Object.defineProperty(exports, "__esModule", { value: true });
exports.OrderFinancialsService = void 0;
const common_1 = require("@nestjs/common");
const client_1 = require("@prisma/client");
const prisma_service_1 = require("../../database/prisma.service");
const finance_commission_service_1 = require("./finance-commission.service");
const ledger_service_1 = require("./ledger.service");
const settlement_utils_1 = require("../settlement/settlement.utils");
const DEFAULT_GST_RATE = 5;
const RIDER_BASE_FEE = 25;
const RIDER_PER_KM = 8;
let OrderFinancialsService = OrderFinancialsService_1 = class OrderFinancialsService {
    constructor(prisma, commission, ledger) {
        this.prisma = prisma;
        this.commission = commission;
        this.ledger = ledger;
        this.logger = new common_1.Logger(OrderFinancialsService_1.name);
    }
    async freezeOnOrderCreate(input) {
        const existing = await this.prisma.orderFinancialSnapshot.findUnique({
            where: { orderId: input.orderId },
        });
        if (existing)
            return;
        const store = await this.prisma.store.findUnique({
            where: { id: input.storeId },
            select: {
                id: true,
                name: true,
                slug: true,
                deliveryFee: true,
                minOrderAmount: true,
                cityId: true,
            },
        });
        if (!store)
            return;
        const resolution = await this.commission.resolveForOrder(input.storeId, input.orderId);
        const gross = input.subtotal;
        const commissionAmount = (0, settlement_utils_1.roundMoney)((gross * resolution.commissionPercent) / 100);
        const netMerchant = (0, settlement_utils_1.roundMoney)(gross - commissionAmount);
        const taxAmount = input.taxAmount ?? (0, settlement_utils_1.roundMoney)((gross * DEFAULT_GST_RATE) / 100);
        const deliveryFee = input.deliveryFee;
        const platformEarnings = (0, settlement_utils_1.roundMoney)(commissionAmount + deliveryFee);
        const riderPayout = this.estimateRiderPayout(deliveryFee);
        const offerSubsidy = input.offerSubsidy ?? input.discountAmount * 0.5;
        const merchantContribution = input.merchantContribution ?? offerSubsidy * 0.6;
        const platformContribution = input.platformContribution ?? offerSubsidy - merchantContribution;
        await this.prisma.$transaction(async (tx) => {
            await tx.orderFinancialSnapshot.create({
                data: {
                    orderId: input.orderId,
                    subtotal: gross,
                    discountAmount: input.discountAmount,
                    offerSubsidy,
                    merchantContribution,
                    platformContribution,
                    deliveryFee,
                    taxAmount,
                    commissionPercent: resolution.commissionPercent,
                    commissionAmount,
                    netMerchantEarnings: netMerchant,
                    netPlatformEarnings: platformEarnings,
                    riderPayoutAmount: riderPayout,
                    commissionRuleId: resolution.commissionRuleId,
                    storeSnapshot: store,
                },
            });
            await tx.taxRecord.create({
                data: {
                    orderId: input.orderId,
                    taxType: 'GST',
                    taxableAmount: gross,
                    taxAmount,
                    gstRate: DEFAULT_GST_RATE,
                    periodMonth: new Date().toISOString().slice(0, 7),
                },
            });
        });
        const isCod = input.paymentMethod === client_1.PaymentMethod.COD ||
            input.paymentMethod === client_1.PaymentMethod.WALLET_COD;
        const deferOnlineLedger = input.paymentMethod === client_1.PaymentMethod.RAZORPAY ||
            input.paymentMethod === client_1.PaymentMethod.WALLET_RAZORPAY;
        const paidAmount = gross + deliveryFee - input.discountAmount + taxAmount;
        if (!deferOnlineLedger) {
            void this.ledger.recordOrderPayment(input.orderId, paidAmount, isCod).catch((err) => {
                this.logger.warn(`Ledger order payment failed: ${err.message}`);
            });
        }
        void this.ledger.recordTaxAccrual(input.orderId, taxAmount, gross).catch(() => { });
        this.logger.debug({ orderId: input.orderId, commission: resolution }, 'Order financials frozen');
    }
    async recordOnlinePaymentConfirmed(orderId) {
        const order = await this.prisma.order.findUnique({
            where: { id: orderId },
            select: {
                paymentMethod: true,
                paymentStatus: true,
                totalAmount: true,
                deliveryFee: true,
                discountAmount: true,
                taxAmount: true,
            },
        });
        if (!order || order.paymentStatus !== client_1.PaymentStatus.PAID)
            return;
        const method = order.paymentMethod;
        if (method !== client_1.PaymentMethod.RAZORPAY && method !== client_1.PaymentMethod.WALLET_RAZORPAY)
            return;
        const snap = await this.prisma.orderFinancialSnapshot.findUnique({ where: { orderId } });
        const gross = snap ? (0, settlement_utils_1.decimalToNumber)(snap.subtotal) : (0, settlement_utils_1.decimalToNumber)(order.totalAmount);
        const deliveryFee = snap ? (0, settlement_utils_1.decimalToNumber)(snap.deliveryFee) : (0, settlement_utils_1.decimalToNumber)(order.deliveryFee);
        const discount = snap ? (0, settlement_utils_1.decimalToNumber)(snap.discountAmount) : (0, settlement_utils_1.decimalToNumber)(order.discountAmount);
        const tax = snap ? (0, settlement_utils_1.decimalToNumber)(snap.taxAmount) : (0, settlement_utils_1.decimalToNumber)(order.taxAmount);
        const paidAmount = gross + deliveryFee - discount + tax;
        await this.ledger.recordOrderPayment(orderId, paidAmount, false);
    }
    async getOrderFinancials(orderId) {
        const snap = await this.prisma.orderFinancialSnapshot.findUnique({ where: { orderId } });
        if (!snap)
            return null;
        return this.formatFinancials(snap);
    }
    async getOrderFinancialsForMerchant(orderId, merchantUserId) {
        const owned = await this.prisma.order.findFirst({
            where: {
                id: orderId,
                store: { merchantProfile: { userId: merchantUserId } },
            },
            select: { id: true },
        });
        if (!owned)
            return null;
        const snap = await this.prisma.orderFinancialSnapshot.findUnique({ where: { orderId } });
        if (!snap)
            return null;
        return this.formatFinancials(snap);
    }
    formatFinancials(snap) {
        return {
            orderId: snap.orderId,
            subtotal: (0, settlement_utils_1.decimalToNumber)(snap.subtotal),
            discountAmount: (0, settlement_utils_1.decimalToNumber)(snap.discountAmount),
            offerSubsidy: (0, settlement_utils_1.decimalToNumber)(snap.offerSubsidy),
            merchantContribution: (0, settlement_utils_1.decimalToNumber)(snap.merchantContribution),
            platformContribution: (0, settlement_utils_1.decimalToNumber)(snap.platformContribution),
            deliveryFee: (0, settlement_utils_1.decimalToNumber)(snap.deliveryFee),
            taxAmount: (0, settlement_utils_1.decimalToNumber)(snap.taxAmount),
            commissionPercent: (0, settlement_utils_1.decimalToNumber)(snap.commissionPercent),
            commissionAmount: (0, settlement_utils_1.decimalToNumber)(snap.commissionAmount),
            netMerchantEarnings: (0, settlement_utils_1.decimalToNumber)(snap.netMerchantEarnings),
            netPlatformEarnings: (0, settlement_utils_1.decimalToNumber)(snap.netPlatformEarnings),
            riderPayoutAmount: (0, settlement_utils_1.decimalToNumber)(snap.riderPayoutAmount),
            frozenAt: snap.frozenAt.toISOString(),
            storeSnapshot: snap.storeSnapshot,
        };
    }
    estimateRiderPayout(deliveryFee) {
        return (0, settlement_utils_1.roundMoney)(Math.min(deliveryFee * 0.7, RIDER_BASE_FEE + RIDER_PER_KM * 2));
    }
};
exports.OrderFinancialsService = OrderFinancialsService;
exports.OrderFinancialsService = OrderFinancialsService = OrderFinancialsService_1 = __decorate([
    (0, common_1.Injectable)(),
    __metadata("design:paramtypes", [prisma_service_1.PrismaService,
        finance_commission_service_1.FinanceCommissionService,
        ledger_service_1.LedgerService])
], OrderFinancialsService);
//# sourceMappingURL=order-financials.service.js.map