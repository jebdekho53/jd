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
var RefundRetryScheduler_1;
Object.defineProperty(exports, "__esModule", { value: true });
exports.RefundRetryScheduler = void 0;
const common_1 = require("@nestjs/common");
const schedule_1 = require("@nestjs/schedule");
const distributed_lock_service_1 = require("../../redis/distributed-lock.service");
const order_refund_service_1 = require("./order-refund.service");
let RefundRetryScheduler = RefundRetryScheduler_1 = class RefundRetryScheduler {
    constructor(refunds, lock) {
        this.refunds = refunds;
        this.lock = lock;
        this.logger = new common_1.Logger(RefundRetryScheduler_1.name);
    }
    async retryFailedRefunds() {
        await this.lock.runExclusive('cron:refund-retry', 240, async () => {
            const count = await this.refunds.retryFailedRefunds();
            if (count > 0) {
                this.logger.log(`Retried ${count} failed order refunds`);
            }
        });
    }
};
exports.RefundRetryScheduler = RefundRetryScheduler;
__decorate([
    (0, schedule_1.Cron)(schedule_1.CronExpression.EVERY_5_MINUTES),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", []),
    __metadata("design:returntype", Promise)
], RefundRetryScheduler.prototype, "retryFailedRefunds", null);
exports.RefundRetryScheduler = RefundRetryScheduler = RefundRetryScheduler_1 = __decorate([
    (0, common_1.Injectable)(),
    __metadata("design:paramtypes", [order_refund_service_1.OrderRefundService,
        distributed_lock_service_1.DistributedLockService])
], RefundRetryScheduler);
//# sourceMappingURL=refund-retry.scheduler.js.map