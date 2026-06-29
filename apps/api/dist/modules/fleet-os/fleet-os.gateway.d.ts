import { Server, Socket } from 'socket.io';
export declare class FleetOsGateway {
    private readonly logger;
    server: Server;
    handleSubscribe(client: Socket, data: {
        role?: string;
        id?: string;
    }): {
        subscribed: string;
    };
    onClusterUpdated(payload: Record<string, unknown>): void;
    onBatchCreated(payload: Record<string, unknown>): void;
    onBatchUpdated(payload: Record<string, unknown>): void;
    onAlertCreated(payload: Record<string, unknown>): void;
    onRouteOptimized(payload: Record<string, unknown>): void;
    private emit;
}
