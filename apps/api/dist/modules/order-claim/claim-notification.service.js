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
var ClaimNotificationService_1;
Object.defineProperty(exports, "__esModule", { value: true });
exports.ClaimNotificationService = exports.CLAIM_EVENTS = void 0;
const common_1 = require("@nestjs/common");
const event_emitter_1 = require("@nestjs/event-emitter");
const client_1 = require("@prisma/client");
exports.CLAIM_EVENTS = {
    SUBMITTED: 'claim.submitted',
    APPROVED: 'claim.approved',
    REJECTED: 'claim.rejected',
    REFUND_PROCESSED: 'claim.refund_processed',
    REPLACEMENT_SHIPPED: 'claim.replacement_shipped',
    MERCHANT_REMINDER: 'claim.merchant_reminder',
    ADMIN_ESCALATED: 'claim.admin_escalated',
};
let ClaimNotificationService = ClaimNotificationService_1 = class ClaimNotificationService {
    constructor(events) {
        this.events = events;
        this.logger = new common_1.Logger(ClaimNotificationService_1.name);
    }
    notifyClaimSubmitted(payload) {
        this.events.emit(exports.CLAIM_EVENTS.SUBMITTED, payload);
        this.logger.log({ claimId: payload.claimId }, 'Claim submitted notification');
    }
    notifyClaimStatus(payload) {
        if (payload.status === client_1.OrderClaimStatus.APPROVED) {
            this.events.emit(exports.CLAIM_EVENTS.APPROVED, payload);
        }
        else if (payload.status === client_1.OrderClaimStatus.REJECTED) {
            this.events.emit(exports.CLAIM_EVENTS.REJECTED, payload);
        }
        else if (payload.status === client_1.OrderClaimStatus.REFUND_PROCESSED) {
            this.events.emit(exports.CLAIM_EVENTS.REFUND_PROCESSED, payload);
        }
        else if (payload.status === client_1.OrderClaimStatus.REPLACEMENT_SHIPPED) {
            this.events.emit(exports.CLAIM_EVENTS.REPLACEMENT_SHIPPED, payload);
        }
    }
    notifyMerchantReminder(payload) {
        this.events.emit(exports.CLAIM_EVENTS.MERCHANT_REMINDER, payload);
    }
    notifyAdminEscalation(payload) {
        this.events.emit(exports.CLAIM_EVENTS.ADMIN_ESCALATED, payload);
    }
};
exports.ClaimNotificationService = ClaimNotificationService;
exports.ClaimNotificationService = ClaimNotificationService = ClaimNotificationService_1 = __decorate([
    (0, common_1.Injectable)(),
    __metadata("design:paramtypes", [event_emitter_1.EventEmitter2])
], ClaimNotificationService);
//# sourceMappingURL=claim-notification.service.js.map