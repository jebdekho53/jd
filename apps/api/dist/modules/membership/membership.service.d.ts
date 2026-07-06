import { PrismaService } from '../../database/prisma.service';
export declare class MembershipService {
    private readonly prisma;
    constructor(prisma: PrismaService);
    listPlans(): Promise<any>;
    getActiveSubscription(userId: string): Promise<any>;
    subscribe(userId: string, planId: string, yearly?: boolean): Promise<any>;
    cancel(userId: string): Promise<any>;
    renewExpiring(): Promise<any>;
}
