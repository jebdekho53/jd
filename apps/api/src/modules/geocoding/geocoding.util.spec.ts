import { parseGeocoderResponse } from './geocoding.util';

describe('parseGeocoderResponse', () => {
  it('parses Google geocode JSON', () => {
    const data = {
      status: 'OK',
      results: [
        {
          formatted_address: '42 MG Road, New Delhi, Delhi 110001, India',
          address_components: [
            { long_name: '42', short_name: '42', types: ['street_number'] },
            { long_name: 'MG Road', short_name: 'MG Rd', types: ['route'] },
            { long_name: 'Connaught Place', short_name: 'CP', types: ['sublocality', 'sublocality_level_1'] },
            { long_name: 'New Delhi', short_name: 'New Delhi', types: ['locality'] },
            { long_name: 'Delhi', short_name: 'DL', types: ['administrative_area_level_1'] },
            { long_name: '110001', short_name: '110001', types: ['postal_code'] },
          ],
          geometry: { location: { lat: 28.63, lng: 77.21 } },
        },
      ],
    };
    const parsed = parseGeocoderResponse(data, 28.63, 77.21);
    expect(parsed?.pincode).toBe('110001');
    expect(parsed?.city).toBe('New Delhi');
    expect(parsed?.line1).toBe('42 MG Road');
  });

  it('returns null for non-OK status', () => {
    expect(parseGeocoderResponse({ status: 'ZERO_RESULTS' }, 0, 0)).toBeNull();
  });
});
