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
        data: any;
    }>;
    articles(q?: string, category?: string): Promise<{
        success: boolean;
        data: any;
    }>;
    list(user: RequestUser, query: ListTicketsQueryDto): Promise<{
        success: boolean;
        data: {
            items: any;
            total: any;
            page: number;
            limit: number;
        };
    }>;
    create(user: RequestUser, dto: CreateTicketDto): Promise<{
        success: boolean;
        data: any;
    }>;
    detail(user: RequestUser, id: string): Promise<{
        success: boolean;
        data: any;
    }>;
    reply(user: RequestUser, id: string, dto: ReplyTicketDto): Promise<{
        success: boolean;
        data: any;
    }>;
    feedback(user: RequestUser, id: string, dto: FeedbackDto): Promise<{
        success: boolean;
        data: any;
    }>;
}
