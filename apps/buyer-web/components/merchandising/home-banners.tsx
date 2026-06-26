import Link from 'next/link';
import { ArrowRight, Crown, Gift } from 'lucide-react';

export function MembershipBanner() {
  return (
    <Link
      href="/plus"
      className="group flex items-center gap-4 overflow-hidden rounded-3xl border border-amber-200/60 bg-gradient-to-r from-amber-50 to-orange-50 p-5 transition hover:shadow-pop dark:border-amber-500/20 dark:from-amber-500/10 dark:to-orange-500/10"
    >
      <div className="grid h-12 w-12 shrink-0 place-items-center rounded-2xl bg-amber-500/15 text-amber-600">
        <Crown className="h-6 w-6" aria-hidden />
      </div>
      <div className="min-w-0 flex-1">
        <p className="text-sm font-bold text-jd-text-primary">JebDekho Plus</p>
        <p className="mt-0.5 text-xs text-jd-text-muted">
          Free delivery, exclusive deals & extra savings.
        </p>
      </div>
      <ArrowRight className="h-5 w-5 shrink-0 text-amber-600 transition group-hover:translate-x-0.5" aria-hidden />
    </Link>
  );
}

export function ReferralBanner() {
  return (
    <Link
      href="/profile/referrals"
      className="group flex items-center gap-4 overflow-hidden rounded-3xl border border-primary/15 bg-primary/5 p-5 transition hover:shadow-pop"
    >
      <div className="grid h-12 w-12 shrink-0 place-items-center rounded-2xl bg-primary/10 text-primary">
        <Gift className="h-6 w-6" aria-hidden />
      </div>
      <div className="min-w-0 flex-1">
        <p className="text-sm font-bold text-jd-text-primary">Refer & earn</p>
        <p className="mt-0.5 text-xs text-jd-text-muted">
          Invite friends and get wallet credits on their first order.
        </p>
      </div>
      <ArrowRight className="h-5 w-5 shrink-0 text-primary transition group-hover:translate-x-0.5" aria-hidden />
    </Link>
  );
}
