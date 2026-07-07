import { AdminUserService } from './admin-user.service';
import { ListAdminUsersDto } from './dto/list-admin-users.dto';
import { SuspendAdminUserDto } from './dto/suspend-admin-user.dto';
export declare class AdminUserController {
    private readonly users;
    constructor(users: AdminUserService);
    list(dto: ListAdminUsersDto): Promise<{
        data: {
            id: string;
            phone: string;
            email: string | null;
            status: import("@prisma/client").$Enums.UserStatus;
            roles: import("@prisma/client").$Enums.RoleName[];
            createdAt: Date;
            lastLoginAt: Date | null;
        }[];
        meta: {
            page: number;
            limit: number;
            total: number;
            totalPages: number;
        };
        success: boolean;
    }>;
    suspend(id: string, _dto: SuspendAdminUserDto): Promise<{
        success: boolean;
        data: {
            id: string;
            phone: string;
            email: string | null;
            status: import("@prisma/client").$Enums.UserStatus;
            roles: import("@prisma/client").$Enums.RoleName[];
            createdAt: Date;
            lastLoginAt: Date | null;
        };
    }>;
    deleteUser(id: string): Promise<{
        success: boolean;
        message: string;
    }>;
}
