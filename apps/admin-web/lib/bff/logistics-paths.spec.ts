import {
  ADMIN_LOGISTICS_DASHBOARD_PATH,
  ADMIN_LOGISTICS_HEALTH_CHECK_PATH,
  ADMIN_LOGISTICS_WEBHOOKS_RECENT_PATH,
  adminShipmentRetryPath,
} from './logistics-paths';

describe('admin logistics BFF paths', () => {
  it('exposes dashboard path', () => {
    expect(ADMIN_LOGISTICS_DASHBOARD_PATH).toBe('/admin/logistics/dashboard');
  });

  it('exposes health-check path', () => {
    expect(ADMIN_LOGISTICS_HEALTH_CHECK_PATH).toBe('/admin/logistics/health-check');
  });

  it('exposes webhooks path', () => {
    expect(ADMIN_LOGISTICS_WEBHOOKS_RECENT_PATH).toBe('/admin/logistics/webhooks/recent');
  });

  it('builds shipment retry path', () => {
    expect(adminShipmentRetryPath('ship_xyz')).toBe('/admin/logistics/shipments/ship_xyz/retry');
  });
});
