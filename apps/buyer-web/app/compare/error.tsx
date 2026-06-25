'use client';

import { RouteError } from '@/components/common/route-error';

export default function Error({ error, reset }: { error: Error; reset: () => void }) {
  return <RouteError error={error} reset={reset} title="Could not load comparison" />;
}
