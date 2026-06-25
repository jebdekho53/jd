/** Development demo credentials — must match API DEV_DEMO_* env vars */
export const DEMO_PHONE_DIGITS = '9876543210';
export const DEMO_PHONE_E164 = `+91${DEMO_PHONE_DIGITS}`;
export const DEMO_OTP = '123456';

export const IS_DEV = process.env.NODE_ENV === 'development';
