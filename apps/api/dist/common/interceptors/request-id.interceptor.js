"use strict";
var __decorate = (this && this.__decorate) || function (decorators, target, key, desc) {
    var c = arguments.length, r = c < 3 ? target : desc === null ? desc = Object.getOwnPropertyDescriptor(target, key) : desc, d;
    if (typeof Reflect === "object" && typeof Reflect.decorate === "function") r = Reflect.decorate(decorators, target, key, desc);
    else for (var i = decorators.length - 1; i >= 0; i--) if (d = decorators[i]) r = (c < 3 ? d(r) : c > 3 ? d(target, key, r) : d(target, key)) || r;
    return c > 3 && r && Object.defineProperty(target, key, r), r;
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.RequestIdInterceptor = void 0;
const common_1 = require("@nestjs/common");
const operators_1 = require("rxjs/operators");
const crypto_1 = require("crypto");
let RequestIdInterceptor = class RequestIdInterceptor {
    intercept(context, next) {
        if (context.getType() !== 'http') {
            return next.handle();
        }
        const http = context.switchToHttp();
        const request = http.getRequest();
        const response = http.getResponse();
        const incoming = request.headers['x-request-id'];
        const requestId = typeof incoming === 'string' && incoming.trim().length > 0
            ? incoming.trim().slice(0, 64)
            : (0, crypto_1.randomUUID)();
        request.headers['x-request-id'] = requestId;
        response.setHeader('X-Request-Id', requestId);
        return next.handle().pipe((0, operators_1.tap)(() => {
            if (!response.headersSent) {
                response.setHeader('X-Request-Id', requestId);
            }
        }));
    }
};
exports.RequestIdInterceptor = RequestIdInterceptor;
exports.RequestIdInterceptor = RequestIdInterceptor = __decorate([
    (0, common_1.Injectable)()
], RequestIdInterceptor);
//# sourceMappingURL=request-id.interceptor.js.map