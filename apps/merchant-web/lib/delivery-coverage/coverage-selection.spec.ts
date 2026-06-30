import {
  DUPLICATE_COVERAGE_MESSAGE,
  friendlyCoverageErrorMessage,
  getCoverageAddState,
  parseUniqueCoveragePincodes,
  splitCoveragePincodes,
  updateCoverageSelectionFromMap,
} from './coverage-selection';

describe('delivery coverage selection', () => {
  it('marks duplicate pincode selections as not addable', () => {
    const state = getCoverageAddState('201206', new Set(['201206']));

    expect(state.canAdd).toBe(false);
    expect(state.alreadyAdded).toBe(true);
    expect(state.message).toBe(DUPLICATE_COVERAGE_MESSAGE);
  });

  it('maps backend 409 to the friendly duplicate message', () => {
    expect(friendlyCoverageErrorMessage(409, 'Conflict')).toBe(DUPLICATE_COVERAGE_MESSAGE);
  });

  it('updates selected location after a map click', () => {
    const selected = updateCoverageSelectionFromMap(
      {},
      {
        locality: 'Indirapuram',
        city: 'Ghaziabad',
        state: 'Uttar Pradesh',
        pincode: '201014',
        lat: 28.6415,
        lng: 77.3693,
      },
    );

    expect(selected).toMatchObject({
      locality: 'Indirapuram',
      pincode: '201014',
      lat: 28.6415,
      lng: 77.3693,
    });
  });

  it('updates selected location after dragging the pin', () => {
    const selected = updateCoverageSelectionFromMap(
      { locality: 'Old place', pincode: '201206', lat: 28.7, lng: 77.4 },
      { locality: 'New place', pincode: '201204', lat: 28.68, lng: 77.42 },
    );

    expect(selected.locality).toBe('New place');
    expect(selected.pincode).toBe('201204');
    expect(selected.lat).toBe(28.68);
    expect(selected.lng).toBe(77.42);
  });

  it('keeps coordinates and allows manual pincode entry when reverse geocode has no pincode', () => {
    const selected = updateCoverageSelectionFromMap(
      { locality: 'Old place', pincode: '201206', lat: 28.7, lng: 77.4 },
      { locality: 'Dropped pin', pincode: '', lat: 28.61, lng: 77.2 },
    );

    expect(selected.pincode).toBe('');
    expect(selected.lat).toBe(28.61);
    expect(selected.lng).toBe(77.2);
  });

  it('filters duplicates before bulk add', () => {
    const parsed = parseUniqueCoveragePincodes('201206, 201206 201204 bad 110094');
    const split = splitCoveragePincodes(parsed, new Set(['201206']));

    expect(split.alreadyAdded).toEqual(['201206']);
    expect(split.readyToAdd).toEqual(['201204', '110094']);
  });
});
