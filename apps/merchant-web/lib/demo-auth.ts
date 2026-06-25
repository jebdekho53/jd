/** Development demo merchant credentials — must match API DEV_DEMO_MERCHANT_* env vars */
export const DEMO_MERCHANT_PHONE_DIGITS = '9876543211';
export const DEMO_MERCHANT_PHONE_E164 = `+91${DEMO_MERCHANT_PHONE_DIGITS}`;
export const DEMO_MERCHANT_EMAIL = 'merchant@demo.jebdekho.com';

export const DEMO_MERCHANT_PHONE_2_DIGITS = '9876543213';
export const DEMO_MERCHANT_EMAIL_2 = 'merchant2@demo.jebdekho.com';

export const DEMO_MERCHANT_ACCOUNTS = [
  {
    label: 'Demo Grocery',
    phoneDigits: DEMO_MERCHANT_PHONE_DIGITS,
    email: DEMO_MERCHANT_EMAIL,
  },
  {
    label: 'Demo Electronics',
    phoneDigits: DEMO_MERCHANT_PHONE_2_DIGITS,
    email: DEMO_MERCHANT_EMAIL_2,
  },
] as const;

export const DEMO_OTP = '123456';

export const IS_DEV = process.env.NODE_ENV === 'development';
