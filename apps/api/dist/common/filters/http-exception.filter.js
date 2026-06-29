"use strict";
var __decorate = (this && this.__decorate) || function (decorators, target, key, desc) {
    var c = arguments.length, r = c < 3 ? target : desc === null ? desc = Object.getOwnPropertyDescriptor(target, key) : desc, d;
    if (typeof Reflect === "object" && typeof Reflect.decorate === "function") r = Reflect.decorate(decorators, target, key, desc);
    else for (var i = decorators.length - 1; i >= 0; i--) if (d = decorators[i]) r = (c < 3 ? d(r) : c > 3 ? d(target, key, r) : d(target, key)) || r;
    return c > 3 && r && Object.defineProperty(target, key, r), r;
};
var HttpExceptionFilter_1;
Object.defineProperty(exports, "__esModule", { value: true });
exports.HttpExceptionFilter = void 0;
const common_1 = require("@nestjs/common");
const client_1 = require("@prisma/client");
let HttpExceptionFilter = HttpExceptionFilter_1 = class HttpExceptionFilter {
    constructor() {
        this.logger = new common_1.Logger(HttpExceptionFilter_1.name);
    }
    catch(exception, host) {
        const ctx = host.switchToHttp();
        const response = ctx.getResponse();
        const request = ctx.getRequest();
        const { statusCode, message, error } = this.resolveException(exception);
        const body = {
            success: false,
            statusCode,
            message,
            error,
            path: request.url,
            timestamp: new Date().toISOString(),
        };
        if (statusCode >= 500) {
            this.logger.error({ err: exception, path: request.url, method: request.method }, `Unhandled exception: ${String(exception)}`);
        }
        response.status(statusCode).json(body);
    }
    resolveException(exception) {
        if (exception instanceof common_1.HttpException) {
            const status = exception.getStatus();
            const responseBody = exception.getResponse();
            if (typeof responseBody === 'object' && responseBody !== null) {
                const body = responseBody;
                return {
                    statusCode: status,
                    message: body['message'] ?? exception.message,
                    error: body['error'] ?? exception.name,
                };
            }
            return {
                statusCode: status,
                message: exception.message,
                error: exception.name,
            };
        }
        if (exception instanceof client_1.Prisma.PrismaClientKnownRequestError) {
            if (exception.code === 'P2002') {
                const fields = exception.meta?.['target'] ?? [];
                return {
                    statusCode: common_1.HttpStatus.CONFLICT,
                    message: `Conflict: ${fields.join(', ')} already exists`,
                    error: 'Conflict',
                };
            }
            if (exception.code === 'P2025') {
                return {
                    statusCode: common_1.HttpStatus.NOT_FOUND,
                    message: 'Record not found',
                    error: 'Not Found',
                };
            }
        }
        return {
            statusCode: common_1.HttpStatus.INTERNAL_SERVER_ERROR,
            message: 'Internal server error',
            error: 'Internal Server Error',
        };
    }
};
exports.HttpExceptionFilter = HttpExceptionFilter;
exports.HttpExceptionFilter = HttpExceptionFilter = HttpExceptionFilter_1 = __decorate([
    (0, common_1.Catch)()
], HttpExceptionFilter);
//# sourceMappingURL=http-exception.filter.js.map