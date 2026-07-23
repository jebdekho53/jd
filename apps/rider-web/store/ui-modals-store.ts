'use client';

import { useSyncExternalStore } from 'react';

let stepUpOpen = false;
let stepUpResolver: ((success: boolean) => void) | null = null;
const listeners = new Set<() => void>();

function notify() {
  for (const l of listeners) l();
}

/** Mirrors buyer-web's step-up modal pattern: any fetch that gets a 403
 *  "Step-Up Required" response awaits this promise, which resolves once the
 *  rider re-verifies via OTP (or is dismissed). No state library needed —
 *  same module-level pub-sub shape as use-recently-viewed.ts. */
export function triggerStepUp(): Promise<boolean> {
  return new Promise<boolean>((resolve) => {
    stepUpResolver = resolve;
    stepUpOpen = true;
    notify();
  });
}

export function resolveStepUp(success: boolean) {
  if (stepUpResolver) {
    stepUpResolver(success);
    stepUpResolver = null;
  }
  stepUpOpen = false;
  notify();
}

export function useStepUpOpen(): boolean {
  return useSyncExternalStore(
    (cb) => {
      listeners.add(cb);
      return () => listeners.delete(cb);
    },
    () => stepUpOpen,
    () => false,
  );
}
