import { OnGatewayConnection } from '@nestjs/websockets';
import { Server, Socket } from 'socket.io';
import { WsAuthService } from '../../common/websocket/ws-auth.service';
import type { RequestUser } from '../../common/types';
import { DeliveryTrackingService } from './delivery-tracking.service';
import { type TrackingNamespace } from './delivery-tracking.events';
interface AuthenticatedSocket extends Socket {
    data: Socket['data'] & {
        user?: RequestUser;
    };
}
export declare class DeliveryTrackingGateway implements OnGatewayConnection {
    private readonly wsAuth;
    private readonly tracking;
    private readonly logger;
    constructor(wsAuth: WsAuthService, tracking: DeliveryTrackingService);
    server: Server;
    handleConnection(client: AuthenticatedSocket): void;
    handleSubscribe(client: AuthenticatedSocket, data: {
        namespace: TrackingNamespace;
        id: string;
        orderId?: string;
    }): Promise<{
        error: string;
        subscribed?: undefined;
        orderId?: undefined;
    } | {
        subscribed: string;
        orderId: string | null;
        error?: undefined;
    }>;
    onLocationUpdated(payload: Record<string, unknown>): void;
    onEtaUpdated(payload: Record<string, unknown>): void;
    onStarted(payload: Record<string, unknown>): void;
    onArrived(payload: Record<string, unknown>): void;
    onCompleted(payload: Record<string, unknown>): void;
    onOrderStatus(payload: Record<string, unknown>): void;
    onFleetSnapshot(payload: Record<string, unknown>): void;
    private emitToOrder;
}
export {};
