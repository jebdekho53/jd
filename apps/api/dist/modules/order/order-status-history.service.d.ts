import { OrderActorType, OrderStatus, Prisma } from '@prisma/client';
import { PrismaService } from '../../database/prisma.service';
import { OrderCacheService } from './order-cache.service';
export interface OrderStatusTransitionInput {
    orderId: string;
    toStatus: OrderStatus;
    actorType: OrderActorType;
    actorId?: string;
    note?: string;
    metadata?: Prisma.InputJsonValue;
    extraOrderData?: Prisma.OrderUpdateInput;
    skipIfAlreadyStatus?: boolean;
}
export declare class OrderStatusHistoryService {
    private readonly prisma;
    private readonly cache;
    private readonly logger;
    constructor(prisma: PrismaService, cache: OrderCacheService);
    transition(input: OrderStatusTransitionInput): Promise<boolean>;
    appendEntry(input: {
        orderId: string;
        status: OrderStatus;
        actorType: OrderActorType;
        actorId?: string;
        note?: string;
        metadata?: Prisma.InputJsonValue;
    }): Promise<void>;
    recordInitial(orderId: string, status: OrderStatus, actorType: OrderActorType, note: string, actorId?: string, metadata?: Prisma.InputJsonValue): Promise<void>;
}
