import { ForbiddenException, Injectable } from '@nestjs/common';
import { PrismaService } from '../../database/prisma.service';
import type { RequestUser } from '../types';
import type { RoomScope } from './ws-rooms';

const ADMIN_ROLES = ['ADMIN', 'SUPER_ADMIN'];

/**
 * Authorizes Socket.IO room subscriptions. Mirrors the REST ownership rules —
 * a socket must never be able to observe data its owner could not fetch over
 * HTTP.
 *
 * Admins bypass ownership checks but still have to hold an admin role; every
 * other scope resolves the caller's profile and proves the resource belongs to
 * them.
 */
@Injectable()
export class WsRoomAccessService {
  constructor(private readonly prisma: PrismaService) {}

  isAdmin(user: RequestUser): boolean {
    return ADMIN_ROLES.some((r) => user.roles.includes(r));
  }

  /** Throws ForbiddenException unless `user` may join `scope`. */
  async assertCanJoin(user: RequestUser, scope: RoomScope): Promise<void> {
    switch (scope.type) {
      case 'admin-fleet':
      case 'fleet-ops':
      case 'control-room':
      case 'whatsapp-inbox':
        if (!this.isAdmin(user)) throw new ForbiddenException('Admin role required');
        return;

      case 'product':
        // Stock levels are already public on the storefront; any authenticated
        // session may watch them.
        return;

      case 'order':
        return this.assertOrderAccess(user, scope.id);

      case 'store':
        return this.assertStoreAccess(user, scope.id);

      case 'rider':
        return this.assertRiderAccess(user, scope.id);

      case 'buyer':
        return this.assertBuyerAccess(user, scope.id);

      default: {
        const exhaustive: never = scope;
        throw new ForbiddenException(`Unknown room scope ${JSON.stringify(exhaustive)}`);
      }
    }
  }

  /** A buyer who owns it, a merchant who fulfils it, its rider, or an admin. */
  private async assertOrderAccess(user: RequestUser, orderId: string): Promise<void> {
    if (this.isAdmin(user)) {
      const exists = await this.prisma.order.findUnique({
        where: { id: orderId },
        select: { id: true },
      });
      if (!exists) throw new ForbiddenException('Order not found');
      return;
    }

    const order = await this.prisma.order.findUnique({
      where: { id: orderId },
      select: {
        id: true,
        buyerProfile: { select: { userId: true } },
        store: { select: { merchantProfile: { select: { userId: true } } } },
        delivery: { select: { riderProfile: { select: { userId: true } } } },
      },
    });
    if (!order) throw new ForbiddenException('Order access denied');

    const permitted =
      order.buyerProfile?.userId === user.id ||
      order.store?.merchantProfile?.userId === user.id ||
      order.delivery?.riderProfile?.userId === user.id;

    if (!permitted) throw new ForbiddenException('Order access denied');
  }

  private async assertStoreAccess(user: RequestUser, storeId: string): Promise<void> {
    if (this.isAdmin(user)) return;

    const store = await this.prisma.store.findFirst({
      where: { id: storeId, merchantProfile: { userId: user.id } },
      select: { id: true },
    });
    if (!store) throw new ForbiddenException('Store access denied');
  }

  private async assertRiderAccess(user: RequestUser, riderProfileId: string): Promise<void> {
    if (this.isAdmin(user)) return;

    const rider = await this.prisma.riderProfile.findFirst({
      where: { id: riderProfileId, userId: user.id },
      select: { id: true },
    });
    if (!rider) throw new ForbiddenException('Rider access denied');
  }

  private async assertBuyerAccess(user: RequestUser, buyerProfileId: string): Promise<void> {
    if (this.isAdmin(user)) return;

    const buyer = await this.prisma.buyerProfile.findFirst({
      where: { id: buyerProfileId, userId: user.id },
      select: { id: true },
    });
    if (!buyer) throw new ForbiddenException('Buyer access denied');
  }
}
