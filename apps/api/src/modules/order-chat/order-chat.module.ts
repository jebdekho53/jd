import { Module } from '@nestjs/common';
import { OrderChatService } from './order-chat.service';
import { BuyerOrderChatController } from './buyer-order-chat.controller';
import { RiderOrderChatController } from './rider-order-chat.controller';

@Module({
  controllers: [BuyerOrderChatController, RiderOrderChatController],
  providers: [OrderChatService],
})
export class OrderChatModule {}
