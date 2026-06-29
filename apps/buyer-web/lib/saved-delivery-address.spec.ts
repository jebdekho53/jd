import {
  getDefaultSavedDeliveryAddress,
  isAddressGeoComplete,
  isDefaultDelhiCoords,
  isDeliveryAddressComplete,
  persistDeliveryAddress,
  restoreDeliveryLocationFromSavedAddress,
} from './saved-delivery-address';
import { useAddressStore } from '@/store/address-store';
import { useLocationStore } from '@/store/location-store';

describe('saved-delivery-address', () => {
  beforeEach(() => {
    useAddressStore.setState({ addresses: [] });
  });

  it('treats default Delhi coords as incomplete geo', () => {
    expect(isDefaultDelhiCoords(28.6139, 77.209)).toBe(true);
    expect(isAddressGeoComplete(28.6139, 77.209)).toBe(false);
    expect(isAddressGeoComplete(12.97, 77.59)).toBe(true);
  });

  it('requires line1, pincode, city, and valid geo for complete address', () => {
    expect(
      isDeliveryAddressComplete({
        line1: '42 MG Road',
        city: 'Bengaluru',
        pincode: '560001',
        lat: 12.97,
        lng: 77.59,
      }),
    ).toBe(true);

    expect(
      isDeliveryAddressComplete({
        line1: '42 MG Road',
        city: 'Delhi',
        pincode: '110001',
        lat: 28.6139,
        lng: 77.209,
      }),
    ).toBe(false);
  });

  it('returns null default when saved address geo is incomplete', () => {
    useAddressStore.setState({
      addresses: [
        {
          id: 'a1',
          label: 'Home',
          line1: '42 MG Road',
          pincode: '110001',
          city: 'Delhi',
          lat: 28.6139,
          lng: 77.209,
          isDefault: true,
          createdAt: new Date().toISOString(),
        },
      ],
    });

    expect(getDefaultSavedDeliveryAddress()).toBeNull();
  });

  it('restores pinned location from default saved address', () => {
    useLocationStore.setState({
      lat: 0,
      lng: 0,
      label: '',
      source: 'default',
      isReady: false,
    });
    useAddressStore.setState({
      addresses: [
        {
          id: 'a1',
          label: 'Home',
          line1: 'Sector 4',
          pincode: '201206',
          city: 'Ghaziabad',
          lat: 28.67,
          lng: 77.45,
          isDefault: true,
          createdAt: new Date().toISOString(),
        },
      ],
    });

    expect(restoreDeliveryLocationFromSavedAddress()).toBe(true);
    const location = useLocationStore.getState();
    expect(location.isReady).toBe(true);
    expect(location.pincode).toBe('201206');
    expect(location.label).toContain('Ghaziabad');
  });
});
