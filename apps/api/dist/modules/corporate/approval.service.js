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
exports.ApprovalService = void 0;
const common_1 = require("@nestjs/common");
const client_1 = require("@prisma/client");
const prisma_service_1 = require("../../database/prisma.service");
let ApprovalService = class ApprovalService {
    constructor(prisma) {
        this.prisma = prisma;
    }
    async createPurchaseRequest(employeeId, amount, notes) {
        const employee = await this.prisma.corporateUser.findUnique({
            where: { id: employeeId },
            include: { account: { include: { approvalWorkflows: true } } },
        });
        if (!employee)
            throw new common_1.BadRequestException('Corporate user not found');
        const workflow = employee.account.approvalWorkflows[0];
        const autoApprove = workflow && amount <= Number(workflow.approvalLimit);
        return this.prisma.purchaseRequest.create({
            data: {
                employeeId,
                amount,
                notes,
                status: autoApprove ? client_1.PurchaseRequestStatus.APPROVED : client_1.PurchaseRequestStatus.PENDING,
            },
        });
    }
    async approve(requestId, approverUserId) {
        const approver = await this.prisma.corporateUser.findFirst({
            where: { userId: approverUserId, role: { in: [client_1.CorporateUserRole.ADMIN, client_1.CorporateUserRole.APPROVER] } },
        });
        if (!approver)
            throw new common_1.BadRequestException('Not authorized to approve');
        const req = await this.prisma.purchaseRequest.findFirst({
            where: { id: requestId, employee: { accountId: approver.accountId } },
        });
        if (!req || req.status !== client_1.PurchaseRequestStatus.PENDING) {
            throw new common_1.BadRequestException('Request not found or already processed');
        }
        return this.prisma.purchaseRequest.update({
            where: { id: requestId },
            data: { status: client_1.PurchaseRequestStatus.APPROVED },
        });
    }
    async reject(requestId, approverUserId) {
        const approver = await this.prisma.corporateUser.findFirst({
            where: { userId: approverUserId, role: { in: [client_1.CorporateUserRole.ADMIN, client_1.CorporateUserRole.APPROVER] } },
        });
        if (!approver)
            throw new common_1.BadRequestException('Not authorized');
        return this.prisma.purchaseRequest.update({
            where: { id: requestId },
            data: { status: client_1.PurchaseRequestStatus.REJECTED },
        });
    }
    needsApproval(amount, approvalLimit) {
        return amount > approvalLimit;
    }
};
exports.ApprovalService = ApprovalService;
exports.ApprovalService = ApprovalService = __decorate([
    (0, common_1.Injectable)(),
    __metadata("design:paramtypes", [prisma_service_1.PrismaService])
], ApprovalService);
//# sourceMappingURL=approval.service.js.map