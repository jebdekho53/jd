/** Development demo admin credentials — must match API DEV_DEMO_ADMIN_* env vars */
export const DEMO_ADMIN_PHONE_DIGITS = '9876543212';
export const DEMO_ADMIN_PHONE_E164 = `+91${DEMO_ADMIN_PHONE_DIGITS}`;
export const DEMO_OTP = '123456';

export const IS_DEV = process.env.NODE_ENV === 'development';
