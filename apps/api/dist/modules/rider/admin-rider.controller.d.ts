import { RequestUser } from '../../common/types/index';
import { RiderAssignmentService } from '../rider-assignment/rider-assignment.service';
import { AssignRiderDto } from './dto/assign-rider.dto';
export declare class AdminRiderController {
    private readonly assignmentService;
    constructor(assignmentService: RiderAssignmentService);
    getRiderQueue(page?: number, limit?: number): Promise<{
        success: boolean;
        data: any;
        meta: {
            page: number;
            limit: number;
            total: any;
            totalPages: number;
        };
    }>;
    listAvailableRiders(storeId: string): Promise<{
        success: boolean;
        data: any;
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
