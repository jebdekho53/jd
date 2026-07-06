import { PrismaService } from '../../database/prisma.service';
import { ListAdminUsersDto } from './dto/list-admin-users.dto';
export declare class AdminUserService {
    private readonly prisma;
    constructor(prisma: PrismaService);
    listUsers(dto: ListAdminUsersDto): Promise<{
        data: any;
        meta: {
            page: number;
            limit: number;
            total: any;
            totalPages: number;
        };
    }>;
    suspendUser(id: string): Promise<any>;
    deleteUser(id: string): Promise<any>;
}
