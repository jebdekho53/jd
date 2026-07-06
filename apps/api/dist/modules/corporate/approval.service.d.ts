import { PrismaService } from '../../database/prisma.service';
export declare class ApprovalService {
    private readonly prisma;
    constructor(prisma: PrismaService);
    createPurchaseRequest(employeeId: string, amount: number, notes?: string): Promise<any>;
    approve(requestId: string, approverUserId: string): Promise<any>;
    reject(requestId: string, approverUserId: string): Promise<any>;
    needsApproval(amount: number, approvalLimit: number): boolean;
}
