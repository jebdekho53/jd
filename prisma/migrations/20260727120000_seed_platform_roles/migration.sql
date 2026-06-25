-- Platform roles required for buyer signup, merchant onboarding, and admin access.
-- Safe to re-run: uses ON CONFLICT on unique role name.

INSERT INTO "roles" ("id", "name", "description", "created_at")
VALUES
  ('cm_platform_role_buyer', 'BUYER', 'Buyer role', CURRENT_TIMESTAMP),
  ('cm_platform_role_merchant', 'MERCHANT', 'Merchant role', CURRENT_TIMESTAMP),
  ('cm_platform_role_rider', 'RIDER', 'Rider role', CURRENT_TIMESTAMP),
  ('cm_platform_role_admin', 'ADMIN', 'Admin role', CURRENT_TIMESTAMP),
  ('cm_platform_role_super_admin', 'SUPER_ADMIN', 'Super admin role', CURRENT_TIMESTAMP)
ON CONFLICT ("name") DO NOTHING;
