-- Franchise partners had no support-ticket channel: SupportActorType/SupportTeam
-- only covered BUYER/MERCHANT/RIDER, so a partner with a payout or territory
-- dispute had no way to raise it through the platform's support system at all.
ALTER TYPE "SupportActorType" ADD VALUE IF NOT EXISTS 'FRANCHISE';
ALTER TYPE "SupportTeam" ADD VALUE IF NOT EXISTS 'FRANCHISE_OPS';
