import { PrismaService } from '../../database/prisma.service';
import { ListAdminUsersDto } from './dto/list-admin-users.dto';
export declare class AdminUserService {
    private readonly prisma;
    constructor(prisma: PrismaService);
    listUsers(dto: ListAdminUsersDto): Promise<{
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
    }>;
    suspendUser(id: string): Promise<{
        id: string;
        phone: string;
        email: string | null;
        status: import("@prisma/client").$Enums.UserStatus;
        roles: import("@prisma/client").$Enums.RoleName[];
        createdAt: Date;
        lastLoginAt: Date | null;
    }>;
    deleteUser(id: string): Promise<{
        id: string;
        status: import("@prisma/client").$Enums.UserStatus;
        createdAt: Date;
        email: string | null;
        phone: string;
        passwordHash: string | null;
        phoneVerified: boolean;
        emailVerified: boolean;
        lastLoginAt: Date | null;
        updatedAt: Date;
        deletedAt: Date | null;
    }>;
}
