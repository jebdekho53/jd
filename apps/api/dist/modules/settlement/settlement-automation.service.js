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
var SettlementAutomationService_1;
Object.defineProperty(exports, "__esModule", { value: true });
exports.SettlementAutomationService = void 0;
const common_1 = require("@nestjs/common");
const schedule_1 = require("@nestjs/schedule");
const distributed_lock_service_1 = require("../../redis/distributed-lock.service");
const settlement_service_1 = require("./settlement.service");
let SettlementAutomationService = SettlementAutomationService_1 = class SettlementAutomationService {
    constructor(settlement, lock) {
        this.settlement = settlement;
        this.lock = lock;
        this.logger = new common_1.Logger(SettlementAutomationService_1.name);
    }
    async settleEligibleLedgers() {
        await this.lock.runExclusive('cron:settlement-eligible', 3000, async () => {
            const count = await this.settlement.processEligibleSettlements();
            if (count > 0) {
                this.logger.log(`Settled ${count} eligible ledger entries`);
            }
        });
    }
};
exports.SettlementAutomationService = SettlementAutomationService;
__decorate([
    (0, schedule_1.Cron)(schedule_1.CronExpression.EVERY_HOUR),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", []),
    __metadata("design:returntype", Promise)
], SettlementAutomationService.prototype, "settleEligibleLedgers", null);
exports.SettlementAutomationService = SettlementAutomationService = SettlementAutomationService_1 = __decorate([
    (0, common_1.Injectable)(),
    __metadata("design:paramtypes", [settlement_service_1.SettlementService,
        distributed_lock_service_1.DistributedLockService])
], SettlementAutomationService);
//# sourceMappingURL=settlement-automation.service.js.map