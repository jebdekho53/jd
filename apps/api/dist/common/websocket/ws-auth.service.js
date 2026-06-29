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
Object.defineProperty(exports, "__esModule", { value: true });
exports.WsAuthService = void 0;
const common_1 = require("@nestjs/common");
const config_1 = require("@nestjs/config");
const jwt_1 = require("@nestjs/jwt");
const configuration_1 = require("../../config/configuration");
let WsAuthService = class WsAuthService {
    constructor(jwtService, configService) {
        this.jwtService = jwtService;
        this.cfg = (0, configuration_1.getConfig)(configService);
    }
    extractTokenFromSocket(client) {
        const authToken = client.handshake.auth?.token;
        if (typeof authToken === 'string' && authToken.length > 0) {
            return authToken;
        }
        const header = client.handshake.headers.authorization;
        if (typeof header === 'string' && header.startsWith('Bearer ')) {
            return header.slice('Bearer '.length).trim();
        }
        return null;
    }
    verifyAccessToken(token) {
        try {
            const payload = this.jwtService.verify(token, {
                algorithms: ['RS256'],
                issuer: this.cfg.jwt.issuer,
                audience: this.cfg.jwt.audience,
                publicKey: this.cfg.jwt.publicKey,
            });
            if (!payload.sub)
                return null;
            return {
                id: payload.sub,
                phone: payload.phone,
                email: payload.email ?? null,
                roles: payload.roles ?? [],
                permissions: payload.permissions ?? [],
            };
        }
        catch {
            return null;
        }
    }
    authenticateSocket(client) {
        const token = this.extractTokenFromSocket(client);
        if (!token)
            return null;
        return this.verifyAccessToken(token);
    }
    hasAnyRole(user, roles) {
        return roles.some((role) => user.roles.includes(role));
    }
};
exports.WsAuthService = WsAuthService;
exports.WsAuthService = WsAuthService = __decorate([
    (0, common_1.Injectable)(),
    __metadata("design:paramtypes", [jwt_1.JwtService,
        config_1.ConfigService])
], WsAuthService);
//# sourceMappingURL=ws-auth.service.js.map