/** Whether mobile OTP login/signup is enabled in web apps. */
export function isPhoneOtpEnabled(): boolean {
  return process.env.NEXT_PUBLIC_AUTH_PHONE_OTP_ENABLED === 'true';
}

export const AUTH_COPY = {
  mobileOtpComingSoon: 'Mobile OTP coming soon',
  mobileOtpHint: 'Mobile OTP coming soon. Use email to continue.',
  smsVerificationComingSoon:
    'SMS verification will be available after provider approval',
  useEmailToContinue: 'Please use email to continue',
} as const;

export { AUTH_COPY as authCopy };
