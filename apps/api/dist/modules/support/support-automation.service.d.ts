import { PrismaService } from '../../database/prisma.service';
import { TicketAssignmentService } from './ticket-assignment.service';
import { SupportSlaService } from './support-sla.service';
export declare class SupportAutomationService {
    private readonly prisma;
    private readonly assignment;
    private readonly sla;
    private readonly logger;
    constructor(prisma: PrismaService, assignment: TicketAssignmentService, sla: SupportSlaService);
    autoTagTicket(ticketId: string, categoryCode: string, orderId?: string): Promise<void>;
    escalateOverdueTickets(): Promise<void>;
    autoCloseResolvedTickets(): Promise<void>;
    private bumpPriority;
    private ensureTag;
}
