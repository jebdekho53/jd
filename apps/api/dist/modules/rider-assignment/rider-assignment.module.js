"use strict";
var __decorate = (this && this.__decorate) || function (decorators, target, key, desc) {
    var c = arguments.length, r = c < 3 ? target : desc === null ? desc = Object.getOwnPropertyDescriptor(target, key) : desc, d;
    if (typeof Reflect === "object" && typeof Reflect.decorate === "function") r = Reflect.decorate(decorators, target, key, desc);
    else for (var i = decorators.length - 1; i >= 0; i--) if (d = decorators[i]) r = (c < 3 ? d(r) : c > 3 ? d(target, key, r) : d(target, key)) || r;
    return c > 3 && r && Object.defineProperty(target, key, r), r;
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.RiderAssignmentModule = void 0;
const common_1 = require("@nestjs/common");
const order_timeline_module_1 = require("../order/order-timeline.module");
const audit_module_1 = require("../audit/audit.module");
const domain_events_module_1 = require("../domain-events/domain-events.module");
const rider_assignment_service_1 = require("./rider-assignment.service");
const rider_assignment_controller_1 = require("./rider-assignment.controller");
const rider_assignment_gateway_1 = require("./rider-assignment.gateway");
const rider_assignment_scheduler_1 = require("./rider-assignment.scheduler");
const rider_assignment_cache_service_1 = require("./rider-assignment-cache.service");
const push_module_1 = require("../push/push.module");
let RiderAssignmentModule = class RiderAssignmentModule {
};
exports.RiderAssignmentModule = RiderAssignmentModule;
exports.RiderAssignmentModule = RiderAssignmentModule = __decorate([
    (0, common_1.Module)({
        imports: [order_timeline_module_1.OrderTimelineModule, audit_module_1.AuditModule, domain_events_module_1.DomainEventsModule, push_module_1.PushModule],
        controllers: [rider_assignment_controller_1.RiderAssignmentController],
        providers: [
            rider_assignment_service_1.RiderAssignmentService,
            rider_assignment_gateway_1.RiderAssignmentGateway,
            rider_assignment_scheduler_1.RiderAssignmentScheduler,
            rider_assignment_cache_service_1.RiderAssignmentCacheService,
        ],
        exports: [rider_assignment_service_1.RiderAssignmentService, rider_assignment_cache_service_1.RiderAssignmentCacheService],
    })
], RiderAssignmentModule);
//# sourceMappingURL=rider-assignment.module.js.map