export const ROLES_KEY = 'roles';
export const PERMISSIONS_KEY = 'permissions';
export const IS_PUBLIC_KEY = 'isPublic';
export const AUDIT_ACTION_KEY = 'auditAction';

export const INDIAN_PHONE_REGEX = /^\+91[6-9]\d{9}$/;
export const PHONE_E164_REGEX = /^\+[1-9]\d{6,14}$/;

export const MAX_DEVICES_PER_USER = 10;

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
