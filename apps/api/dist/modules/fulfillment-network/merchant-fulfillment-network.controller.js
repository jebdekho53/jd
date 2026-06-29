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
exports.MerchantFulfillmentNetworkController = void 0;
const openapi = require("@nestjs/swagger");
const common_1 = require("@nestjs/common");
const swagger_1 = require("@nestjs/swagger");
const jwt_auth_guard_1 = require("../../common/guards/jwt-auth.guard");
const roles_guard_1 = require("../../common/guards/roles.guard");
const roles_decorator_1 = require("../../common/decorators/roles.decorator");
const current_user_decorator_1 = require("../../common/decorators/current-user.decorator");
const constants_1 = require("../../common/constants");
const fulfillment_network_service_1 = require("./fulfillment-network.service");
const inventory_transfer_service_1 = require("./inventory-transfer.service");
const fulfillment_dto_1 = require("./dto/fulfillment.dto");
let MerchantFulfillmentNetworkController = class MerchantFulfillmentNetworkController {
    constructor(network, transfers) {
        this.network = network;
        this.transfers = transfers;
    }
    async overview(user, query) {
        return { success: true, data: await this.network.getOverview(user.id, query.storeId) };
    }
    async capacity(user, query) {
        return { success: true, data: await this.network.getCapacity(user.id, query.storeId) };
    }
    async transfersList(user, query) {
        return { success: true, data: await this.transfers.listTransfers(user.id, query.storeId) };
    }
    async rebalancing(user, query) {
        return { success: true, data: await this.network.getRebalancing(user.id, query.storeId) };
    }
    async performance(user, query) {
        return { success: true, data: await this.network.getPerformance(user.id, query.storeId) };
    }
    async createTransfer(user, dto) {
        return { success: true, data: await this.transfers.createTransfer(user.id, dto) };
    }
    async listInventoryTransfers(user, query) {
        return { success: true, data: await this.transfers.listTransfers(user.id, query.storeId) };
    }
    async approveTransfer(user, id) {
        return { success: true, data: await this.transfers.approveTransfer(user.id, id) };
    }
    async completeTransfer(user, id) {
        return { success: true, data: await this.transfers.completeTransfer(user.id, id) };
    }
};
exports.MerchantFulfillmentNetworkController = MerchantFulfillmentNetworkController;
__decorate([
    (0, common_1.Get)('network/overview'),
    openapi.ApiResponse({ status: 200 }),
    __param(0, (0, current_user_decorator_1.CurrentUser)()),
    __param(1, (0, common_1.Query)()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [Object, fulfillment_dto_1.NetworkQueryDto]),
    __metadata("design:returntype", Promise)
], MerchantFulfillmentNetworkController.prototype, "overview", null);
__decorate([
    (0, common_1.Get)('network/capacity'),
    openapi.ApiResponse({ status: 200 }),
    __param(0, (0, current_user_decorator_1.CurrentUser)()),
    __param(1, (0, common_1.Query)()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [Object, fulfillment_dto_1.NetworkQueryDto]),
    __metadata("design:returntype", Promise)
], MerchantFulfillmentNetworkController.prototype, "capacity", null);
__decorate([
    (0, common_1.Get)('network/transfers'),
    openapi.ApiResponse({ status: 200 }),
    __param(0, (0, current_user_decorator_1.CurrentUser)()),
    __param(1, (0, common_1.Query)()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [Object, fulfillment_dto_1.NetworkQueryDto]),
    __metadata("design:returntype", Promise)
], MerchantFulfillmentNetworkController.prototype, "transfersList", null);
__decorate([
    (0, common_1.Get)('network/rebalancing'),
    openapi.ApiResponse({ status: 200 }),
    __param(0, (0, current_user_decorator_1.CurrentUser)()),
    __param(1, (0, common_1.Query)()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [Object, fulfillment_dto_1.NetworkQueryDto]),
    __metadata("design:returntype", Promise)
], MerchantFulfillmentNetworkController.prototype, "rebalancing", null);
__decorate([
    (0, common_1.Get)('network/performance'),
    openapi.ApiResponse({ status: 200 }),
    __param(0, (0, current_user_decorator_1.CurrentUser)()),
    __param(1, (0, common_1.Query)()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [Object, fulfillment_dto_1.NetworkQueryDto]),
    __metadata("design:returntype", Promise)
], MerchantFulfillmentNetworkController.prototype, "performance", null);
__decorate([
    (0, common_1.Post)('inventory/transfers'),
    openapi.ApiResponse({ status: 201 }),
    __param(0, (0, current_user_decorator_1.CurrentUser)()),
    __param(1, (0, common_1.Body)()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [Object, fulfillment_dto_1.CreateTransferDto]),
    __metadata("design:returntype", Promise)
], MerchantFulfillmentNetworkController.prototype, "createTransfer", null);
__decorate([
    (0, common_1.Get)('inventory/transfers'),
    openapi.ApiResponse({ status: 200 }),
    __param(0, (0, current_user_decorator_1.CurrentUser)()),
    __param(1, (0, common_1.Query)()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [Object, fulfillment_dto_1.NetworkQueryDto]),
    __metadata("design:returntype", Promise)
], MerchantFulfillmentNetworkController.prototype, "listInventoryTransfers", null);
__decorate([
    (0, common_1.Patch)('inventory/transfers/:id/approve'),
    openapi.ApiResponse({ status: 200 }),
    __param(0, (0, current_user_decorator_1.CurrentUser)()),
    __param(1, (0, common_1.Param)('id')),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [Object, String]),
    __metadata("design:returntype", Promise)
], MerchantFulfillmentNetworkController.prototype, "approveTransfer", null);
__decorate([
    (0, common_1.Patch)('inventory/transfers/:id/complete'),
    openapi.ApiResponse({ status: 200 }),
    __param(0, (0, current_user_decorator_1.CurrentUser)()),
    __param(1, (0, common_1.Param)('id')),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [Object, String]),
    __metadata("design:returntype", Promise)
], MerchantFulfillmentNetworkController.prototype, "completeTransfer", null);
exports.MerchantFulfillmentNetworkController = MerchantFulfillmentNetworkController = __decorate([
    (0, swagger_1.ApiTags)(constants_1.ApiTags.MERCHANTS),
    (0, swagger_1.ApiBearerAuth)('access-token'),
    (0, common_1.UseGuards)(jwt_auth_guard_1.JwtAuthGuard, roles_guard_1.RolesGuard),
    (0, roles_decorator_1.Roles)('MERCHANT'),
    (0, common_1.Controller)('merchant'),
    __metadata("design:paramtypes", [fulfillment_network_service_1.FulfillmentNetworkService,
        inventory_transfer_service_1.InventoryTransferService])
], MerchantFulfillmentNetworkController);
//# sourceMappingURL=merchant-fulfillment-network.controller.js.map