'use client';

import { RouteError } from '@/components/common/route-error';

export default function ProfileError({
  error,
  reset,
}: {
  error: Error & { digest?: string };
  reset: () => void;
}) {
  return <RouteError error={error} reset={reset} title="Profile unavailable" />;
}
