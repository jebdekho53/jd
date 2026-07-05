export interface JwtPayload {
    sub: string;
    phone: string;
    email: string | null;
    roles: string[];
    permissions: string[];
    kid?: string;
    authTime?: number;
    amr?: string[];
}
