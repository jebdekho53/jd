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
            status: RiderStatus;
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
        data: any;
    }>;
    getOrder(user: RequestUser, orderId: string): Promise<{
        success: boolean;
        data: any;
    }>;
    acceptDelivery(user: RequestUser, orderId: string, ip: string): Promise<{
        success: boolean;
        data: {
            deliveryId: any;
            status: any;
        };
    }>;
    rejectDelivery(user: RequestUser, orderId: string): Promise<{
        success: boolean;
    }>;
    arrivedAtStore(user: RequestUser, orderId: string, ip: string): Promise<{
        success: boolean;
        data: {
            deliveryId: any;
            status: any;
        };
    }>;
    pickedUp(user: RequestUser, orderId: string, ip: string): Promise<{
        success: boolean;
        data: {
            deliveryId: any;
            status: any;
        };
    }>;
    arrivedAtCustomer(user: RequestUser, orderId: string, ip: string): Promise<{
        success: boolean;
        data: {
            deliveryId: any;
            status: any;
        };
    }>;
    markDelivered(user: RequestUser, orderId: string, ip: string): Promise<{
        success: boolean;
        data: {
            deliveryId: any;
            status: any;
        };
    }>;
    markFailed(user: RequestUser, orderId: string, dto: FailDeliveryDto, ip: string): Promise<{
        success: boolean;
        data: {
            deliveryId: any;
            status: any;
        };
    }>;
}
