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
exports.GstCalculatorService = void 0;
const common_1 = require("@nestjs/common");
const client_1 = require("@prisma/client");
const prisma_service_1 = require("../../database/prisma.service");
let GstCalculatorService = class GstCalculatorService {
    constructor(prisma) {
        this.prisma = prisma;
    }
    slabToPercent(slab) {
        const map = {
            ZERO: 0,
            FIVE: 5,
            TWELVE: 12,
            EIGHTEEN: 18,
            TWENTY_EIGHT: 28,
        };
        return map[slab];
    }
    percentToSlab(percent) {
        if (percent <= 0)
            return client_1.GstSlab.ZERO;
        if (percent <= 5)
            return client_1.GstSlab.FIVE;
        if (percent <= 12)
            return client_1.GstSlab.TWELVE;
        if (percent <= 18)
            return client_1.GstSlab.EIGHTEEN;
        return client_1.GstSlab.TWENTY_EIGHT;
    }
    resolveSupplyType(supplierState, buyerState) {
        if (!buyerState || supplierState === buyerState) {
            return client_1.GstSupplyType.INTRA_STATE;
        }
        return client_1.GstSupplyType.INTER_STATE;
    }
    async getRatesForSlab(slab) {
        const rate = await this.prisma.taxRate.findUnique({ where: { slab } });
        if (!rate) {
            const pct = this.slabToPercent(slab);
            const half = pct / 2;
            return { cgstRate: half, sgstRate: half, igstRate: pct, totalRate: pct };
        }
        return {
            cgstRate: Number(rate.cgstRate),
            sgstRate: Number(rate.sgstRate),
            igstRate: Number(rate.igstRate),
            totalRate: Number(rate.totalRate),
        };
    }
    computeLine(input, supplyType, rates) {
        const gross = input.quantity * input.unitPrice - (input.discount ?? 0);
        const totalRate = supplyType === client_1.GstSupplyType.INTRA_STATE
            ? rates.cgstRate + rates.sgstRate
            : rates.igstRate;
        let taxableAmount;
        let lineTotal;
        if (input.taxInclusive && totalRate > 0) {
            taxableAmount = gross / (1 + totalRate / 100);
            lineTotal = gross;
        }
        else {
            taxableAmount = gross;
            lineTotal = gross + taxableAmount * (totalRate / 100);
        }
        taxableAmount = round2(taxableAmount);
        lineTotal = round2(lineTotal);
        let cgstAmount = 0;
        let sgstAmount = 0;
        let igstAmount = 0;
        if (supplyType === client_1.GstSupplyType.INTRA_STATE) {
            cgstAmount = round2(taxableAmount * (rates.cgstRate / 100));
            sgstAmount = round2(taxableAmount * (rates.sgstRate / 100));
        }
        else {
            igstAmount = round2(taxableAmount * (rates.igstRate / 100));
        }
        return {
            taxableAmount,
            cgstRate: rates.cgstRate,
            sgstRate: rates.sgstRate,
            igstRate: rates.igstRate,
            cgstAmount,
            sgstAmount,
            igstAmount,
            lineTotal,
        };
    }
    sumLines(lines) {
        const taxableAmount = round2(lines.reduce((s, l) => s + l.taxableAmount, 0));
        const cgstAmount = round2(lines.reduce((s, l) => s + l.cgstAmount, 0));
        const sgstAmount = round2(lines.reduce((s, l) => s + l.sgstAmount, 0));
        const igstAmount = round2(lines.reduce((s, l) => s + l.igstAmount, 0));
        const totalTax = round2(cgstAmount + sgstAmount + igstAmount);
        const grandTotal = round2(lines.reduce((s, l) => s + l.lineTotal, 0));
        return { taxableAmount, cgstAmount, sgstAmount, igstAmount, totalTax, grandTotal };
    }
};
exports.GstCalculatorService = GstCalculatorService;
exports.GstCalculatorService = GstCalculatorService = __decorate([
    (0, common_1.Injectable)(),
    __metadata("design:paramtypes", [prisma_service_1.PrismaService])
], GstCalculatorService);
function round2(n) {
    return Math.round(n * 100) / 100;
}
//# sourceMappingURL=gst-calculator.service.js.map