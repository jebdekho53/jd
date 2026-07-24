import { Lock, RefreshCw, ShieldCheck, Truck } from 'lucide-react';

const BADGES = [
  { icon: Lock, label: 'Secure payment' },
  { icon: ShieldCheck, label: '100% genuine' },
  { icon: RefreshCw, label: 'Easy refunds' },
  { icon: Truck, label: 'Verified delivery' },
] as const;

/** Compact single-row reassurance strip right above the pay CTA — the
 *  moment a buyer is most likely to hesitate and abandon checkout. */
export function CheckoutTrustBadges() {
  return (
    <div className="grid grid-cols-2 gap-2 rounded-xl border border-border bg-cream-2 p-3 sm:grid-cols-4">
      {BADGES.map(({ icon: Icon, label }) => (
        <div key={label} className="flex items-center gap-1.5">
          <Icon className="h-3.5 w-3.5 shrink-0 text-primary" aria-hidden />
          <span className="text-[11px] font-medium leading-tight text-jd-text-secondary">{label}</span>
        </div>
      ))}
    </div>
  );
}
