import { OrderStatus, PaymentMethod } from '@prisma/client';
export declare class ListOrdersDto {
    status?: OrderStatus;
    statusGroup?: 'active' | 'cancelled' | 'completed';
    page?: number;
    limit?: number;
}
export declare class ListMerchantOrdersDto extends ListOrdersDto {
    storeId?: string;
    merchantStatusGroup?: 'active' | 'new' | 'accepted' | 'preparing' | 'packing' | 'ready_for_pickup' | 'rider_assigned' | 'delivered' | 'cancelled';
    pipelineColumn?: string;
    today?: boolean;
    yesterday?: boolean;
    dateFrom?: string;
    dateTo?: string;
    paymentMethod?: PaymentMethod;
    q?: string;
}
declare const ListAdminOrdersDto_base: any;
export declare class ListAdminOrdersDto extends ListAdminOrdersDto_base {
    today?: boolean;
    statusGroup?: 'pending' | 'preparing' | 'ready_for_pickup' | 'assigned' | 'delivered' | 'cancelled';
    storeId?: string;
    merchantId?: string;
    riderId?: string;
    dateFrom?: string;
    dateTo?: string;
    paymentMethod?: PaymentMethod;
    paymentStatus?: 'PENDING' | 'PAID' | 'FAILED' | 'REFUNDED';
}
export {};
