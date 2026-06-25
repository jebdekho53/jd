import { getConfig } from '../../config/configuration';
import type { ConfigService } from '@nestjs/config';

function normalizePhoneDigits(phone: string): string {
  return phone.replace(/\D/g, '').slice(-10);
}

function normalizeEmail(email: string): string {
  return email.trim().toLowerCase();
}

export function isDemoPhone(
  phone: string,
  cfg: ReturnType<typeof getConfig>,
): boolean {
  if (cfg.nodeEnv === 'production') return false;

  const digits = normalizePhoneDigits(phone);
  const demoDigits = [
    cfg.dev.demoPhone,
    cfg.dev.demoMerchantPhone,
    cfg.dev.demoMerchantPhone2,
    cfg.dev.demoAdminPhone,
    cfg.dev.demoRiderPhone,
  ].map(normalizePhoneDigits);

  return demoDigits.includes(digits);
}

export function isDemoEmail(
  email: string,
  cfg: ReturnType<typeof getConfig>,
): boolean {
  if (cfg.nodeEnv === 'production') return false;

  const normalized = normalizeEmail(email);
  const demoEmails = [
    cfg.dev.demoMerchantEmail,
    cfg.dev.demoMerchantEmail2,
    cfg.dev.demoAdminEmail,
  ]
    .filter(Boolean)
    .map(normalizeEmail);

  return demoEmails.includes(normalized);
}

export function isDemoAuthRequest(
  body: { phone?: string; email?: string } | undefined,
  cfg: ReturnType<typeof getConfig>,
): boolean {
  if (!body || cfg.nodeEnv === 'production') return false;
  if (body.phone && isDemoPhone(body.phone, cfg)) return true;
  if (body.email && isDemoEmail(body.email, cfg)) return true;
  return false;
}

export function getDemoConfig(configService: ConfigService) {
  return getConfig(configService);
}
