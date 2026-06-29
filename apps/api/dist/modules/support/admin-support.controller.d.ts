import { RequestUser } from '../../common/types';
import { SupportTicketService } from './support-ticket.service';
import { SupportAnalyticsService } from './support-analytics.service';
import { CustomerTimelineService } from './customer-timeline.service';
import { KnowledgeBaseService } from './knowledge-base.service';
import { AdminListTicketsDto, KnowledgeSearchDto, ReplyTicketDto, ResolveTicketDto } from './dto/support.dto';
export declare class AdminSupportController {
    private readonly tickets;
    private readonly analytics;
    private readonly timeline;
    private readonly kb;
    constructor(tickets: SupportTicketService, analytics: SupportAnalyticsService, timeline: CustomerTimelineService, kb: KnowledgeBaseService);
    overview(): Promise<{
        success: boolean;
        data: {
            ticketsCreated: number;
            ticketsResolved: number;
            ticketsOpen: number;
            averageResolutionHours: number;
            slaCompliancePct: number;
            csatScore: number | null;
            agentAssignments: number;
        };
    }>;
    listTickets(query: AdminListTicketsDto): Promise<{
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
                assignments: ({
                    agent: {
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
                requester: {
                    phone: string;
                    email: string | null;
                    id: string;
                };
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
            })[];
            total: number;
            page: number;
            limit: number;
        };
    }>;
    open(query: AdminListTicketsDto): Promise<{
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
                assignments: ({
                    agent: {
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
                requester: {
                    phone: string;
                    email: string | null;
                    id: string;
                };
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
            })[];
            total: number;
            page: number;
            limit: number;
        };
    }>;
    escalated(query: AdminListTicketsDto): Promise<{
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
                assignments: ({
                    agent: {
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
                requester: {
                    phone: string;
                    email: string | null;
                    id: string;
                };
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
            })[];
            total: number;
            page: number;
            limit: number;
        };
    }>;
    highPriority(query: AdminListTicketsDto): Promise<{
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
                assignments: ({
                    agent: {
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
                requester: {
                    phone: string;
                    email: string | null;
                    id: string;
                };
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
            })[];
            total: number;
            page: number;
            limit: number;
        };
    }>;
    financeRelated(query: AdminListTicketsDto): Promise<{
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
                assignments: ({
                    agent: {
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
                requester: {
                    phone: string;
                    email: string | null;
                    id: string;
                };
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
            })[];
            total: number;
            page: number;
            limit: number;
        };
    }>;
    merchantRelated(query: AdminListTicketsDto): Promise<{
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
                assignments: ({
                    agent: {
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
                requester: {
                    phone: string;
                    email: string | null;
                    id: string;
                };
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
            })[];
            total: number;
            page: number;
            limit: number;
        };
    }>;
    riderRelated(query: AdminListTicketsDto): Promise<{
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
                assignments: ({
                    agent: {
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
                requester: {
                    phone: string;
                    email: string | null;
                    id: string;
                };
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
            })[];
            total: number;
            page: number;
            limit: number;
        };
    }>;
    refundRelated(query: AdminListTicketsDto): Promise<{
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
                assignments: ({
                    agent: {
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
                requester: {
                    phone: string;
                    email: string | null;
                    id: string;
                };
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
            })[];
            total: number;
            page: number;
            limit: number;
        };
    }>;
    detail(id: string): Promise<{
        success: boolean;
        data: {
            ticket: {
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
                    ticketId: string;
                    body: string;
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
            customerTimeline: {
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
            };
        };
    }>;
    reply(user: RequestUser, id: string, dto: ReplyTicketDto): Promise<{
        success: boolean;
        data: {
            id: string;
            createdAt: Date;
            ticketId: string;
            body: string;
            authorId: string;
            visibility: import("@prisma/client").$Enums.SupportMessageVisibility;
        };
    }>;
    resolve(user: RequestUser, id: string, dto: ResolveTicketDto): Promise<{
        success: boolean;
        data: {
            ticketId: string;
            status: "RESOLVED";
        };
    }>;
    knowledge(query: KnowledgeSearchDto): Promise<{
        success: boolean;
        data: {
            category: string;
            id: string;
            createdAt: Date;
            updatedAt: Date;
            audience: import("@prisma/client").$Enums.SupportActorType;
            title: string;
            kind: import("@prisma/client").$Enums.HelpArticleKind;
            slug: string;
            sortOrder: number;
            body: string;
            isPublished: boolean;
        }[];
    }>;
}
