import { Logger } from '@nestjs/common';
import { OnEvent } from '@nestjs/event-emitter';
import {
  ConnectedSocket,
  OnGatewayConnection,
  SubscribeMessage,
  WebSocketGateway,
  WebSocketServer,
} from '@nestjs/websockets';
import { Server, Socket } from 'socket.io';
import { WsAuthService } from '../../common/websocket/ws-auth.service';
import { wsGatewayCorsOptions } from '../../common/websocket/ws-cors.util';
import type { RequestUser } from '../../common/types';
import {
  WHATSAPP_INBOX_INTERNAL_EVENTS,
  WHATSAPP_INBOX_WS_EVENTS,
  type WhatsAppMessageReceivedEvent,
  type WhatsAppMessageStatusEvent,
} from './whatsapp-inbox.events';
import { WHATSAPP_INBOX_ROOM as INBOX_ROOM } from '../../common/websocket/ws-rooms';

interface AuthenticatedSocket extends Socket {
  data: Socket['data'] & { user?: RequestUser };
}

/**
 * Pushes inbound WhatsApp messages and delivery-status changes to the admin
 * inbox the moment the Meta webhook persists them, so the UI does not have to
 * poll. Admin-only, same auth as the other gateways.
 */
@WebSocketGateway({ cors: wsGatewayCorsOptions(), namespace: '/whatsapp' })
export class WhatsAppInboxGateway implements OnGatewayConnection {
  private readonly logger = new Logger(WhatsAppInboxGateway.name);

  constructor(private readonly wsAuth: WsAuthService) {}

  @WebSocketServer()
  server!: Server;

  handleConnection(client: AuthenticatedSocket): void {
    const user = this.wsAuth.authenticateSocket(client);
    if (!user || !this.wsAuth.hasAnyRole(user, ['ADMIN', 'SUPER_ADMIN'])) {
      this.logger.warn(`Rejected non-admin WhatsApp inbox socket ${client.id}`);
      client.disconnect(true);
      return;
    }
    client.data.user = user;
  }

  @SubscribeMessage('subscribe')
  handleSubscribe(@ConnectedSocket() client: AuthenticatedSocket) {
    const user = client.data.user;
    if (!user || !this.wsAuth.hasAnyRole(user, ['ADMIN', 'SUPER_ADMIN'])) {
      return { error: 'Admin access required' };
    }

    client.join(INBOX_ROOM);
    return { subscribed: INBOX_ROOM };
  }

  @OnEvent(WHATSAPP_INBOX_INTERNAL_EVENTS.MESSAGE_RECEIVED)
  onMessageReceived(payload: WhatsAppMessageReceivedEvent) {
    this.server.to(INBOX_ROOM).emit(WHATSAPP_INBOX_WS_EVENTS.MESSAGE_RECEIVED, payload);
  }

  @OnEvent(WHATSAPP_INBOX_INTERNAL_EVENTS.MESSAGE_STATUS_UPDATED)
  onMessageStatus(payload: WhatsAppMessageStatusEvent) {
    this.server.to(INBOX_ROOM).emit(WHATSAPP_INBOX_WS_EVENTS.MESSAGE_STATUS_UPDATED, payload);
  }
}
