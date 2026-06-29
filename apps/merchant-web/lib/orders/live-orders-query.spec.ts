import { liveOrdersQueryParams } from './live-orders-query';

describe('liveOrdersQueryParams', () => {
  it('loads active merchant orders without a today-only createdAt filter', () => {
    expect(liveOrdersQueryParams('store-1')).toEqual({
      storeId: 'store-1',
      merchantStatusGroup: 'active',
      limit: 200,
    });
    expect(liveOrdersQueryParams('store-1')).not.toHaveProperty('today');
  });
});
