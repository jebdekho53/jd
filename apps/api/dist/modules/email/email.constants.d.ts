export declare const EMAIL_COLORS: {
    readonly primary: "#16A34A";
    readonly secondary: "#0F172A";
    readonly muted: "#64748B";
    readonly background: "#F8FAFC";
    readonly white: "#FFFFFF";
};
export declare const EMAIL_LOGO_URL = "https://jebdekho.com/logo.png";
export declare const EMAIL_TEMPLATE: {
    readonly OTP: "otp";
    readonly WELCOME: "welcome";
    readonly ORDER_CONFIRMATION: "order_confirmation";
    readonly ORDER_DELIVERED: "order_delivered";
    readonly PASSWORD_RESET: "password_reset";
    readonly SUPPORT_TICKET: "support_ticket";
    readonly REFUND: "refund";
    readonly GST_INVOICE: "gst_invoice";
    readonly TEST: "test";
    readonly ADMIN_WELCOME: "admin_welcome";
    readonly ADMIN_PASSWORD_RESET: "admin_password_reset";
    readonly ADMIN_SECURITY_ALERT: "admin_security_alert";
    readonly ADMIN_NEW_DEVICE: "admin_new_device";
    readonly MERCHANT_APPROVED: "merchant_approved";
    readonly MERCHANT_REJECTED: "merchant_rejected";
};
export type EmailTemplateCode = (typeof EMAIL_TEMPLATE)[keyof typeof EMAIL_TEMPLATE];
