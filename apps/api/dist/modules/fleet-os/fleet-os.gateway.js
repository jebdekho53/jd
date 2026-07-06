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
var FleetOsGateway_1;
var _a, _b;
Object.defineProperty(exports, "__esModule", { value: true });
exports.FleetOsGateway = void 0;
const common_1 = require("@nestjs/common");
const event_emitter_1 = require("@nestjs/event-emitter");
const websockets_1 = require("@nestjs/websockets");
const socket_io_1 = require("socket.io");
const fleet_os_events_1 = require("./fleet-os.events");
const ws_cors_util_1 = require("../../common/websocket/ws-cors.util");
let FleetOsGateway = FleetOsGateway_1 = class FleetOsGateway {
    constructor() {
        this.logger = new common_1.Logger(FleetOsGateway_1.name);
    }
    handleSubscribe(client, data) {
        client.join(fleet_os_events_1.FLEET_ROOM);
        if (data?.role && data?.id) {
            client.join(`${data.role}:${data.id}`);
        }
        this.logger.debug(`Fleet client ${client.id} joined ${fleet_os_events_1.FLEET_ROOM}`);
        return { subscribed: fleet_os_events_1.FLEET_ROOM };
    }
    onClusterUpdated(payload) {
        this.emit(fleet_os_events_1.FLEET_EVENTS.CLUSTER_UPDATED, payload);
    }
    onBatchCreated(payload) {
        this.emit(fleet_os_events_1.FLEET_EVENTS.BATCH_CREATED, payload);
    }
    onBatchUpdated(payload) {
        this.emit(fleet_os_events_1.FLEET_EVENTS.BATCH_UPDATED, payload);
    }
    onAlertCreated(payload) {
        this.emit(fleet_os_events_1.FLEET_EVENTS.ALERT_CREATED, payload);
    }
    onRouteOptimized(payload) {
        this.emit(fleet_os_events_1.FLEET_EVENTS.ROUTE_OPTIMIZED, payload);
    }
    emit(event, payload) {
        this.server?.to(fleet_os_events_1.FLEET_ROOM).emit(event, { event, ...payload, at: new Date().toISOString() });
    }
};
exports.FleetOsGateway = FleetOsGateway;
__decorate([
    (0, websockets_1.WebSocketServer)(),
    __metadata("design:type", typeof (_a = typeof socket_io_1.Server !== "undefined" && socket_io_1.Server) === "function" ? _a : Object)
], FleetOsGateway.prototype, "server", void 0);
__decorate([
    (0, websockets_1.SubscribeMessage)('subscribe'),
    __param(0, (0, websockets_1.ConnectedSocket)()),
    __param(1, (0, websockets_1.MessageBody)()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [typeof (_b = typeof socket_io_1.Socket !== "undefined" && socket_io_1.Socket) === "function" ? _b : Object, Object]),
    __metadata("design:returntype", void 0)
], FleetOsGateway.prototype, "handleSubscribe", null);
__decorate([
    (0, event_emitter_1.OnEvent)(`ws.${fleet_os_events_1.FLEET_EVENTS.CLUSTER_UPDATED}`),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [Object]),
    __metadata("design:returntype", void 0)
], FleetOsGateway.prototype, "onClusterUpdated", null);
__decorate([
    (0, event_emitter_1.OnEvent)(`ws.${fleet_os_events_1.FLEET_EVENTS.BATCH_CREATED}`),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [Object]),
    __metadata("design:returntype", void 0)
], FleetOsGateway.prototype, "onBatchCreated", null);
__decorate([
    (0, event_emitter_1.OnEvent)(`ws.${fleet_os_events_1.FLEET_EVENTS.BATCH_UPDATED}`),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [Object]),
    __metadata("design:returntype", void 0)
], FleetOsGateway.prototype, "onBatchUpdated", null);
__decorate([
    (0, event_emitter_1.OnEvent)(`ws.${fleet_os_events_1.FLEET_EVENTS.ALERT_CREATED}`),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [Object]),
    __metadata("design:returntype", void 0)
], FleetOsGateway.prototype, "onAlertCreated", null);
__decorate([
    (0, event_emitter_1.OnEvent)(`ws.${fleet_os_events_1.FLEET_EVENTS.ROUTE_OPTIMIZED}`),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [Object]),
    __metadata("design:returntype", void 0)
], FleetOsGateway.prototype, "onRouteOptimized", null);
exports.FleetOsGateway = FleetOsGateway = FleetOsGateway_1 = __decorate([
    (0, websockets_1.WebSocketGateway)({ cors: (0, ws_cors_util_1.wsGatewayCorsOptions)(), namespace: '/fleet' })
], FleetOsGateway);
//# sourceMappingURL=fleet-os.gateway.js.map