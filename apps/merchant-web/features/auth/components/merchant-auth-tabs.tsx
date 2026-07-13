'use client';

import { useState } from 'react';
import { isPhoneOtpEnabled } from '@jebdekho/web-config';
import type { VerifyOtpResult } from '@/types/auth';
import { AuthTabs } from './auth-tabs';
import { MerchantOtpFlow } from './merchant-otp-flow';
import { MerchantEmailAuth } from './merchant-email-auth';

type Method = 'mobile' | 'email';

/**
 * Merchant auth with both methods side by side:
 *  - Mobile → WhatsApp OTP
 *  - Email  → email + password
 *
 * Login defaults to Email; signup defaults to Mobile (OTP is the fastest way to
 * create an account). The Mobile tab is disabled when phone OTP is off.
 */
export function MerchantAuthTabs({
  mode,
  onVerified,
  defaultEmail,
  onAccountExists,
}: {
  mode: 'login' | 'signup';
  onVerified: (result: VerifyOtpResult) => void | Promise<void>;
  defaultEmail?: string;
  onAccountExists?: (email: string) => void;
}) {
  const phoneOtpEnabled = isPhoneOtpEnabled();
  const [method, setMethod] = useState<Method>(
    mode === 'signup' && phoneOtpEnabled ? 'mobile' : 'email',
  );

  return (
    <div>
      <AuthTabs<Method>
        active={method}
        onChange={setMethod}
        tabs={[
          {
            id: 'mobile',
            label: 'Mobile OTP',
            disabled: !phoneOtpEnabled,
            badge: phoneOtpEnabled ? undefined : 'Soon',
          },
          { id: 'email', label: 'Email & password' },
        ]}
      />

      {method === 'mobile' ? (
        <MerchantOtpFlow
          phoneOnly
          heading={mode === 'signup' ? 'Create your account with OTP' : 'Sign in with OTP'}
          submitLabel={mode === 'signup' ? 'Verify & Continue' : 'Verify & Sign in'}
          onVerified={onVerified}
        />
      ) : (
        <MerchantEmailAuth
          mode={mode}
          submitLabel={mode === 'signup' ? 'Create Account & Continue' : 'Verify & Sign in'}
          defaultEmail={defaultEmail}
          onSuccess={onVerified}
          onAccountExists={onAccountExists}
        />
      )}
    </div>
  );
}
