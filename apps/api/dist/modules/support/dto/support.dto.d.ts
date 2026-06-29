import { SupportActorType, SupportMessageVisibility, SupportPriority, SupportTicketStatus } from '@prisma/client';
export declare class ListTicketsQueryDto {
    page?: number;
    limit?: number;
}
export declare class CreateTicketDto {
    categoryCode: string;
    subject: string;
    description: string;
    priority?: SupportPriority;
    orderId?: string;
    paymentId?: string;
    walletTransactionId?: string;
    gstInvoiceId?: string;
}
export declare class ReplyTicketDto {
    body: string;
    visibility?: SupportMessageVisibility;
}
export declare class FeedbackDto {
    rating: number;
    comment?: string;
}
export declare class ResolveTicketDto {
    summary: string;
    refundApproved?: boolean;
}
export declare class AdminListTicketsDto extends ListTicketsQueryDto {
    status?: SupportTicketStatus;
    priority?: SupportPriority;
    team?: string;
    refundOnly?: boolean;
    actorType?: SupportActorType;
}
export declare class KnowledgeSearchDto {
    q?: string;
    category?: string;
    audience?: SupportActorType;
}
