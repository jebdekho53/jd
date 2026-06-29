import { OrderStatus, PaymentMethod, PaymentStatus, Prisma } from '@prisma/client';
import type { MerchantStatusGroup } from './order-status-groups';
import type { MerchantPipelineColumn } from './merchant-pipeline.util';
export declare const MERCHANT_HIDDEN_STATUSES: OrderStatus[];
export declare function merchantPaymentVisibilityWhere(): Prisma.OrderWhereInput;
export declare function merchantNewTabWhere(): Prisma.OrderWhereInput;
export declare function merchantAcceptedTabWhere(): Prisma.OrderWhereInput;
export declare function merchantDefaultVisibleWhere(): Prisma.OrderWhereInput;
export declare function buildMerchantListWhere(opts: {
    status?: OrderStatus;
    merchantStatusGroup?: MerchantStatusGroup;
    pipelineColumn?: MerchantPipelineColumn;
}): Prisma.OrderWhereInput;
export declare function isDispatchPaymentCleared(paymentMethod: PaymentMethod, paymentStatus: PaymentStatus): boolean;
