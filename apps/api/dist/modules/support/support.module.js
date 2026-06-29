"use strict";
var __decorate = (this && this.__decorate) || function (decorators, target, key, desc) {
    var c = arguments.length, r = c < 3 ? target : desc === null ? desc = Object.getOwnPropertyDescriptor(target, key) : desc, d;
    if (typeof Reflect === "object" && typeof Reflect.decorate === "function") r = Reflect.decorate(decorators, target, key, desc);
    else for (var i = decorators.length - 1; i >= 0; i--) if (d = decorators[i]) r = (c < 3 ? d(r) : c > 3 ? d(target, key, r) : d(target, key)) || r;
    return c > 3 && r && Object.defineProperty(target, key, r), r;
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.SupportModule = void 0;
const common_1 = require("@nestjs/common");
const support_sla_service_1 = require("./support-sla.service");
const ticket_assignment_service_1 = require("./ticket-assignment.service");
const support_ticket_service_1 = require("./support-ticket.service");
const support_automation_service_1 = require("./support-automation.service");
const knowledge_base_service_1 = require("./knowledge-base.service");
const customer_timeline_service_1 = require("./customer-timeline.service");
const support_analytics_service_1 = require("./support-analytics.service");
const membership_module_1 = require("../membership/membership.module");
const buyer_support_controller_1 = require("./buyer-support.controller");
const merchant_support_controller_1 = require("./merchant-support.controller");
const rider_support_controller_1 = require("./rider-support.controller");
const admin_support_controller_1 = require("./admin-support.controller");
let SupportModule = class SupportModule {
};
exports.SupportModule = SupportModule;
exports.SupportModule = SupportModule = __decorate([
    (0, common_1.Module)({
        imports: [membership_module_1.MembershipModule],
        controllers: [
            buyer_support_controller_1.BuyerSupportController,
            merchant_support_controller_1.MerchantSupportController,
            rider_support_controller_1.RiderSupportController,
            admin_support_controller_1.AdminSupportController,
        ],
        providers: [
            support_sla_service_1.SupportSlaService,
            ticket_assignment_service_1.TicketAssignmentService,
            support_ticket_service_1.SupportTicketService,
            support_automation_service_1.SupportAutomationService,
            knowledge_base_service_1.KnowledgeBaseService,
            customer_timeline_service_1.CustomerTimelineService,
            support_analytics_service_1.SupportAnalyticsService,
        ],
        exports: [support_ticket_service_1.SupportTicketService, support_analytics_service_1.SupportAnalyticsService, knowledge_base_service_1.KnowledgeBaseService, customer_timeline_service_1.CustomerTimelineService],
    })
], SupportModule);
//# sourceMappingURL=support.module.js.map