import { Request } from 'express';
export interface RequestUser {
    id: string;
    phone: string;
    email: string | null;
    roles: string[];
    permissions: string[];
}
export interface AuthenticatedRequest extends Request {
    user: RequestUser;
}
export interface ApiResponse<T = unknown> {
    success: boolean;
    data?: T;
    meta?: PaginationMeta;
    message?: string;
}
export interface PaginationMeta {
    page: number;
    limit: number;
    total: number;
    totalPages: number;
}
export interface PaginationQuery {
    page?: number;
    limit?: number;
    sort?: string;
    order?: 'asc' | 'desc';
}
