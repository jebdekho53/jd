export declare class AdminLoginDto {
    email: string;
    password: string;
    rememberMe?: boolean;
    deviceName?: string;
}
export declare class AdminForgotPasswordDto {
    email: string;
}
export declare class AdminResetPasswordDto {
    token: string;
    newPassword: string;
}
export declare class AdminChangePasswordDto {
    currentPassword: string;
    newPassword: string;
}
export declare class UpdateAdminSettingsDto {
    name?: string;
    email?: string;
    phone?: string;
}
export declare class AdminLogoutDto {
    refreshToken?: string;
}
