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
var DeliveryDispatchService_1;
Object.defineProperty(exports, "__esModule", { value: true });
exports.DeliveryDispatchService = void 0;
const common_1 = require("@nestjs/common");
const config_1 = require("@nestjs/config");
const client_1 = require("@prisma/client");
const prisma_service_1 = require("../../database/prisma.service");
const rider_assignment_service_1 = require("../rider-assignment/rider-assignment.service");
const delivery_orchestrator_service_1 = require("./delivery-orchestrator.service");
const logistics_config_util_1 = require("./utils/logistics-config.util");
let DeliveryDispatchService = DeliveryDispatchService_1 = class DeliveryDispatchService {
    constructor(config, prisma, riderAssignment, orchestrator) {
        this.config = config;
        this.prisma = prisma;
        this.riderAssignment = riderAssignment;
        this.orchestrator = orchestrator;
        this.logger = new common_1.Logger(DeliveryDispatchService_1.name);
    }
    async dispatchAfterOrderPlaced(orderId) {
        const order = await this.prisma.order.findUnique({
            where: { id: orderId },
            select: { orderVertical: true },
        });
        if (order?.orderVertical === client_1.OrderVertical.FOOD) {
            return null;
        }
        return null;
    }
    async dispatchAfterReadyForPickup(orderId) {
        if ((0, logistics_config_util_1.useOwnFleetDispatch)(this.config)) {
            const result = await this.riderAssignment.autoAssign(orderId);
            if (!result)
                return null;
            return {
                mode: 'own_fleet',
                deliveryId: result.deliveryId,
                riderProfileId: result.riderProfileId,
            };
        }
        return this.dispatchViaProvider(orderId, 'ready for pickup');
    }
    async dispatchViaProvider(orderId, trigger) {
        try {
            const result = await this.orchestrator.dispatchShipment(orderId);
            this.logger.log({
                orderId,
                trigger,
                deliveryId: result.deliveryId,
                shipmentId: result.shipmentId,
                trackingNumber: result.trackingNumber,
            }, 'Provider shipment dispatched');
            return {
                mode: 'provider',
                deliveryId: result.deliveryId,
                shipmentId: result.shipmentId,
                trackingNumber: result.trackingNumber,
                estimatedEtaMins: result.estimatedEtaMins,
            };
        }
        catch (err) {
            this.logger.error({ orderId, trigger, err }, 'Provider dispatch failed');
            return null;
        }
    }
};
exports.DeliveryDispatchService = DeliveryDispatchService;
exports.DeliveryDispatchService = DeliveryDispatchService = DeliveryDispatchService_1 = __decorate([
    (0, common_1.Injectable)(),
    __metadata("design:paramtypes", [config_1.ConfigService,
        prisma_service_1.PrismaService,
        rider_assignment_service_1.RiderAssignmentService,
        delivery_orchestrator_service_1.DeliveryOrchestratorService])
], DeliveryDispatchService);
//# sourceMappingURL=delivery-dispatch.service.js.map