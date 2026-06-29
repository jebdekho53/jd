import type { AuthUser } from '@/types/auth';
import type { MerchantApplication } from '@/services/onboarding/onboarding-api';
import { fetchApplication, fetchOnboardingStatus } from '@/services/onboarding/onboarding-api';
import { isPlaceholderPhone } from '@/lib/phone';

function stepDone(app: MerchantApplication, key: string): boolean {
  return app.steps?.find((s) => s.stepKey === key)?.completed ?? false;
}

/** Map saved application data to the visual signup wizard step (1–8). Step 0 is account creation. */
export function inferSignupWizardStep(app: MerchantApplication): number {
  const personalDone = stepDone(app, 'PERSONAL_DETAILS') || Boolean(app.ownerName?.trim());
  const businessDone = stepDone(app, 'BUSINESS_DETAILS') || Boolean(app.businessName?.trim());
  if (!personalDone || !businessDone) return 1;

  if (!stepDone(app, 'STORE_DETAILS')) {
    if (!app.storeName?.trim() || !app.storeLogoUrl || !app.storeBannerUrl) return 2;
    if (!app.storeAddress?.trim() || !app.pincode) return 3;
    if (app.deliveryRadiusKm == null) return 4;
    return 5;
  }

  if (!stepDone(app, 'DOCUMENTS') && (app.documents?.length ?? 0) < 2) return 6;
  if (!stepDone(app, 'BANK_DETAILS') && !app.bankAccount) return 7;

  return 8;
}

export function syncVerifiedIdentityFromUser(user: Pick<AuthUser, 'email' | 'phone'>) {
  const phone = user.phone ?? '';
  const email = user.email ?? '';
  return {
    verifiedEmail: email,
    verifiedPhone: phone,
    needsPhone: isPlaceholderPhone(phone),
    contactPhone: isPlaceholderPhone(phone) ? '' : phone.replace(/\D/g, '').slice(-10),
  };
}

export async function resolveMerchantEntryRoute(user: AuthUser): Promise<{
  path: string;
  toast?: { message: string; tone: 'success' | 'info' };
}> {
  if (user.roles.includes('MERCHANT')) {
    return { path: '/dashboard', toast: { message: 'Signed in successfully!', tone: 'success' } };
  }

  try {
    await fetchApplication();
    const status = await fetchOnboardingStatus();

    if (status.storeStatus === 'APPROVED') {
      return { path: '/dashboard', toast: { message: 'Signed in successfully!', tone: 'success' } };
    }

    if (status.hasApplication && status.status && status.status !== 'DRAFT') {
      return { path: '/onboarding', toast: { message: 'Signed in successfully!', tone: 'success' } };
    }

    return {
      path: '/signup',
      toast: { message: 'Welcome back — continue your merchant application.', tone: 'info' },
    };
  } catch {
    return {
      path: '/signup',
      toast: { message: 'Welcome back — continue your merchant application.', tone: 'info' },
    };
  }
}
