import { RequestUser } from '../../common/types/index';
import { RiderAssignmentService } from '../rider-assignment/rider-assignment.service';
import { AssignRiderDto } from './dto/assign-rider.dto';
export declare class AdminRiderController {
    private readonly assignmentService;
    constructor(assignmentService: RiderAssignmentService);
    getRiderQueue(page?: number, limit?: number): Promise<{
        success: boolean;
        data: {
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
    }>;
    listAvailableRiders(storeId: string): Promise<{
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
    assignRider(user: RequestUser, orderId: string, dto: AssignRiderDto, ip: string): Promise<{
        success: boolean;
        data: {
            deliveryId: string;
            riderProfileId: string;
        };
    }>;
    reassignRider(user: RequestUser, orderId: string, dto: AssignRiderDto, ip: string): Promise<{
        success: boolean;
        data: {
            deliveryId: string;
            riderProfileId: string;
        };
    }>;
    autoAssign(user: RequestUser, orderId: string): Promise<{
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
