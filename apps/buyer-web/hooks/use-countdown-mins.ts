'use client';

import { useEffect, useState } from 'react';

/** Minutes remaining until `targetIso`, re-ticked every 15s so the tracking
 *  page's ETA counts down live instead of sitting frozen between polls. */
export function useCountdownMins(targetIso: string | null | undefined): number | null {
  const [mins, setMins] = useState<number | null>(() => computeMins(targetIso));

  useEffect(() => {
    setMins(computeMins(targetIso));
    if (!targetIso) return;
    const id = setInterval(() => setMins(computeMins(targetIso)), 15_000);
    return () => clearInterval(id);
  }, [targetIso]);

  return mins;
}

function computeMins(targetIso: string | null | undefined): number | null {
  if (!targetIso) return null;
  const target = new Date(targetIso).getTime();
  if (!Number.isFinite(target)) return null;
  return Math.max(0, Math.round((target - Date.now()) / 60_000));
}
