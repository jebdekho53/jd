import { BadRequestException, Injectable } from '@nestjs/common';
import { CorporateUserRole, PurchaseRequestStatus } from '@prisma/client';
import { PrismaService } from '../../database/prisma.service';

@Injectable()
export class ApprovalService {
  constructor(private readonly prisma: PrismaService) {}

  async createPurchaseRequest(employeeId: string, amount: number, notes?: string) {
    const employee = await this.prisma.corporateUser.findUnique({
      where: { id: employeeId },
      include: { account: { include: { approvalWorkflows: true } } },
    });
    if (!employee) throw new BadRequestException('Corporate user not found');

    const workflow = employee.account.approvalWorkflows[0];
    const autoApprove = workflow && amount <= Number(workflow.approvalLimit);

    return this.prisma.purchaseRequest.create({
      data: {
        employeeId,
        amount,
        notes,
        status: autoApprove ? PurchaseRequestStatus.APPROVED : PurchaseRequestStatus.PENDING,
      },
    });
  }

  async approve(requestId: string, approverUserId: string) {
    const approver = await this.prisma.corporateUser.findFirst({
      where: { userId: approverUserId, role: { in: [CorporateUserRole.ADMIN, CorporateUserRole.APPROVER] } },
    });
    if (!approver) throw new BadRequestException('Not authorized to approve');

    const req = await this.prisma.purchaseRequest.findFirst({
      where: { id: requestId, employee: { accountId: approver.accountId } },
    });
    if (!req || req.status !== PurchaseRequestStatus.PENDING) {
      throw new BadRequestException('Request not found or already processed');
    }

    return this.prisma.purchaseRequest.update({
      where: { id: requestId },
      data: { status: PurchaseRequestStatus.APPROVED },
    });
  }

  async reject(requestId: string, approverUserId: string) {
    const approver = await this.prisma.corporateUser.findFirst({
      where: { userId: approverUserId, role: { in: [CorporateUserRole.ADMIN, CorporateUserRole.APPROVER] } },
    });
    if (!approver) throw new BadRequestException('Not authorized');

    return this.prisma.purchaseRequest.update({
      where: { id: requestId },
      data: { status: PurchaseRequestStatus.REJECTED },
    });
  }

  needsApproval(amount: number, approvalLimit: number) {
    return amount > approvalLimit;
  }
}
