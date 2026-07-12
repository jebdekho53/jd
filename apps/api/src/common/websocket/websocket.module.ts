import { Module } from '@nestjs/common';
import { AuthModule } from '../../modules/auth/auth.module';
import { WsAuthService } from './ws-auth.service';
import { WsRoomAccessService } from './ws-room-access.service';

@Module({
  imports: [AuthModule],
  providers: [WsAuthService, WsRoomAccessService],
  exports: [WsAuthService, WsRoomAccessService],
})
export class WebSocketModule {}
