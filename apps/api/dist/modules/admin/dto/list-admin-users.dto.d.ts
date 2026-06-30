import { RoleName } from '@prisma/client';
export declare class ListAdminUsersDto {
    search?: string;
    role?: RoleName;
    page?: number;
    limit?: number;
}
