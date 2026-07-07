import { RequestUser } from '../../common/types';
import { SupportTicketService } from './support-ticket.service';
import { KnowledgeBaseService } from './knowledge-base.service';
import { CreateTicketDto, FeedbackDto, ListTicketsQueryDto, ReplyTicketDto } from './dto/support.dto';
export declare class BuyerSupportController {
    private readonly tickets;
    private readonly kb;
    constructor(tickets: SupportTicketService, kb: KnowledgeBaseService);
    categories(): Promise<{
        success: boolean;
        data: string[];
    }>;
    articles(q?: string, category?: string): Promise<{
        success: boolean;
        data: {
            category: string;
            id: string;
            createdAt: Date;
            updatedAt: Date;
            audience: import("@prisma/client").$Enums.SupportActorType;
            body: string;
            title: string;
            kind: import("@prisma/client").$Enums.HelpArticleKind;
            slug: string;
            sortOrder: number;
            isPublished: boolean;
        }[];
    }>;
    list(user: RequestUser, query: ListTicketsQueryDto): Promise<{
        success: boolean;
        data: {
            items: ({
                category: {
                    id: string;
                    name: string;
                    createdAt: Date;
                    description: string | null;
                    audience: import("@prisma/client").$Enums.SupportActorType;
                    code: string;
                    isActive: boolean;
                    sortOrder: number;
                };
                feedback: {
                    id: string;
                    createdAt: Date;
                    rating: number;
                    ticketId: string;
                    comment: string | null;
                } | null;
            } & {
                id: string;
                status: import("@prisma/client").$Enums.SupportTicketStatus;
                createdAt: Date;
                updatedAt: Date;
                description: string;
                resolvedAt: Date | null;
                categoryId: string;
                orderId: string | null;
                subject: string;
                priority: import("@prisma/client").$Enums.SupportPriority;
                ticketNumber: string;
                requesterUserId: string;
                actorType: import("@prisma/client").$Enums.SupportActorType;
                channel: import("@prisma/client").$Enums.SupportChannel;
                paymentId: string | null;
                walletTransactionId: string | null;
                gstInvoiceId: string | null;
                isRefundDispute: boolean;
                assignedTeam: import("@prisma/client").$Enums.SupportTeam | null;
                firstResponseAt: Date | null;
                slaResponseDue: Date | null;
                slaResolutionDue: Date | null;
                closedAt: Date | null;
            })[];
            total: number;
            page: number;
            limit: number;
        };
    }>;
    create(user: RequestUser, dto: CreateTicketDto): Promise<{
        success: boolean;
        data: {
            category: {
                id: string;
                name: string;
                createdAt: Date;
                description: string | null;
                audience: import("@prisma/client").$Enums.SupportActorType;
                code: string;
                isActive: boolean;
                sortOrder: number;
            };
        } & {
            id: string;
            status: import("@prisma/client").$Enums.SupportTicketStatus;
            createdAt: Date;
            updatedAt: Date;
            description: string;
            resolvedAt: Date | null;
            categoryId: string;
            orderId: string | null;
            subject: string;
            priority: import("@prisma/client").$Enums.SupportPriority;
            ticketNumber: string;
            requesterUserId: string;
            actorType: import("@prisma/client").$Enums.SupportActorType;
            channel: import("@prisma/client").$Enums.SupportChannel;
            paymentId: string | null;
            walletTransactionId: string | null;
            gstInvoiceId: string | null;
            isRefundDispute: boolean;
            assignedTeam: import("@prisma/client").$Enums.SupportTeam | null;
            firstResponseAt: Date | null;
            slaResponseDue: Date | null;
            slaResolutionDue: Date | null;
            closedAt: Date | null;
        };
    }>;
    detail(user: RequestUser, id: string): Promise<{
        success: boolean;
        data: {
            category: {
                id: string;
                name: string;
                createdAt: Date;
                description: string | null;
                audience: import("@prisma/client").$Enums.SupportActorType;
                code: string;
                isActive: boolean;
                sortOrder: number;
            };
            resolution: {
                id: string;
                createdAt: Date;
                resolvedBy: string;
                ticketId: string;
                summary: string;
                refundApproved: boolean | null;
            } | null;
            assignments: ({
                agent: {
                    user: {
                        phone: string;
                    };
                } & {
                    id: string;
                    createdAt: Date;
                    userId: string;
                    isActive: boolean;
                    team: import("@prisma/client").$Enums.SupportTeam;
                };
            } & {
                id: string;
                assignedAt: Date;
                assignedBy: string | null;
                isActive: boolean;
                ticketId: string;
                note: string | null;
                unassignedAt: Date | null;
                agentId: string;
            })[];
            attachments: {
                id: string;
                createdAt: Date;
                messageId: string | null;
                ticketId: string;
                fileName: string;
                mimeType: string;
                storageKey: string;
                sizeBytes: number | null;
            }[];
            messages: {
                id: string;
                createdAt: Date;
                body: string;
                ticketId: string;
                authorId: string;
                visibility: import("@prisma/client").$Enums.SupportMessageVisibility;
            }[];
            feedback: {
                id: string;
                createdAt: Date;
                rating: number;
                ticketId: string;
                comment: string | null;
            } | null;
            tags: ({
                tag: {
                    id: string;
                    name: string;
                    createdAt: Date;
                };
            } & {
                ticketId: string;
                tagId: string;
            })[];
        } & {
            id: string;
            status: import("@prisma/client").$Enums.SupportTicketStatus;
            createdAt: Date;
            updatedAt: Date;
            description: string;
            resolvedAt: Date | null;
            categoryId: string;
            orderId: string | null;
            subject: string;
            priority: import("@prisma/client").$Enums.SupportPriority;
            ticketNumber: string;
            requesterUserId: string;
            actorType: import("@prisma/client").$Enums.SupportActorType;
            channel: import("@prisma/client").$Enums.SupportChannel;
            paymentId: string | null;
            walletTransactionId: string | null;
            gstInvoiceId: string | null;
            isRefundDispute: boolean;
            assignedTeam: import("@prisma/client").$Enums.SupportTeam | null;
            firstResponseAt: Date | null;
            slaResponseDue: Date | null;
            slaResolutionDue: Date | null;
            closedAt: Date | null;
        };
    }>;
    reply(user: RequestUser, id: string, dto: ReplyTicketDto): Promise<{
        success: boolean;
        data: {
            id: string;
            createdAt: Date;
            body: string;
            ticketId: string;
            authorId: string;
            visibility: import("@prisma/client").$Enums.SupportMessageVisibility;
        };
    }>;
    feedback(user: RequestUser, id: string, dto: FeedbackDto): Promise<{
        success: boolean;
        data: {
            id: string;
            createdAt: Date;
            rating: number;
            ticketId: string;
            comment: string | null;
        };
    }>;
}
