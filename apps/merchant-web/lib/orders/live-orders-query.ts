import type { ListOrdersParams } from '@/types/order';

export function liveOrdersQueryParams(storeId?: string): ListOrdersParams {
  return {
    storeId,
    merchantStatusGroup: 'active',
    limit: 200,
  };
}
