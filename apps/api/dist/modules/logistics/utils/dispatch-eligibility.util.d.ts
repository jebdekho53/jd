import { OrderStatus } from '@prisma/client';
import { OrderVertical } from '@prisma/client';
export declare const GROCERY_DISPATCH_AT_PLACED_STATUSES: ReadonlySet<OrderStatus>;
export declare const FOOD_DISPATCH_STATUSES: ReadonlySet<OrderStatus>;
export declare function isDispatchEligibleOrderStatus(status: OrderStatus, orderVertical?: OrderVertical): boolean;
