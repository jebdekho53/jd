import { OrderStatus, PaymentMethod, PaymentStatus, Prisma } from '@prisma/client';
import type { MerchantStatusGroup } from './order-status-groups';
import { MERCHANT_STATUS_GROUPS } from './order-status-groups';
import type { MerchantPipelineColumn } from './merchant-pipeline.util';
import { PIPELINE_COLUMN_STATUSES } from './merchant-pipeline.util';

const COD_METHODS: PaymentMethod[] = [PaymentMethod.COD, PaymentMethod.WALLET_COD];

/** Statuses merchants must never see in the default actionable queue. */
export const MERCHANT_HIDDEN_STATUSES: OrderStatus[] = [
  OrderStatus.CREATED,
  OrderStatus.PAYMENT_PENDING,
];

const CANCELLED_STATUSES: OrderStatus[] = [
  OrderStatus.CANCELLED_BY_BUYER,
  OrderStatus.CANCELLED_BY_MERCHANT,
  OrderStatus.CANCELLED_BY_ADMIN,
  OrderStatus.PAYMENT_FAILED,
  OrderStatus.DELIVERY_FAILED,
];

/** Payment must be confirmed (or COD) before merchant queue visibility. */
export function merchantPaymentVisibilityWhere(): Prisma.OrderWhereInput {
  return {
    OR: [
      { paymentMethod: { in: COD_METHODS } },
      { paymentStatus: PaymentStatus.PAID },
    ],
  };
}

/** NEW tab: paid online orders awaiting accept + COD orders at MERCHANT_ACCEPTED. */
export function merchantNewTabWhere(): Prisma.OrderWhereInput {
  return {
    AND: [
      merchantPaymentVisibilityWhere(),
      {
        OR: [
          { status: OrderStatus.PAID },
          {
            status: OrderStatus.MERCHANT_ACCEPTED,
            paymentMethod: { in: COD_METHODS },
          },
        ],
      },
    ],
  };
}

/** ACCEPTED tab: merchant-accepted prepaid orders (excludes COD auto-accepted). */
export function merchantAcceptedTabWhere(): Prisma.OrderWhereInput {
  return {
    AND: [
      merchantPaymentVisibilityWhere(),
      {
        status: OrderStatus.MERCHANT_ACCEPTED,
        paymentMethod: { notIn: COD_METHODS },
      },
    ],
  };
}

export function merchantDefaultVisibleWhere(): Prisma.OrderWhereInput {
  return {
    AND: [
      { status: { notIn: MERCHANT_HIDDEN_STATUSES } },
      merchantPaymentVisibilityWhere(),
    ],
  };
}

function pipelineColumnWhere(column: MerchantPipelineColumn): Prisma.OrderWhereInput {
  if (column === 'NEW') return merchantNewTabWhere();
  if (column === 'ACCEPTED') return merchantAcceptedTabWhere();
  if (column === 'CANCELLED') {
    return { status: { in: CANCELLED_STATUSES } };
  }

  const statuses = PIPELINE_COLUMN_STATUSES[column];
  return {
    AND: [
      merchantPaymentVisibilityWhere(),
      { status: { in: [...statuses] } },
    ],
  };
}

function merchantGroupWhere(group: MerchantStatusGroup): Prisma.OrderWhereInput {
  if (group === 'new') return merchantNewTabWhere();
  if (group === 'accepted') return merchantAcceptedTabWhere();
  if (group === 'cancelled') {
    return { status: { in: CANCELLED_STATUSES } };
  }

  return {
    AND: [
      merchantPaymentVisibilityWhere(),
      { status: { in: [...MERCHANT_STATUS_GROUPS[group]] } },
    ],
  };
}

export function buildMerchantListWhere(opts: {
  status?: OrderStatus;
  merchantStatusGroup?: MerchantStatusGroup;
  pipelineColumn?: MerchantPipelineColumn;
}): Prisma.OrderWhereInput {
  if (opts.status) {
    if (CANCELLED_STATUSES.includes(opts.status)) {
      return { status: opts.status };
    }
    return {
      AND: [{ status: opts.status }, merchantPaymentVisibilityWhere()],
    };
  }

  if (opts.pipelineColumn) return pipelineColumnWhere(opts.pipelineColumn);
  if (opts.merchantStatusGroup) return merchantGroupWhere(opts.merchantStatusGroup);

  return merchantDefaultVisibleWhere();
}

export function isDispatchPaymentCleared(
  paymentMethod: PaymentMethod,
  paymentStatus: PaymentStatus,
): boolean {
  if (COD_METHODS.includes(paymentMethod)) return true;
  return paymentStatus === PaymentStatus.PAID;
}
