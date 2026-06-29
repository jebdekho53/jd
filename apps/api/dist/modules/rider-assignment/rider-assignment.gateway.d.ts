import { Server, Socket } from 'socket.io';
export declare class RiderAssignmentGateway {
    private readonly logger;
    server: Server;
    onAssigned(payload: {
        orderId: string;
        riderProfileId: string;
    }): void;
    onReassigned(payload: {
        orderId: string;
        riderProfileId: string;
    }): void;
    onUnassigned(payload: {
        orderId: string;
    }): void;
    onLocationUpdated(payload: {
        riderProfileId: string;
        lat: number;
        lng: number;
    }): void;
    handleSubscribe(client: Socket, data: {
        role: string;
        id: string;
    }): {
        subscribed: string;
    };
    private broadcast;
}
