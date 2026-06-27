import { BuyerSearchController } from './buyer-search.controller';
import { SearchAnalyticsService } from './search-analytics.service';
import { SearchDiscoveryService } from './search-discovery.service';
import { CartService } from '../cart/cart.service';

describe('BuyerSearchController IDOR', () => {
  it('trackAnonymousEvent never forwards client buyerProfileId', () => {
    const analytics = { track: jest.fn() };
    const controller = new BuyerSearchController(
      {} as SearchDiscoveryService,
      analytics as unknown as SearchAnalyticsService,
      {} as CartService,
    );

    controller.trackAnonymousEvent({
      eventType: 'QUERY',
      query: 'milk',
      buyerProfileId: 'victim-profile-id',
      sessionId: 'sess-1',
    });

    expect(analytics.track).toHaveBeenCalledWith(
      expect.objectContaining({
        query: 'milk',
        sessionId: 'sess-1',
      }),
    );
    expect(analytics.track.mock.calls[0][0]).not.toHaveProperty('buyerProfileId');
  });
});
