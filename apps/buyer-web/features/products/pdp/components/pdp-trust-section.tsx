'use client';

import { Headphones, RefreshCw, ShieldCheck, Shield, Store } from 'lucide-react';

const TRUST_ITEMS = [
  { icon: ShieldCheck, title: '100% genuine', desc: 'Products sourced from verified local sellers.' },
  { icon: Shield, title: 'Secure payments', desc: 'UPI, cards, wallet & COD with encrypted checkout.' },
  { icon: RefreshCw, title: 'Easy refunds', desc: 'Hassle-free returns on eligible grocery items.' },
  { icon: Headphones, title: 'Support available', desc: 'In-app help & chat for order issues.' },
  { icon: Store, title: 'Verified sellers', desc: 'GST-verified stores in your neighbourhood.' },
] as const;

export function PdpTrustSection() {
  return (
    <section
      className="rounded-2xl border border-border bg-gradient-to-br from-cream-2 to-card p-4 shadow-card sm:p-5"
      aria-labelledby="pdp-trust-heading"
    >
      <h2 id="pdp-trust-heading" className="mb-4 text-lg font-semibold text-jd-text-primary">
        Why shop on JebDekho
      </h2>
      <div className="grid gap-3 sm:grid-cols-2">
        {TRUST_ITEMS.map(({ icon: Icon, title, desc }) => (
          <div key={title} className="flex gap-3 rounded-xl bg-card/80 p-3">
            <span className="grid h-9 w-9 shrink-0 place-items-center rounded-lg bg-primary/10 text-primary">
              <Icon className="h-4 w-4" aria-hidden />
            </span>
            <div>
              <p className="text-sm font-semibold text-jd-text-primary">{title}</p>
              <p className="text-xs text-jd-text-muted">{desc}</p>
            </div>
          </div>
        ))}
      </div>
    </section>
  );
}
