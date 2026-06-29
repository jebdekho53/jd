import { OrderStatus, OrderVertical } from '@prisma/client';
export declare const GROCERY_MERCHANT_FORWARD: Partial<Record<OrderStatus, OrderStatus>>;
export declare const FOOD_MERCHANT_FORWARD: Partial<Record<OrderStatus, OrderStatus>>;
export declare function merchantForwardMap(vertical: OrderVertical): Partial<Record<OrderStatus, OrderStatus>>;
