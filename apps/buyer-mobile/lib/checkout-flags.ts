// Cash-on-delivery is temporarily disabled platform-wide (2026-08-04) — the
// active 3PL provider (Borzo) doesn't have COD enabled on its account yet.
// Mirrors COD_CHECKOUT_ENABLED in apps/api/src/common/constants/index.ts and
// apps/buyer-web/lib/checkout-flags.ts — flip all three back to true once
// Borzo COD is confirmed working end-to-end.
export const COD_CHECKOUT_ENABLED = false;
export const COD_UNAVAILABLE_MESSAGE = 'Not available in your location — pay online instead';
