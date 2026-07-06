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
            ticketsCreated: any;
            ticketsResolved: any;
            ticketsOpen: any;
            averageResolutionHours: number;
            slaCompliancePct: number;
            csatScore: number | null;
            agentAssignments: any;
        };
    }>;
    listTickets(query: AdminListTicketsDto): Promise<{
        success: boolean;
        data: {
            items: any;
            total: any;
            page: number;
            limit: number;
        };
    }>;
    open(query: AdminListTicketsDto): Promise<{
        success: boolean;
        data: {
            items: any;
            total: any;
            page: number;
            limit: number;
        };
    }>;
    escalated(query: AdminListTicketsDto): Promise<{
        success: boolean;
        data: {
            items: any;
            total: any;
            page: number;
            limit: number;
        };
    }>;
    highPriority(query: AdminListTicketsDto): Promise<{
        success: boolean;
        data: {
            items: any;
            total: any;
            page: number;
            limit: number;
        };
    }>;
    financeRelated(query: AdminListTicketsDto): Promise<{
        success: boolean;
        data: {
            items: any;
            total: any;
            page: number;
            limit: number;
        };
    }>;
    merchantRelated(query: AdminListTicketsDto): Promise<{
        success: boolean;
        data: {
            items: any;
            total: any;
            page: number;
            limit: number;
        };
    }>;
    riderRelated(query: AdminListTicketsDto): Promise<{
        success: boolean;
        data: {
            items: any;
            total: any;
            page: number;
            limit: number;
        };
    }>;
    refundRelated(query: AdminListTicketsDto): Promise<{
        success: boolean;
        data: {
            items: any;
            total: any;
            page: number;
            limit: number;
        };
    }>;
    detail(id: string): Promise<{
        success: boolean;
        data: {
            ticket: any;
            customerTimeline: {
                events: any[];
            };
        };
    }>;
    reply(user: RequestUser, id: string, dto: ReplyTicketDto): Promise<{
        success: boolean;
        data: any;
    }>;
    resolve(user: RequestUser, id: string, dto: ResolveTicketDto): Promise<{
        success: boolean;
        data: {
            ticketId: string;
            status: any;
        };
    }>;
    knowledge(query: KnowledgeSearchDto): Promise<{
        success: boolean;
        data: any;
    }>;
}
