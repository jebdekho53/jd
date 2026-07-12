'use client';

/**
 * Tells the merchant whether the board is live or falling back to polling —
 * without it, a dead socket looks identical to a quiet shift.
 */
export function RealtimeIndicator({ connected }: { connected: boolean }) {
  return (
    <span className="inline-flex items-center gap-1.5 text-xs">
      <span
        aria-hidden
        className={`h-2 w-2 rounded-full ${connected ? 'bg-emerald-400' : 'bg-amber-400'}`}
      />
      <span className={connected ? 'text-emerald-400' : 'text-amber-400'}>
        {connected ? 'Live' : 'Reconnecting — refreshing every 15s'}
      </span>
    </span>
  );
}
