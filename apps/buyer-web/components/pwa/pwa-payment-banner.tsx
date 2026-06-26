'use client';

import { ExternalLink, Smartphone } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { isStandalonePwa, openInSystemBrowser } from '@/lib/pwa/standalone';

export function PwaPaymentBanner() {
  if (!isStandalonePwa()) return null;

  return (
    <div className="rounded-2xl border border-amber-200 bg-amber-50 px-4 py-3 text-sm text-amber-950">
      <div className="flex gap-3">
        <Smartphone className="mt-0.5 h-5 w-5 shrink-0 text-amber-700" aria-hidden />
        <div className="min-w-0 flex-1 space-y-2">
          <p className="font-semibold">UPI / PhonePe / GPay ke liye</p>
          <p className="text-xs leading-relaxed text-amber-900/90">
            Installed app se payment apps kabhi-kabhi nahi khulte. Neeche &quot;Browser mein kholo&quot; dabayein,
            phir payment complete karein — ya QR / card use karein.
          </p>
          <Button
            type="button"
            variant="outline"
            size="sm"
            className="gap-1.5 border-amber-300 bg-white text-amber-950 hover:bg-amber-100"
            onClick={() => openInSystemBrowser()}
          >
            <ExternalLink className="h-3.5 w-3.5" />
            Browser mein kholo
          </Button>
        </div>
      </div>
    </div>
  );
}
