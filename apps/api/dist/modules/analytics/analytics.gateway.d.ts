import { OnGatewayConnection } from '@nestjs/websockets';
import { Server, Socket } from 'socket.io';
import { WsAuthService } from '../../common/websocket/ws-auth.service';
import type { RequestUser } from '../../common/types';
import { AnalyticsService } from './analytics.service';
export declare const ANALYTICS_EVENTS: {
    readonly CONTROL_ROOM_UPDATED: "control-room.updated";
};
interface AuthenticatedSocket extends Socket {
    data: Socket['data'] & {
        user?: RequestUser;
    };
}
export declare class AnalyticsGateway implements OnGatewayConnection {
    private readonly analytics;
    private readonly wsAuth;
    private readonly logger;
    constructor(analytics: AnalyticsService, wsAuth: WsAuthService);
    server: Server;
    handleConnection(client: AuthenticatedSocket): void;
    handleSubscribe(client: AuthenticatedSocket): {
        error: string;
        subscribed?: undefined;
    } | {
        subscribed: string;
        error?: undefined;
    };
    onMaterialized(): void;
    pushControlRoom(): Promise<void>;
}
export {};
