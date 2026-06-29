"use strict";
var __decorate = (this && this.__decorate) || function (decorators, target, key, desc) {
    var c = arguments.length, r = c < 3 ? target : desc === null ? desc = Object.getOwnPropertyDescriptor(target, key) : desc, d;
    if (typeof Reflect === "object" && typeof Reflect.decorate === "function") r = Reflect.decorate(decorators, target, key, desc);
    else for (var i = decorators.length - 1; i >= 0; i--) if (d = decorators[i]) r = (c < 3 ? d(r) : c > 3 ? d(target, key, r) : d(target, key)) || r;
    return c > 3 && r && Object.defineProperty(target, key, r), r;
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.AdminPasswordService = void 0;
const common_1 = require("@nestjs/common");
const bcrypt = require("bcrypt");
const BCRYPT_ROUNDS = 12;
let AdminPasswordService = class AdminPasswordService {
    async hash(password) {
        return bcrypt.hash(password, BCRYPT_ROUNDS);
    }
    async verify(hash, password) {
        if (!hash)
            return false;
        try {
            return await bcrypt.compare(password, hash);
        }
        catch {
            return false;
        }
    }
};
exports.AdminPasswordService = AdminPasswordService;
exports.AdminPasswordService = AdminPasswordService = __decorate([
    (0, common_1.Injectable)()
], AdminPasswordService);
//# sourceMappingURL=admin-password.service.js.map