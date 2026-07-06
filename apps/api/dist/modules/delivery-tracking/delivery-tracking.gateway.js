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
var DeliveryTrackingGateway_1;
var _a;
Object.defineProperty(exports, "__esModule", { value: true });
exports.DeliveryTrackingGateway = void 0;
const common_1 = require("@nestjs/common");
const event_emitter_1 = require("@nestjs/event-emitter");
const websockets_1 = require("@nestjs/websockets");
const socket_io_1 = require("socket.io");
const ws_auth_service_1 = require("../../common/websocket/ws-auth.service");
const ws_cors_util_1 = require("../../common/websocket/ws-cors.util");
const delivery_tracking_service_1 = require("./delivery-tracking.service");
const delivery_tracking_events_1 = require("./delivery-tracking.events");
let DeliveryTrackingGateway = DeliveryTrackingGateway_1 = class DeliveryTrackingGateway {
    constructor(wsAuth, tracking) {
        this.wsAuth = wsAuth;
        this.tracking = tracking;
        this.logger = new common_1.Logger(DeliveryTrackingGateway_1.name);
    }
    handleConnection(client) {
        const user = this.wsAuth.authenticateSocket(client);
        if (!user) {
            this.logger.warn(`Rejected unauthenticated tracking socket ${client.id}`);
            client.disconnect(true);
            return;
        }
        client.data.user = user;
    }
    async handleSubscribe(client, data) {
        const user = client.data.user;
        if (!user) {
            return { error: 'Unauthorized' };
        }
        if (!data?.namespace || !data?.id) {
            return { error: 'Invalid subscription payload' };
        }
        try {
            await this.tracking.assertSubscribeAccess(user, data);
        }
        catch (err) {
            const message = err instanceof common_1.ForbiddenException ? err.message : 'Access denied';
            this.logger.warn(`Tracking subscribe denied for user ${user.id} namespace=${data.namespace}`);
            return { error: message };
        }
        const room = (0, delivery_tracking_events_1.trackingRoom)(data.namespace, data.id);
        client.join(room);
        if (data.orderId) {
            client.join((0, delivery_tracking_events_1.orderRoom)(data.orderId));
        }
        this.logger.debug(`Client ${client.id} joined ${room}${data.orderId ? ` + ${(0, delivery_tracking_events_1.orderRoom)(data.orderId)}` : ''}`);
        return { subscribed: room, orderId: data.orderId ?? null };
    }
    onLocationUpdated(payload) {
        this.emitToOrder(payload.orderId, delivery_tracking_events_1.TRACKING_EVENTS.LOCATION_UPDATED, payload);
        this.emitToOrder(payload.orderId, delivery_tracking_events_1.TRACKING_EVENTS.ORDER_LOCATION_UPDATED, payload);
    }
    onEtaUpdated(payload) {
        this.emitToOrder(payload.orderId, delivery_tracking_events_1.TRACKING_EVENTS.ETA_UPDATED, payload);
    }
    onStarted(payload) {
        this.emitToOrder(payload.orderId, delivery_tracking_events_1.TRACKING_EVENTS.STARTED, payload);
    }
    onArrived(payload) {
        this.emitToOrder(payload.orderId, delivery_tracking_events_1.TRACKING_EVENTS.ARRIVED, payload);
    }
    onCompleted(payload) {
        this.emitToOrder(payload.orderId, delivery_tracking_events_1.TRACKING_EVENTS.COMPLETED, payload);
        this.server?.to((0, delivery_tracking_events_1.trackingRoom)('admin', 'fleet')).emit(delivery_tracking_events_1.TRACKING_EVENTS.COMPLETED, {
            event: delivery_tracking_events_1.TRACKING_EVENTS.COMPLETED,
            ...payload,
            at: new Date().toISOString(),
        });
    }
    onOrderStatus(payload) {
        this.emitToOrder(payload.orderId, delivery_tracking_events_1.TRACKING_EVENTS.ORDER_STATUS, payload);
    }
    onFleetSnapshot(payload) {
        this.server?.to((0, delivery_tracking_events_1.trackingRoom)('admin', 'fleet')).emit('fleet.updated', {
            event: 'fleet.updated',
            ...payload,
            at: new Date().toISOString(),
        });
    }
    emitToOrder(orderId, event, payload) {
        if (!orderId)
            return;
        const envelope = { event, ...payload, at: new Date().toISOString() };
        this.server?.to((0, delivery_tracking_events_1.orderRoom)(orderId)).emit(event, envelope);
        if (payload.storeId) {
            this.server?.to((0, delivery_tracking_events_1.trackingRoom)('merchant', payload.storeId)).emit(event, envelope);
        }
        if (payload.riderProfileId) {
            this.server?.to((0, delivery_tracking_events_1.trackingRoom)('rider', payload.riderProfileId)).emit(event, envelope);
        }
        this.server?.to((0, delivery_tracking_events_1.trackingRoom)('admin', 'fleet')).emit(event, envelope);
    }
};
exports.DeliveryTrackingGateway = DeliveryTrackingGateway;
__decorate([
    (0, websockets_1.WebSocketServer)(),
    __metadata("design:type", typeof (_a = typeof socket_io_1.Server !== "undefined" && socket_io_1.Server) === "function" ? _a : Object)
], DeliveryTrackingGateway.prototype, "server", void 0);
__decorate([
    (0, websockets_1.SubscribeMessage)('subscribe'),
    __param(0, (0, websockets_1.ConnectedSocket)()),
    __param(1, (0, websockets_1.MessageBody)()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [Object, Object]),
    __metadata("design:returntype", Promise)
], DeliveryTrackingGateway.prototype, "handleSubscribe", null);
__decorate([
    (0, event_emitter_1.OnEvent)(`ws.${delivery_tracking_events_1.TRACKING_EVENTS.LOCATION_UPDATED}`),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [Object]),
    __metadata("design:returntype", void 0)
], DeliveryTrackingGateway.prototype, "onLocationUpdated", null);
__decorate([
    (0, event_emitter_1.OnEvent)(`ws.${delivery_tracking_events_1.TRACKING_EVENTS.ETA_UPDATED}`),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [Object]),
    __metadata("design:returntype", void 0)
], DeliveryTrackingGateway.prototype, "onEtaUpdated", null);
__decorate([
    (0, event_emitter_1.OnEvent)(`ws.${delivery_tracking_events_1.TRACKING_EVENTS.STARTED}`),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [Object]),
    __metadata("design:returntype", void 0)
], DeliveryTrackingGateway.prototype, "onStarted", null);
__decorate([
    (0, event_emitter_1.OnEvent)(`ws.${delivery_tracking_events_1.TRACKING_EVENTS.ARRIVED}`),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [Object]),
    __metadata("design:returntype", void 0)
], DeliveryTrackingGateway.prototype, "onArrived", null);
__decorate([
    (0, event_emitter_1.OnEvent)(`ws.${delivery_tracking_events_1.TRACKING_EVENTS.COMPLETED}`),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [Object]),
    __metadata("design:returntype", void 0)
], DeliveryTrackingGateway.prototype, "onCompleted", null);
__decorate([
    (0, event_emitter_1.OnEvent)(`ws.${delivery_tracking_events_1.TRACKING_EVENTS.ORDER_STATUS}`),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [Object]),
    __metadata("design:returntype", void 0)
], DeliveryTrackingGateway.prototype, "onOrderStatus", null);
__decorate([
    (0, event_emitter_1.OnEvent)('ws.fleet.snapshot'),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [Object]),
    __metadata("design:returntype", void 0)
], DeliveryTrackingGateway.prototype, "onFleetSnapshot", null);
exports.DeliveryTrackingGateway = DeliveryTrackingGateway = DeliveryTrackingGateway_1 = __decorate([
    (0, websockets_1.WebSocketGateway)({
        cors: (0, ws_cors_util_1.wsGatewayCorsOptions)(),
        namespace: '/tracking',
    }),
    __metadata("design:paramtypes", [ws_auth_service_1.WsAuthService,
        delivery_tracking_service_1.DeliveryTrackingService])
], DeliveryTrackingGateway);
//# sourceMappingURL=delivery-tracking.gateway.js.map