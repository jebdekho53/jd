import { AdminUserService } from './admin-user.service';
import { ListAdminUsersDto } from './dto/list-admin-users.dto';
import { SuspendAdminUserDto } from './dto/suspend-admin-user.dto';
export declare class AdminUserController {
    private readonly users;
    constructor(users: AdminUserService);
    list(dto: ListAdminUsersDto): Promise<{
        data: any;
        meta: {
            page: number;
            limit: number;
            total: any;
            totalPages: number;
        };
        success: boolean;
    }>;
    suspend(id: string, _dto: SuspendAdminUserDto): Promise<{
        success: boolean;
        data: any;
    }>;
    deleteUser(id: string): Promise<{
        success: boolean;
        message: string;
    }>;
}
