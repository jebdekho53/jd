/** Push notification categories — FCM wiring comes later. */
export enum PwaNotificationType {
  ORDER_UPDATE = 'ORDER_UPDATE',
  OFFER = 'OFFER',
  FLASH_SALE = 'FLASH_SALE',
  PRICE_DROP = 'PRICE_DROP',
  MEMBERSHIP = 'MEMBERSHIP',
  WALLET = 'WALLET',
  DELIVERY = 'DELIVERY',
  STORE_UPDATE = 'STORE_UPDATE',
  SUPPORT = 'SUPPORT',
  REFERRAL = 'REFERRAL',
}

export interface PwaNotificationPayload {
  type: PwaNotificationType;
  title: string;
  body: string;
  icon?: string;
  badge?: string;
  tag?: string;
  data?: Record<string, string>;
  url?: string;
}
