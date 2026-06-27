import { hasProviderTimeline, sortProviderTimeline } from './provider-timeline';

describe('provider timeline', () => {
  const entries = [
    { status: 'assigned', label: 'Assigned', occurredAt: '2026-06-01T10:00:00Z' },
    { status: 'picked_up', label: 'Picked up', occurredAt: '2026-06-01T11:00:00Z' },
    { status: 'delivered', label: 'Delivered', occurredAt: '2026-06-01T12:00:00Z' },
  ];

  it('sorts newest first', () => {
    const sorted = sortProviderTimeline(entries);
    expect(sorted[0]?.status).toBe('delivered');
    expect(sorted[2]?.status).toBe('assigned');
  });

  it('detects non-empty timeline', () => {
    expect(hasProviderTimeline(entries)).toBe(true);
    expect(hasProviderTimeline([])).toBe(false);
    expect(hasProviderTimeline(undefined)).toBe(false);
  });
});
