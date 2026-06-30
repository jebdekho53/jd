import { Injectable, NotFoundException } from '@nestjs/common';
import { Prisma, UserStatus } from '@prisma/client';
import { PrismaService } from '../../database/prisma.service';
import { ListAdminUsersDto } from './dto/list-admin-users.dto';

@Injectable()
export class AdminUserService {
  constructor(private readonly prisma: PrismaService) {}

  async listUsers(dto: ListAdminUsersDto) {
    const page = dto.page ?? 1;
    const limit = Math.min(dto.limit ?? 50, 100);
    const skip = (page - 1) * limit;

    const where: Prisma.UserWhereInput = {
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

  async suspendUser(id: string) {
    const user = await this.prisma.user.findUnique({ where: { id } });
    if (!user || user.deletedAt) throw new NotFoundException('User not found');

    return this.prisma.user.update({
      where: { id },
      data: { status: UserStatus.SUSPENDED },
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
}
