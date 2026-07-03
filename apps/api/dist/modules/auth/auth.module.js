"use strict";
var __decorate = (this && this.__decorate) || function (decorators, target, key, desc) {
    var c = arguments.length, r = c < 3 ? target : desc === null ? desc = Object.getOwnPropertyDescriptor(target, key) : desc, d;
    if (typeof Reflect === "object" && typeof Reflect.decorate === "function") r = Reflect.decorate(decorators, target, key, desc);
    else for (var i = decorators.length - 1; i >= 0; i--) if (d = decorators[i]) r = (c < 3 ? d(r) : c > 3 ? d(target, key, r) : d(target, key)) || r;
    return c > 3 && r && Object.defineProperty(target, key, r), r;
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.AuthModule = void 0;
const common_1 = require("@nestjs/common");
const config_1 = require("@nestjs/config");
const jwt_1 = require("@nestjs/jwt");
const passport_1 = require("@nestjs/passport");
const configuration_1 = require("../../config/configuration");
const jwt_strategy_1 = require("./strategies/jwt.strategy");
const msg91_service_1 = require("./msg91.service");
const whatsapp_service_1 = require("./whatsapp.service");
const otp_service_1 = require("./otp.service");
const token_service_1 = require("./token.service");
const auth_service_1 = require("./auth.service");
const auth_controller_1 = require("./auth.controller");
const jwt_auth_guard_1 = require("../../common/guards/jwt-auth.guard");
const roles_guard_1 = require("../../common/guards/roles.guard");
const permissions_guard_1 = require("../../common/guards/permissions.guard");
const merchant_module_1 = require("../merchant/merchant.module");
const trust_safety_module_1 = require("../trust-safety/trust-safety.module");
const wallet_loyalty_module_1 = require("../wallet-loyalty/wallet-loyalty.module");
const password_service_1 = require("./password.service");
let AuthModule = class AuthModule {
};
exports.AuthModule = AuthModule;
exports.AuthModule = AuthModule = __decorate([
    (0, common_1.Module)({
        imports: [
            merchant_module_1.MerchantModule,
            trust_safety_module_1.TrustSafetyModule,
            wallet_loyalty_module_1.WalletLoyaltyModule,
            passport_1.PassportModule.register({ defaultStrategy: 'jwt' }),
            jwt_1.JwtModule.registerAsync({
                inject: [config_1.ConfigService],
                useFactory: (configService) => {
                    const cfg = (0, configuration_1.getConfig)(configService);
                    return {
                        privateKey: cfg.jwt.privateKey,
                        publicKey: cfg.jwt.publicKey,
                        signOptions: {
                            algorithm: 'RS256',
                            expiresIn: cfg.jwt.accessExpiresIn,
                            issuer: cfg.jwt.issuer,
                            audience: cfg.jwt.audience,
                            keyid: cfg.jwt.keyId,
                        },
                    };
                },
            }),
        ],
        controllers: [auth_controller_1.AuthController],
        providers: [
            jwt_strategy_1.JwtStrategy,
            msg91_service_1.Msg91Service,
            whatsapp_service_1.WhatsAppService,
            otp_service_1.OtpService,
            token_service_1.TokenService,
            password_service_1.PasswordService,
            auth_service_1.AuthService,
            jwt_auth_guard_1.JwtAuthGuard,
            roles_guard_1.RolesGuard,
            permissions_guard_1.PermissionsGuard,
        ],
        exports: [
            jwt_1.JwtModule,
            passport_1.PassportModule,
            jwt_auth_guard_1.JwtAuthGuard,
            roles_guard_1.RolesGuard,
            permissions_guard_1.PermissionsGuard,
            token_service_1.TokenService,
            auth_service_1.AuthService,
            msg91_service_1.Msg91Service,
        ],
    })
], AuthModule);
//# sourceMappingURL=auth.module.js.map