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
var AnalyticsGateway_1;
Object.defineProperty(exports, "__esModule", { value: true });
exports.AnalyticsGateway = exports.ANALYTICS_EVENTS = void 0;
const common_1 = require("@nestjs/common");
const event_emitter_1 = require("@nestjs/event-emitter");
const schedule_1 = require("@nestjs/schedule");
const websockets_1 = require("@nestjs/websockets");
const socket_io_1 = require("socket.io");
const ws_auth_service_1 = require("../../common/websocket/ws-auth.service");
const ws_cors_util_1 = require("../../common/websocket/ws-cors.util");
const analytics_service_1 = require("./analytics.service");
exports.ANALYTICS_EVENTS = {
    CONTROL_ROOM_UPDATED: 'control-room.updated',
};
let AnalyticsGateway = AnalyticsGateway_1 = class AnalyticsGateway {
    constructor(analytics, wsAuth) {
        this.analytics = analytics;
        this.wsAuth = wsAuth;
        this.logger = new common_1.Logger(AnalyticsGateway_1.name);
    }
    handleConnection(client) {
        const user = this.wsAuth.authenticateSocket(client);
        if (!user || !this.wsAuth.hasAnyRole(user, ['ADMIN', 'SUPER_ADMIN'])) {
            this.logger.warn(`Rejected non-admin analytics socket ${client.id}`);
            client.disconnect(true);
            return;
        }
        client.data.user = user;
    }
    handleSubscribe(client) {
        const user = client.data.user;
        if (!user || !this.wsAuth.hasAnyRole(user, ['ADMIN', 'SUPER_ADMIN'])) {
            return { error: 'Admin access required' };
        }
        client.join('control-room');
        void this.pushControlRoom();
        return { subscribed: 'control-room' };
    }
    onMaterialized() {
        void this.pushControlRoom();
    }
    async pushControlRoom() {
        try {
            const payload = await this.analytics.getControlRoom();
            this.server.to('control-room').emit(exports.ANALYTICS_EVENTS.CONTROL_ROOM_UPDATED, payload);
        }
        catch (err) {
            this.logger.warn(`Control room push failed: ${err.message}`);
        }
    }
};
exports.AnalyticsGateway = AnalyticsGateway;
__decorate([
    (0, websockets_1.WebSocketServer)(),
    __metadata("design:type", socket_io_1.Server)
], AnalyticsGateway.prototype, "server", void 0);
__decorate([
    (0, websockets_1.SubscribeMessage)('subscribe'),
    __param(0, (0, websockets_1.ConnectedSocket)()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [Object]),
    __metadata("design:returntype", void 0)
], AnalyticsGateway.prototype, "handleSubscribe", null);
__decorate([
    (0, event_emitter_1.OnEvent)('analytics.materialized'),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", []),
    __metadata("design:returntype", void 0)
], AnalyticsGateway.prototype, "onMaterialized", null);
__decorate([
    (0, schedule_1.Cron)(schedule_1.CronExpression.EVERY_30_SECONDS),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", []),
    __metadata("design:returntype", Promise)
], AnalyticsGateway.prototype, "pushControlRoom", null);
exports.AnalyticsGateway = AnalyticsGateway = AnalyticsGateway_1 = __decorate([
    (0, websockets_1.WebSocketGateway)({ cors: (0, ws_cors_util_1.wsGatewayCorsOptions)(), namespace: '/analytics' }),
    __metadata("design:paramtypes", [analytics_service_1.AnalyticsService,
        ws_auth_service_1.WsAuthService])
], AnalyticsGateway);
//# sourceMappingURL=analytics.gateway.js.map