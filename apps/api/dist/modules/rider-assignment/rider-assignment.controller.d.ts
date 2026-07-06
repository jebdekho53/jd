import { RequestUser } from '../../common/types/index';
import { RiderAssignmentService } from './rider-assignment.service';
import { AssignRiderDto } from './dto/assign-rider.dto';
export declare class RiderAssignmentController {
    private readonly assignment;
    constructor(assignment: RiderAssignmentService);
    listUnassigned(page?: number, limit?: number): Promise<{
        orders: any;
        meta: {
            page: number;
            limit: number;
            total: any;
            totalPages: number;
        };
        success: boolean;
    }>;
    listRiders(status?: string): Promise<{
        success: boolean;
        data: any;
    }>;
    metrics(): Promise<{
        success: boolean;
        data: {
            unassignedOrders: any;
            onlineRiders: any;
            busyRiders: any;
            idleRiders: any;
            assignmentSuccessRate: number;
            avgAssignmentTimeMins: any;
            assignmentsToday: any;
        };
    }>;
    availableRiders(storeId: string): Promise<{
        success: boolean;
        data: any;
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
