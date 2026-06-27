/** Backend API paths proxied by merchant-web BFF logistics routes. */
export function merchantShipmentPath(orderId: string) {
  return `/merchant/orders/${orderId}/shipment`;
}

export function merchantShipmentCancelPath(orderId: string) {
  return `${merchantShipmentPath(orderId)}/cancel`;
}

export function merchantShipmentRetryPath(orderId: string) {
  return `${merchantShipmentPath(orderId)}/retry`;
}
