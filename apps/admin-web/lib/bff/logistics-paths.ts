/** Backend API paths proxied by admin-web BFF logistics routes. */
export const ADMIN_LOGISTICS_DASHBOARD_PATH = '/admin/logistics/dashboard';
export const ADMIN_LOGISTICS_HEALTH_CHECK_PATH = '/admin/logistics/health-check';
export const ADMIN_LOGISTICS_WEBHOOKS_RECENT_PATH = '/admin/logistics/webhooks/recent';

export function adminShipmentRetryPath(shipmentId: string) {
  return `/admin/logistics/shipments/${shipmentId}/retry`;
}
