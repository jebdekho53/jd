import { RequestUser } from '../../common/types/index';
import { OrderService } from './order.service';
import { ListMerchantOrdersDto } from './dto/list-orders.dto';
import { CancelOrderDto } from './dto/cancel-order.dto';
import { MarkOrderIssueDto } from './dto/mark-issue.dto';
export declare class MerchantOrderController {
    private readonly orderService;
    constructor(orderService: OrderService);
    listOrders(user: RequestUser, dto: ListMerchantOrdersDto): Promise<{
        success: boolean;
        data: {
            orders: {
                updatedAt: any;
                pipelineColumn: import("./merchant-pipeline.util").MerchantPipelineColumn;
                buyerProfile: {
                    name: any;
                    phone: any;
                } | null;
                rider: {
                    id: any;
                    name: any;
                    phone: any;
                } | null;
                deliveryStatus: any;
                awaitingRider: boolean;
                riderWaitMins: number;
                operations: {
                    orderAgeMins: number;
                    sinceAcceptedMins: number | null;
                    prepSla: import("./merchant-pipeline.util").SlaLevel;
                    riderWaitSla: import("./merchant-pipeline.util").SlaLevel;
                };
                id: any;
                orderNumber: any;
                status: any;
                paymentMethod: any;
                paymentStatus: any;
                totalAmount: number;
                createdAt: any;
                store: any;
                storeId: any;
                items: any;
            }[];
            meta: {
                page: number;
                limit: number;
                total: number;
                totalPages: number;
            };
        };
    }>;
    getOrder(user: RequestUser, orderId: string): Promise<{
        success: boolean;
        data: {
            customer: {
                name: string | null;
                phone: string | null;
                orderCount: number;
                lifetimeSpend: number;
            };
            operations: {
                pipelineColumn: import("./merchant-pipeline.util").MerchantPipelineColumn;
                orderAgeMins: number;
                sinceAcceptedMins: number | null;
                sincePackingMins: number | null;
                awaitingRider: boolean;
                riderWaitMins: number;
                prepSla: import("./merchant-pipeline.util").SlaLevel;
                packSla: import("./merchant-pipeline.util").SlaLevel;
                riderWaitSla: import("./merchant-pipeline.util").SlaLevel;
            };
            fulfillmentBatch: {
                isBatched: boolean;
                batchId: string;
                batchStatus: import("@prisma/client").$Enums.DeliveryBatchStatus;
                sequence: number;
                totalOrders: number;
                label: string;
                orders: string[];
            } | {
                isBatched: boolean;
                label: string;
                batchId?: undefined;
                batchStatus?: undefined;
                sequence?: undefined;
                totalOrders?: undefined;
                orders?: undefined;
            };
            id: any;
            orderNumber: any;
            status: any;
            paymentMethod: any;
            paymentStatus: any;
            subtotal: number;
            discountAmount: number;
            deliveryFee: number;
            taxAmount: number;
            totalAmount: number;
            deliveryAddress: any;
            buyerNote: any;
            cancelReason: any;
            paidAt: any;
            completedAt: any;
            cancelledAt: any;
            createdAt: any;
            updatedAt: any;
            store: {
                id: any;
                name: any;
                slug: any;
                phone: any;
                merchant: {
                    id: any;
                    businessName: any;
                } | null;
            } | null;
            buyerProfile: {
                id: any;
                name: any;
                phone: any;
            } | null;
            items: any;
            statusHistory: any;
            timeline: {
                status: string;
                note: string | null;
                changedBy: string | null;
                actorType?: string;
                metadata?: unknown;
                createdAt: Date;
            }[];
            delivery: {
                id: any;
                status: any;
                distanceKm: number | null;
                estimatedMins: number | null;
                estimatedArrivalAt: any;
                etaAvailable: boolean;
                liveTrackingAvailable: boolean;
                waitingForPickup: boolean;
                assignedAt: any;
                arrivedAtStoreAt: any;
                pickedUpAt: any;
                arrivedAtCustomerAt: any;
                deliveredAt: any;
                rider: {
                    id: any;
                    name: any;
                    phone: any;
                    vehicleType: any;
                    status: any;
                    currentLat: any;
                    currentLng: any;
                    lastLocationAt: any;
                } | null;
                assignmentTimeline: any;
            } | null;
            payment: any;
            canReview: boolean;
            review: {
                id: any;
                rating: any;
                storeExperience: any;
                deliveryExperience: any;
                productQuality: any;
                title: any;
                review: any;
                images: any;
                verifiedPurchase: any;
                merchantReply: any;
                merchantRepliedAt: any;
                createdAt: any;
                updatedAt: any;
            } | null;
        };
    }>;
    confirmOrder(user: RequestUser, orderId: string, ip: string): Promise<{
        success: boolean;
        data: {
            orderId: string;
            status: import("@prisma/client").$Enums.OrderStatus;
        };
    }>;
    markPreparing(user: RequestUser, orderId: string, ip: string): Promise<{
        success: boolean;
        data: {
            orderId: string;
            status: import("@prisma/client").$Enums.OrderStatus;
        };
    }>;
    markPacking(user: RequestUser, orderId: string, ip: string): Promise<{
        success: boolean;
        data: {
            orderId: string;
            status: import("@prisma/client").$Enums.OrderStatus;
        };
    }>;
    markReady(user: RequestUser, orderId: string, ip: string): Promise<{
        success: boolean;
        data: {
            orderId: string;
            status: import("@prisma/client").$Enums.OrderStatus;
        };
    }>;
    cancelOrder(user: RequestUser, orderId: string, dto: CancelOrderDto, ip: string): Promise<{
        success: boolean;
        data: {
            orderId: string;
            status: "CANCELLED_BY_MERCHANT";
        };
    }>;
    markIssue(user: RequestUser, orderId: string, dto: MarkOrderIssueDto, ip: string): Promise<{
        success: boolean;
        data: {
            orderId: string;
            flagged: boolean;
        };
    }>;
}
