import { Injectable, Logger, OnModuleDestroy } from '@nestjs/common';
import { EventEmitter2, OnEvent } from '@nestjs/event-emitter';
import { DomainEventType } from '@prisma/client';
import { PrismaService } from '../../database/prisma.service';
import {
  domainEventChannel,
  type DomainEventBroadcast,
} from '../domain-events/domain-events.service';
import { COMMERCE_EVENTS } from './realtime.events';

/**
 * Stock edits arrive in bursts (bulk CSV imports, a merchant tabbing through a
 * catalogue). Subscribers only ever render the newest number, so a burst is
 * coalesced into one trailing emit per product.
 */
const INVENTORY_COALESCE_MS = 500;

interface InventoryUpdate {
  productId: string;
  variantId: string | null;
  storeId: string;
  stock: number;
  inStock: boolean;
  isLowStock: boolean;
}

/**
 * Translates persisted domain events into WebSocket fan-out events.
 *
 * Producers (checkout, food checkout, payment capture, claim replacement,
 * product inventory) already emit domain events; hanging realtime off that
 * single seam keeps every creation path live without threading a gateway
 * dependency through each service.
 *
 * Domain payloads are inconsistent between producers — the COD path records
 * `{ checkoutId, buyerProfileId, storeId }` while the Razorpay path records
 * `{ orderNumber, storeId }` — so anything the socket clients need is read back
 * from the order row rather than trusted from the payload.
 */
@Injectable()
export class CommerceRealtimeListener implements OnModuleDestroy {
  private readonly logger = new Logger(CommerceRealtimeListener.name);

  /** productId+variantId → newest pending update, flushed on a trailing timer. */
  private readonly pendingInventory = new Map<string, InventoryUpdate>();
  private inventoryTimer: NodeJS.Timeout | null = null;

  constructor(
    private readonly prisma: PrismaService,
    private readonly events: EventEmitter2,
  ) {}

  onModuleDestroy(): void {
    if (this.inventoryTimer) clearTimeout(this.inventoryTimer);
    this.inventoryTimer = null;
    this.pendingInventory.clear();
  }

  @OnEvent(domainEventChannel(DomainEventType.ORDER_CREATED))
  async onOrderCreated(broadcast: DomainEventBroadcast): Promise<void> {
    const orderId = broadcast.aggregateId;

    try {
      const order = await this.prisma.order.findUnique({
        where: { id: orderId },
        select: {
          id: true,
          orderNumber: true,
          storeId: true,
          status: true,
          totalAmount: true,
          createdAt: true,
        },
      });
      if (!order) return;

      this.events.emit(`ws.${COMMERCE_EVENTS.ORDER_CREATED}`, {
        orderId: order.id,
        orderNumber: order.orderNumber,
        storeId: order.storeId,
        status: order.status,
        total: Number(order.totalAmount),
        createdAt: order.createdAt.toISOString(),
      });
    } catch (err) {
      this.logger.warn(`order.created fan-out failed for ${orderId}: ${(err as Error).message}`);
    }
  }

  @OnEvent(domainEventChannel(DomainEventType.INVENTORY_CHANGED))
  onInventoryChanged(broadcast: DomainEventBroadcast): void {
    const payload = broadcast.payload as {
      productId?: string;
      variantId?: string | null;
      storeId?: string;
      newQty?: number;
      isLowStock?: boolean;
    };

    if (!payload?.productId || !payload?.storeId || typeof payload.newQty !== 'number') {
      return;
    }

    const update: InventoryUpdate = {
      productId: payload.productId,
      variantId: payload.variantId ?? null,
      storeId: payload.storeId,
      stock: payload.newQty,
      inStock: payload.newQty > 0,
      isLowStock: payload.isLowStock ?? false,
    };

    // Overwrite rather than queue: only the latest quantity is meaningful.
    this.pendingInventory.set(`${update.productId}:${update.variantId ?? ''}`, update);
    this.scheduleInventoryFlush();
  }

  private scheduleInventoryFlush(): void {
    if (this.inventoryTimer) return;

    this.inventoryTimer = setTimeout(() => {
      this.inventoryTimer = null;
      const batch = [...this.pendingInventory.values()];
      this.pendingInventory.clear();

      for (const update of batch) {
        this.events.emit(`ws.${COMMERCE_EVENTS.INVENTORY_UPDATED}`, update);
      }
    }, INVENTORY_COALESCE_MS);

    // A pending flush must never hold the process open at shutdown.
    this.inventoryTimer.unref?.();
  }
}
