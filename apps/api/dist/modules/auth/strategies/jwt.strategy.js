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
exports.JwtStrategy = void 0;
const common_1 = require("@nestjs/common");
const config_1 = require("@nestjs/config");
const passport_1 = require("@nestjs/passport");
const passport_jwt_1 = require("passport-jwt");
const configuration_1 = require("../../../config/configuration");
const token_service_1 = require("../token.service");
let JwtStrategy = class JwtStrategy extends (0, passport_1.PassportStrategy)(passport_jwt_1.Strategy, 'jwt') {
    constructor(configService, tokenService) {
        const cfg = (0, configuration_1.getConfig)(configService);
        super({
            jwtFromRequest: passport_jwt_1.ExtractJwt.fromAuthHeaderAsBearerToken(),
            ignoreExpiration: false,
            algorithms: ['RS256'],
            secretOrKey: cfg.jwt.publicKey,
            issuer: cfg.jwt.issuer,
            audience: cfg.jwt.audience,
        });
        this.tokenService = tokenService;
    }
    async validate(payload) {
        if (!payload.sub) {
            throw new common_1.UnauthorizedException('Malformed token payload');
        }
        return this.tokenService.resolveLiveRequestUser(payload.sub);
    }
};
exports.JwtStrategy = JwtStrategy;
exports.JwtStrategy = JwtStrategy = __decorate([
    (0, common_1.Injectable)(),
    __metadata("design:paramtypes", [config_1.ConfigService,
        token_service_1.TokenService])
], JwtStrategy);
//# sourceMappingURL=jwt.strategy.js.map