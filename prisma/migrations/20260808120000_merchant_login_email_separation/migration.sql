-- Separate merchant business login credential from the user's personal
-- (buyer-facing) email/password. Previously merchant onboarding wrote the
-- owner's business email/password directly into users.email/password_hash,
-- which then surfaced as the same account's personal buyer-profile email if
-- the same phone number was later used to log into the buyer app.
ALTER TABLE "users" ADD COLUMN "merchant_login_email" TEXT;
ALTER TABLE "users" ADD COLUMN "merchant_login_email_verified" BOOLEAN NOT NULL DEFAULT false;
ALTER TABLE "users" ADD COLUMN "merchant_login_password_hash" TEXT;

CREATE UNIQUE INDEX "users_merchant_login_email_key" ON "users"("merchant_login_email");
