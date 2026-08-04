export const ROLES_KEY = 'roles';
export const PERMISSIONS_KEY = 'permissions';
export const IS_PUBLIC_KEY = 'isPublic';
export const AUDIT_ACTION_KEY = 'auditAction';

export const INDIAN_PHONE_REGEX = /^\+91[6-9]\d{9}$/;
export const PHONE_E164_REGEX = /^\+[1-9]\d{6,14}$/;

export const MAX_DEVICES_PER_USER = 10;

// Cash-on-delivery is temporarily disabled platform-wide (2026-08-04) — the
// active 3PL provider (Borzo) doesn't have COD enabled on its account yet, so
// a COD order would get accepted but its shipment dispatch would fail. Flip
// back to true once Borzo COD is confirmed working end-to-end.
export const COD_CHECKOUT_ENABLED = false;
export const COD_UNAVAILABLE_MESSAGE =
  'Cash on delivery is not available in your location right now — please pay online.';

export enum ApiTags {
  AUTH = 'auth',
  BUYERS = 'buyers',
  MERCHANTS = 'merchants',
  STORES = 'stores',
  PRODUCTS = 'products',
  ORDERS = 'orders',
  RIDERS = 'riders',
  ADMIN = 'admin',
  HEALTH = 'health',
}
