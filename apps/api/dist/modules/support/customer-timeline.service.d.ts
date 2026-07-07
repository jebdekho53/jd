import { PrismaService } from '../../database/prisma.service';
export declare class CustomerTimelineService {
    private readonly prisma;
    constructor(prisma: PrismaService);
    getTimeline(userId: string): Promise<{
        events: ({
            type: "order";
            id: string;
            label: string;
            detail: import("@prisma/client").$Enums.OrderStatus;
            amount: number;
            at: Date;
        } | {
            type: "wallet";
            id: string;
            label: import("@prisma/client").$Enums.WalletTransactionType;
            detail: string;
            amount: number;
            at: Date;
        } | {
            type: "support";
            id: string;
            label: string;
            detail: string;
            status: import("@prisma/client").$Enums.SupportTicketStatus;
            at: Date;
        } | {
            type: "fraud";
            id: string;
            label: string;
            detail: string;
            status: import("@prisma/client").$Enums.FraudCaseStatus;
            at: Date;
        } | {
            type: "refund";
            id: string;
            label: string;
            detail: string;
            amount: number;
            at: Date;
        })[];
    }>;
    getTimelineForTicket(ticketId: string): Promise<{
        events: ({
            type: "order";
            id: string;
            label: string;
            detail: import("@prisma/client").$Enums.OrderStatus;
            amount: number;
            at: Date;
        } | {
            type: "wallet";
            id: string;
            label: import("@prisma/client").$Enums.WalletTransactionType;
            detail: string;
            amount: number;
            at: Date;
        } | {
            type: "support";
            id: string;
            label: string;
            detail: string;
            status: import("@prisma/client").$Enums.SupportTicketStatus;
            at: Date;
        } | {
            type: "fraud";
            id: string;
            label: string;
            detail: string;
            status: import("@prisma/client").$Enums.FraudCaseStatus;
            at: Date;
        } | {
            type: "refund";
            id: string;
            label: string;
            detail: string;
            amount: number;
            at: Date;
        })[];
    }>;
}
