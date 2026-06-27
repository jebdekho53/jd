import { labelForNormalizedStatus } from './normalized-status-labels';

describe('normalized-status-labels', () => {
  it('returns buyer-friendly labels', () => {
    expect(labelForNormalizedStatus('DELIVERED')).toBe('Delivered');
    expect(labelForNormalizedStatus('IN_TRANSIT')).toBe('On the way');
    expect(labelForNormalizedStatus('UNKNOWN')).toBe('In progress');
  });
});
