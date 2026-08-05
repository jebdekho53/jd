export interface OrderChatMessage {
  id: string;
  senderType: 'BUYER' | 'RIDER';
  body: string;
  createdAt: string;
}
