import { StoreStatus } from '@prisma/client';
import { canDeliverToBuyer } from './buyer-visibility.util';

const baseStore = {
  latitude: 28.6139,
  longitude: 77.209,
  deliveryRadiusKm: 5,
  storeServiceAreas: [] as Array<{
    serviceArea: { centerLat: number; centerLng: number; radiusKm: number };
  }>,
  deliveryAreas: [] as Array<{
    pincode: string;
    isActive: boolean;
    deliveryFee?: number;
    minimumOrder?: number;
    estimatedMinutes?: number;
    priority?: number;
  }>,
  deliveryFee: 0,
  minOrderAmount: 0,
  avgPrepTimeMins: 15,
  status: StoreStatus.APPROVED,
  isActive: true,
  deletedAt: null,
};

const buyerNearStore = { lat: 28.6145, lng: 77.21, discoveryRadiusKm: 20 };

describe('canDeliverToBuyer', () => {
  it('allows store inside geo radius with no pincode coverage configured', () => {
    const result = canDeliverToBuyer(baseStore, buyerNearStore);
    expect(result.eligible).toBe(true);
    expect(result.pincodeMatch).toBe(false);
    expect(result.deliverable.distanceKm).toBeLessThan(1);
  });

  it('rejects when outside geo radius and no pincode coverage', () => {
    const result = canDeliverToBuyer(baseStore, {
      lat: 28.7,
      lng: 77.35,
      discoveryRadiusKm: 3,
    });
    expect(result.eligible).toBe(false);
    expect(result.filterReason).toBeDefined();
  });

  it('allows pincode match even when geo distance exceeds discovery radius (atharv-legal scenario)', () => {
    const store = {
      ...baseStore,
      latitude: 19.076,
      longitude: 72.877,
      deliveryRadiusKm: 3,
      deliveryAreas: [{ pincode: '201017', isActive: true, priority: 1 }],
    };
    const result = canDeliverToBuyer(store, {
      lat: 28.6139,
      lng: 77.209,
      pincode: '201017',
      discoveryRadiusKm: 3,
    });
    expect(result.eligible).toBe(true);
    expect(result.pincodeMatch).toBe(true);
    expect(result.deliverable.distanceKm).toBeGreaterThan(20);
  });

  it('matches any of multiple configured delivery pincodes', () => {
    const store = {
      ...baseStore,
      deliveryAreas: [
        { pincode: '201017', isActive: true, priority: 2 },
        { pincode: '201003', isActive: true, priority: 1 },
        { pincode: '110092', isActive: true, priority: 0 },
      ],
    };
    for (const pincode of ['201017', '201003', '110092']) {
      const result = canDeliverToBuyer(store, {
        lat: 28.7,
        lng: 77.35,
        pincode,
        discoveryRadiusKm: 3,
      });
      expect(result.eligible).toBe(true);
      expect(result.pincodeMatch).toBe(true);
    }
  });

  it('rejects pincode not in delivery areas when store has pincode list configured', () => {
    const store = {
      ...baseStore,
      deliveryAreas: [{ pincode: '110001', isActive: true, priority: 1 }],
    };
    const result = canDeliverToBuyer(store, {
      lat: 28.6139,
      lng: 77.209,
      pincode: '201017',
      discoveryRadiusKm: 20,
    });
    expect(result.eligible).toBe(false);
    expect(result.deliverable.reason).toContain('pincode');
  });

  it('ignores inactive delivery area rows', () => {
    const store = {
      ...baseStore,
      deliveryAreas: [{ pincode: '201017', isActive: false, priority: 1 }],
    };
    const result = canDeliverToBuyer(store, {
      lat: 28.7,
      lng: 77.35,
      pincode: '201017',
      discoveryRadiusKm: 20,
    });
    expect(result.eligible).toBe(false);
  });
});

describe('checkout UI vs API deliverability parity', () => {
  it('pincode-covered store is deliverable even when UI would previously show radius error', () => {
    const store = {
      ...baseStore,
      latitude: 19.076,
      longitude: 72.877,
      deliveryRadiusKm: 3,
      deliveryAreas: [{ pincode: '201017', isActive: true, priority: 1 }],
    };
    const buyer = { lat: 28.6139, lng: 77.209, pincode: '201017' };
    const withPincode = canDeliverToBuyer(store, { ...buyer, discoveryRadiusKm: 3 });
    const withoutPincode = canDeliverToBuyer(store, {
      lat: buyer.lat,
      lng: buyer.lng,
      discoveryRadiusKm: 3,
    });
    expect(withPincode.eligible).toBe(true);
    expect(withoutPincode.eligible).toBe(false);
  });
});
