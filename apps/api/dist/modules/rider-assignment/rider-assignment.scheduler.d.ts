import { RiderAssignmentService } from './rider-assignment.service';
export declare class RiderAssignmentScheduler {
    private readonly assignment;
    private readonly logger;
    constructor(assignment: RiderAssignmentService);
    handleOfferTimeouts(): Promise<void>;
}
