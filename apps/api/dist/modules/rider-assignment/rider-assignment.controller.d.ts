import { RequestUser } from '../../common/types/index';
import { RiderAssignmentService } from './rider-assignment.service';
import { AssignRiderDto } from './dto/assign-rider.dto';
export declare class RiderAssignmentController {
    private readonly assignment;
    constructor(assignment: RiderAssignmentService);
    listUnassigned(page?: number, limit?: number): Promise<{
        orders: {
            totalAmount: number;
            merchant: {
                id: string;
                businessName: string;
            };
            zones: {
                id: string;
                name: string;
            }[];
            availableRiderCount: number;
            needsRider: boolean;
            buyerProfile: {
                name: string;
            };
            store: {
                merchantProfile: {
                    id: string;
                    businessName: string;
                };
                id: string;
                name: string;
                slug: string;
                storeZones: {
                    zone: {
                        id: string;
                        name: string;
                    };
                }[];
            };
            id: string;
            status: import("@prisma/client").$Enums.OrderStatus;
            createdAt: Date;
            paymentMethod: import("@prisma/client").$Enums.PaymentMethod;
            orderNumber: string;
        }[];
        meta: {
            page: number;
            limit: number;
            total: number;
            totalPages: number;
        };
        success: boolean;
    }>;
    listRiders(status?: string): Promise<{
        success: boolean;
        data: {
            id: string;
            name: string;
            phone: string;
            userStatus: import("@prisma/client").$Enums.UserStatus;
            zone: string;
            status: import("@prisma/client").$Enums.RiderStatus;
            kycStatus: import("@prisma/client").$Enums.KycStatus;
            vehicleType: import("@prisma/client").$Enums.VehicleType;
            currentDelivery: {
                orderNumber: string;
                status: import("@prisma/client").$Enums.DeliveryStatus;
            } | null;
            lastLocation: {
                lat: number;
                lng: number;
            } | null;
            lastSeen: Date;
            activeDeliveries: number;
        }[];
    }>;
    metrics(): Promise<{
        success: boolean;
        data: {
            unassignedOrders: number;
            onlineRiders: number;
            busyRiders: number;
            idleRiders: number;
            assignmentSuccessRate: number;
            avgAssignmentTimeMins: number;
            assignmentsToday: number;
        };
    }>;
    availableRiders(storeId: string): Promise<{
        success: boolean;
        data: ({
            id: string;
            name: string;
            status: import("@prisma/client").$Enums.RiderStatus;
            inZone: boolean;
            activeDeliveries: number;
            distanceKm: number;
            currentLat: number | null;
            currentLng: number | null;
            lastLocationAt: Date | null;
            updatedAt: Date;
        } | {
            zones: {
                id: string;
                name: string;
            }[];
            id: string;
            name: string;
            status: import("@prisma/client").$Enums.RiderStatus;
            inZone: boolean;
            activeDeliveries: number;
            distanceKm: number;
            currentLat: number | null;
            currentLng: number | null;
            lastLocationAt: Date | null;
            updatedAt: Date;
        })[];
    }>;
    assign(user: RequestUser, orderId: string, dto: AssignRiderDto, ip: string): Promise<{
        success: boolean;
        data: {
            deliveryId: string;
            riderProfileId: string;
        };
    }>;
    reassign(user: RequestUser, orderId: string, dto: AssignRiderDto, ip: string): Promise<{
        success: boolean;
        data: {
            deliveryId: string;
            riderProfileId: string;
        };
    }>;
    autoAssign(orderId: string): Promise<{
        success: boolean;
        data: null;
        message: string;
    } | {
        success: boolean;
        data: {
            deliveryId: string;
            riderProfileId: string;
        };
        message?: undefined;
    }>;
    unassign(user: RequestUser, orderId: string, ip: string): Promise<{
        success: boolean;
    }>;
}
