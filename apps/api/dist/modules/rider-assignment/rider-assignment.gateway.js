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
var __param = (this && this.__param) || function (paramIndex, decorator) {
    return function (target, key) { decorator(target, key, paramIndex); }
};
var RiderAssignmentGateway_1;
Object.defineProperty(exports, "__esModule", { value: true });
exports.RiderAssignmentGateway = void 0;
const common_1 = require("@nestjs/common");
const event_emitter_1 = require("@nestjs/event-emitter");
const websockets_1 = require("@nestjs/websockets");
const socket_io_1 = require("socket.io");
const rider_assignment_service_1 = require("./rider-assignment.service");
const ws_cors_util_1 = require("../../common/websocket/ws-cors.util");
let RiderAssignmentGateway = RiderAssignmentGateway_1 = class RiderAssignmentGateway {
    constructor() {
        this.logger = new common_1.Logger(RiderAssignmentGateway_1.name);
    }
    onAssigned(payload) {
        this.broadcast(rider_assignment_service_1.RIDER_ASSIGNMENT_EVENTS.ASSIGNED, payload);
    }
    onReassigned(payload) {
        this.broadcast(rider_assignment_service_1.RIDER_ASSIGNMENT_EVENTS.REASSIGNED, payload);
    }
    onUnassigned(payload) {
        this.broadcast(rider_assignment_service_1.RIDER_ASSIGNMENT_EVENTS.UNASSIGNED, payload);
    }
    onLocationUpdated(payload) {
        this.broadcast(rider_assignment_service_1.RIDER_ASSIGNMENT_EVENTS.LOCATION_UPDATED, payload);
    }
    handleSubscribe(client, data) {
        const room = `${data.role}:${data.id}`;
        client.join(room);
        this.logger.debug(`Client ${client.id} joined ${room}`);
        return { subscribed: room };
    }
    broadcast(event, payload) {
        this.server?.emit(event, { event, ...payload, at: new Date().toISOString() });
    }
};
exports.RiderAssignmentGateway = RiderAssignmentGateway;
__decorate([
    (0, websockets_1.WebSocketServer)(),
    __metadata("design:type", socket_io_1.Server)
], RiderAssignmentGateway.prototype, "server", void 0);
__decorate([
    (0, event_emitter_1.OnEvent)(`ws.${rider_assignment_service_1.RIDER_ASSIGNMENT_EVENTS.ASSIGNED}`),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [Object]),
    __metadata("design:returntype", void 0)
], RiderAssignmentGateway.prototype, "onAssigned", null);
__decorate([
    (0, event_emitter_1.OnEvent)(`ws.${rider_assignment_service_1.RIDER_ASSIGNMENT_EVENTS.REASSIGNED}`),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [Object]),
    __metadata("design:returntype", void 0)
], RiderAssignmentGateway.prototype, "onReassigned", null);
__decorate([
    (0, event_emitter_1.OnEvent)(`ws.${rider_assignment_service_1.RIDER_ASSIGNMENT_EVENTS.UNASSIGNED}`),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [Object]),
    __metadata("design:returntype", void 0)
], RiderAssignmentGateway.prototype, "onUnassigned", null);
__decorate([
    (0, event_emitter_1.OnEvent)(`ws.${rider_assignment_service_1.RIDER_ASSIGNMENT_EVENTS.LOCATION_UPDATED}`),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [Object]),
    __metadata("design:returntype", void 0)
], RiderAssignmentGateway.prototype, "onLocationUpdated", null);
__decorate([
    (0, websockets_1.SubscribeMessage)('subscribe'),
    __param(0, (0, websockets_1.ConnectedSocket)()),
    __param(1, (0, websockets_1.MessageBody)()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [socket_io_1.Socket, Object]),
    __metadata("design:returntype", void 0)
], RiderAssignmentGateway.prototype, "handleSubscribe", null);
exports.RiderAssignmentGateway = RiderAssignmentGateway = RiderAssignmentGateway_1 = __decorate([
    (0, websockets_1.WebSocketGateway)({
        cors: (0, ws_cors_util_1.wsGatewayCorsOptions)(),
        namespace: '/rider-assignment',
    })
], RiderAssignmentGateway);
//# sourceMappingURL=rider-assignment.gateway.js.map