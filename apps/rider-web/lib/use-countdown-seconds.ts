'use client';

import { useEffect, useState } from 'react';

/** Seconds remaining until `targetIso` — ticks every second. Used for the
 *  offer-acceptance countdown, where every second is visible to the rider. */
export function useCountdownSeconds(targetIso: string | null | undefined): number | null {
  const [secs, setSecs] = useState<number | null>(() => computeSecs(targetIso));

  useEffect(() => {
    setSecs(computeSecs(targetIso));
    if (!targetIso) return;
    const id = setInterval(() => setSecs(computeSecs(targetIso)), 1_000);
    return () => clearInterval(id);
  }, [targetIso]);

  return secs;
}

function computeSecs(targetIso: string | null | undefined): number | null {
  if (!targetIso) return null;
  const target = new Date(targetIso).getTime();
  if (!Number.isFinite(target)) return null;
  return Math.max(0, Math.round((target - Date.now()) / 1000));
}
