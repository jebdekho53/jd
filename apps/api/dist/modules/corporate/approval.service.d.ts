import { PrismaService } from '../../database/prisma.service';
export declare class ApprovalService {
    private readonly prisma;
    constructor(prisma: PrismaService);
    createPurchaseRequest(employeeId: string, amount: number, notes?: string): Promise<{
        id: string;
        status: import("@prisma/client").$Enums.PurchaseRequestStatus;
        createdAt: Date;
        updatedAt: Date;
        amount: import("@prisma/client/runtime/library").Decimal;
        orderId: string | null;
        notes: string | null;
        employeeId: string;
    }>;
    approve(requestId: string, approverUserId: string): Promise<{
        id: string;
        status: import("@prisma/client").$Enums.PurchaseRequestStatus;
        createdAt: Date;
        updatedAt: Date;
        amount: import("@prisma/client/runtime/library").Decimal;
        orderId: string | null;
        notes: string | null;
        employeeId: string;
    }>;
    reject(requestId: string, approverUserId: string): Promise<{
        id: string;
        status: import("@prisma/client").$Enums.PurchaseRequestStatus;
        createdAt: Date;
        updatedAt: Date;
        amount: import("@prisma/client/runtime/library").Decimal;
        orderId: string | null;
        notes: string | null;
        employeeId: string;
    }>;
    needsApproval(amount: number, approvalLimit: number): boolean;
}
