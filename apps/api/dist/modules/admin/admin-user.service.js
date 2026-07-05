"use strict";
var __decorate = (this && this.__decorate) || function (decorators, target, key, desc) {
    var c = arguments.length, r = c < 3 ? target : desc === null ? desc = Object.getOwnPropertyDescriptor(target, key) : desc, d;
    if (typeof Reflect === "object" && typeof Reflect.decorate === "function") r = Reflect.decorate(decorators, target, key, desc);
    else for (var i = decorators.length - 1; i >= 0; i--) if (d = decorators[i]) r = (c < 3 ? d(r) : c > 3 ? d(target, key, r) : d(target, key)) || r;
    return c > 3 && r && Object.defineProperty(target, key, r), r;
};
var __metadata = (this && this.__metadata) || function (k, v) {
    if (typeof Reflect === "object" && typeof Reflect.metadata === "function") return Reflect.metadata(k, v);
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.AdminUserService = void 0;
const common_1 = require("@nestjs/common");
const client_1 = require("@prisma/client");
const prisma_service_1 = require("../../database/prisma.service");
let AdminUserService = class AdminUserService {
    constructor(prisma) {
        this.prisma = prisma;
    }
    async listUsers(dto) {
        const page = dto.page ?? 1;
        const limit = Math.min(dto.limit ?? 50, 100);
        const skip = (page - 1) * limit;
        const where = {
            deletedAt: null,
            ...(dto.role ? { roles: { some: { role: { name: dto.role } } } } : {}),
            ...(dto.search
                ? {
                    OR: [
                        { email: { contains: dto.search, mode: 'insensitive' } },
                        { phone: { contains: dto.search } },
                    ],
                }
                : {}),
        };
        const [users, total] = await Promise.all([
            this.prisma.user.findMany({
                where,
                include: { roles: { include: { role: true } } },
                orderBy: { createdAt: 'desc' },
                skip,
                take: limit,
            }),
            this.prisma.user.count({ where }),
        ]);
        return {
            data: users.map((user) => ({
                id: user.id,
                phone: user.phone,
                email: user.email,
                status: user.status,
                roles: user.roles.map((item) => item.role.name),
                createdAt: user.createdAt,
                lastLoginAt: user.lastLoginAt,
            })),
            meta: {
                page,
                limit,
                total,
                totalPages: Math.ceil(total / limit),
            },
        };
    }
    async suspendUser(id) {
        const user = await this.prisma.user.findUnique({ where: { id } });
        if (!user || user.deletedAt)
            throw new common_1.NotFoundException('User not found');
        return this.prisma.user.update({
            where: { id },
            data: { status: client_1.UserStatus.SUSPENDED },
            include: { roles: { include: { role: true } } },
        }).then((updated) => ({
            id: updated.id,
            phone: updated.phone,
            email: updated.email,
            status: updated.status,
            roles: updated.roles.map((item) => item.role.name),
            createdAt: updated.createdAt,
            lastLoginAt: updated.lastLoginAt,
        }));
    }
    async deleteUser(id) {
        const user = await this.prisma.user.findUnique({ where: { id } });
        if (!user || user.deletedAt)
            throw new common_1.NotFoundException('User not found');
        return this.prisma.user.update({
            where: { id },
            data: { status: client_1.UserStatus.DELETED, deletedAt: new Date() },
        });
    }
};
exports.AdminUserService = AdminUserService;
exports.AdminUserService = AdminUserService = __decorate([
    (0, common_1.Injectable)(),
    __metadata("design:paramtypes", [prisma_service_1.PrismaService])
], AdminUserService);
//# sourceMappingURL=admin-user.service.js.map