-- Franchise applicants now choose a password on the public form, so an approved
-- partner can sign in with email + password (the portal's password login resolves
-- the user by email). Stored as an argon2 hash, never plaintext.
--
-- Additive and nullable: existing leads simply carry NULL and approve exactly as
-- before (phone-OTP only).
ALTER TABLE "expansion_leads"
ADD COLUMN IF NOT EXISTS "password_hash" TEXT;
