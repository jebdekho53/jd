// Delivery statuses during which the merchant still needs to show the handover code.
export const PICKUP_VISIBLE_STATUSES = new Set(['ASSIGNED', 'ACCEPTED', 'ARRIVED_AT_STORE']);

/** Whether the pickup OTP banner should attempt to fetch, given delivery status. */
export function isPickupOtpVisible(deliveryStatus: string): boolean {
  return PICKUP_VISIBLE_STATUSES.has(deliveryStatus);
}
