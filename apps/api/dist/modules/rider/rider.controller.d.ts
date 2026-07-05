import { RequestUser } from '../../common/types/index';
import { DeliveryService } from './delivery.service';
import { RiderLocationService } from './rider-location.service';
import { RiderAssignmentService } from '../rider-assignment/rider-assignment.service';
import { PrismaService } from '../../database/prisma.service';
import { UpdateRiderLocationDto } from './dto/update-rider-location.dto';
import { UpdateRiderStatusDto } from './dto/update-rider-status.dto';
import { FailDeliveryDto } from './dto/fail-delivery.dto';
export declare class RiderController {
    private readonly deliveryService;
    private readonly locationService;
    private readonly assignmentService;
    private readonly prisma;
    constructor(deliveryService: DeliveryService, locationService: RiderLocationService, assignmentService: RiderAssignmentService, prisma: PrismaService);
    updateStatus(user: RequestUser, dto: UpdateRiderStatusDto): Promise<{
        success: boolean;
        data: {
            status: import("@prisma/client").$Enums.RiderStatus;
        };
    }>;
    updateLocation(user: RequestUser, dto: UpdateRiderLocationDto): Promise<{
        success: boolean;
        data: {
            latitude: number;
            longitude: number;
        };
    }>;
    listOrders(user: RequestUser): Promise<{
        success: boolean;
        data: ({
            order: {
                store: {
                    id: string;
                    name: string;
                    phone: string | null;
                    latitude: number;
                    longitude: number;
                };
                id: string;
                status: import("@prisma/client").$Enums.OrderStatus;
                deliveryAddress: import("@prisma/client/runtime/library").JsonValue;
                paymentMethod: import("@prisma/client").$Enums.PaymentMethod;
                orderNumber: string;
                totalAmount: import("@prisma/client/runtime/library").Decimal;
                buyerNote: string | null;
            };
        } & {
            id: string;
            status: import("@prisma/client").$Enums.DeliveryStatus;
            createdAt: Date;
            updatedAt: Date;
            assignedAt: Date | null;
            assignedBy: string | null;
            deliveryLat: number;
            deliveryLng: number;
            orderId: string;
            riderProfileId: string | null;
            fulfillmentStoreId: string | null;
            pickupLat: number;
            pickupLng: number;
            distanceKm: number | null;
            estimatedMins: number | null;
            estimatedArrivalAt: Date | null;
            arrivedAtStoreAt: Date | null;
            pickedUpAt: Date | null;
            arrivedAtCustomerAt: Date | null;
            deliveredAt: Date | null;
            deliveryProofUrl: string | null;
            riderEarning: import("@prisma/client/runtime/library").Decimal | null;
        })[];
    }>;
    getOrder(user: RequestUser, orderId: string): Promise<{
        success: boolean;
        data: {
            order: {
                store: {
                    id: string;
                    name: string;
                    phone: string | null;
                    latitude: number;
                    longitude: number;
                };
                id: string;
                status: import("@prisma/client").$Enums.OrderStatus;
                items: {
                    productName: string;
                    variantName: string;
                    quantity: number;
                }[];
                deliveryAddress: import("@prisma/client/runtime/library").JsonValue;
                paymentMethod: import("@prisma/client").$Enums.PaymentMethod;
                deliveryLat: number;
                deliveryLng: number;
                orderNumber: string;
                totalAmount: import("@prisma/client/runtime/library").Decimal;
                buyerNote: string | null;
            };
            assignments: {
                id: string;
                status: import("@prisma/client").$Enums.AssignmentStatus;
                expiresAt: Date;
                assignedBy: string | null;
                riderProfileId: string;
                deliveryId: string;
                offeredAt: Date;
                respondedAt: Date | null;
            }[];
        } & {
            id: string;
            status: import("@prisma/client").$Enums.DeliveryStatus;
            createdAt: Date;
            updatedAt: Date;
            assignedAt: Date | null;
            assignedBy: string | null;
            deliveryLat: number;
            deliveryLng: number;
            orderId: string;
            riderProfileId: string | null;
            fulfillmentStoreId: string | null;
            pickupLat: number;
            pickupLng: number;
            distanceKm: number | null;
            estimatedMins: number | null;
            estimatedArrivalAt: Date | null;
            arrivedAtStoreAt: Date | null;
            pickedUpAt: Date | null;
            arrivedAtCustomerAt: Date | null;
            deliveredAt: Date | null;
            deliveryProofUrl: string | null;
            riderEarning: import("@prisma/client/runtime/library").Decimal | null;
        };
    }>;
    acceptDelivery(user: RequestUser, orderId: string, ip: string): Promise<{
        success: boolean;
        data: {
            deliveryId: string;
            status: "ACCEPTED";
        };
    }>;
    rejectDelivery(user: RequestUser, orderId: string): Promise<{
        success: boolean;
    }>;
    arrivedAtStore(user: RequestUser, orderId: string, ip: string): Promise<{
        success: boolean;
        data: {
            deliveryId: string;
            status: "ARRIVED_AT_STORE";
        };
    }>;
    pickedUp(user: RequestUser, orderId: string, ip: string): Promise<{
        success: boolean;
        data: {
            deliveryId: string;
            status: "PICKED_UP";
        };
    }>;
    arrivedAtCustomer(user: RequestUser, orderId: string, ip: string): Promise<{
        success: boolean;
        data: {
            deliveryId: string;
            status: "ARRIVED_AT_CUSTOMER";
        };
    }>;
    markDelivered(user: RequestUser, orderId: string, ip: string): Promise<{
        success: boolean;
        data: {
            deliveryId: string;
            status: "DELIVERED";
        };
    }>;
    markFailed(user: RequestUser, orderId: string, dto: FailDeliveryDto, ip: string): Promise<{
        success: boolean;
        data: {
            deliveryId: string;
            status: "FAILED";
        };
    }>;
}
