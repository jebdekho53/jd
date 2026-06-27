export interface ProviderTimelineEntry {
  status: string;
  label: string;
  description?: string | null;
  occurredAt: string;
}

/** Returns provider timeline entries sorted newest-first for display. */
export function sortProviderTimeline(
  entries: ProviderTimelineEntry[] | undefined | null,
): ProviderTimelineEntry[] {
  if (!entries?.length) return [];
  return [...entries].sort(
    (a, b) => new Date(b.occurredAt).getTime() - new Date(a.occurredAt).getTime(),
  );
}

export function hasProviderTimeline(entries: ProviderTimelineEntry[] | undefined | null): boolean {
  return sortProviderTimeline(entries).length > 0;
}
