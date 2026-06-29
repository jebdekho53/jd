import { OrderService } from './order.service';
import { ListAdminOrdersDto } from './dto/list-orders.dto';
export declare class AdminOrderController {
    private readonly orderService;
    constructor(orderService: OrderService);
    listOrders(dto: ListAdminOrdersDto): Promise<{
        success: boolean;
        data: {
            orders: {
                id: string;
                orderNumber: string;
                status: import("@prisma/client").$Enums.OrderStatus;
                paymentMethod: import("@prisma/client").$Enums.PaymentMethod;
                paymentStatus: import("@prisma/client").$Enums.PaymentStatus;
                totalAmount: number;
                createdAt: Date;
                updatedAt: Date;
                deliveryStatus: import("@prisma/client").$Enums.DeliveryStatus | null;
                store: {
                    id: string;
                    name: string;
                    slug: string;
                    merchant: {
                        id: string;
                        businessName: string;
                    };
                } | null;
                buyer: {
                    id: string;
                    name: string;
                };
                rider: {
                    id: string;
                    name: string;
                } | null;
            }[];
            meta: {
                page: number;
                limit: number;
                total: number;
                totalPages: number;
            };
        };
    }>;
    getOrder(orderId: string): Promise<{
        success: boolean;
        data: {
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
}
