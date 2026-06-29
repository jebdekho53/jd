import { OrderStatus, PaymentMethod } from '@prisma/client';
export type MerchantPipelineColumn = 'NEW' | 'ACCEPTED' | 'PREPARING' | 'PACKING' | 'READY_FOR_PICKUP' | 'RIDER_ASSIGNED' | 'OUT_FOR_DELIVERY' | 'DELIVERED' | 'CANCELLED';
export declare const PIPELINE_COLUMN_STATUSES: Record<MerchantPipelineColumn, OrderStatus[]>;
export declare const MERCHANT_LIVE_STATUS_GROUPS: {
    readonly incoming: readonly ["PAID", "MERCHANT_ACCEPTED"];
    readonly preparation: readonly ["PREPARING"];
    readonly packing: readonly ["PACKING"];
    readonly ready: readonly ["READY_FOR_PICKUP"];
    readonly dispatch: readonly ["RIDER_ASSIGNED", "PICKED_UP", "OUT_FOR_DELIVERY"];
};
export declare const MERCHANT_ACTIVE_LIVE_STATUSES: ("RIDER_ASSIGNED" | "PAID" | "MERCHANT_ACCEPTED" | "PREPARING" | "PACKING" | "READY_FOR_PICKUP" | "PICKED_UP" | "OUT_FOR_DELIVERY")[];
export declare function resolvePipelineColumn(status: OrderStatus, paymentMethod?: PaymentMethod): MerchantPipelineColumn;
export declare const SLA_THRESHOLDS: {
    readonly accept: {
        readonly yellow: 5;
        readonly red: 10;
    };
    readonly prepare: {
        readonly yellow: 15;
        readonly red: 25;
    };
    readonly pack: {
        readonly yellow: 8;
        readonly red: 15;
    };
    readonly riderWait: {
        readonly yellow: 10;
        readonly red: 20;
    };
};
export type SlaLevel = 'green' | 'yellow' | 'red';
export declare function slaLevel(elapsedMins: number, yellow: number, red: number): SlaLevel;
export declare function minutesSince(date: Date | string | null | undefined): number;
