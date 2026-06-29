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
Object.defineProperty(exports, "__esModule", { value: true });
exports.DemoAwareThrottlerGuard = void 0;
const common_1 = require("@nestjs/common");
const config_1 = require("@nestjs/config");
const core_1 = require("@nestjs/core");
const throttler_1 = require("@nestjs/throttler");
const configuration_1 = require("../../config/configuration");
const demo_auth_util_1 = require("../utils/demo-auth.util");
let DemoAwareThrottlerGuard = class DemoAwareThrottlerGuard extends throttler_1.ThrottlerGuard {
    constructor(options, storageService, reflector, configService) {
        super(options, storageService, reflector);
        this.cfg = (0, configuration_1.getConfig)(configService);
    }
    async shouldSkip(context) {
        const request = context.switchToHttp().getRequest();
        if ((0, demo_auth_util_1.isDemoAuthRequest)(request.body, this.cfg)) {
            return true;
        }
        return false;
    }
};
exports.DemoAwareThrottlerGuard = DemoAwareThrottlerGuard;
exports.DemoAwareThrottlerGuard = DemoAwareThrottlerGuard = __decorate([
    (0, common_1.Injectable)(),
    __param(0, (0, throttler_1.InjectThrottlerOptions)()),
    __param(1, (0, throttler_1.InjectThrottlerStorage)()),
    __metadata("design:paramtypes", [Object, Object, core_1.Reflector,
        config_1.ConfigService])
], DemoAwareThrottlerGuard);
//# sourceMappingURL=demo-aware-throttler.guard.js.map