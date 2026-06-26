'use client';

import { useEffect, useState } from 'react';
import Image from 'next/image';
import { Download, Share, X } from 'lucide-react';
import { BRAND_NAME, BRAND_TAGLINE } from '@/lib/brand';
import { PWA_INSTALL_DISMISS_KEY } from '@/lib/pwa/constants';
import { Button } from '@/components/ui/button';
import { cn } from '@/lib/utils';

interface BeforeInstallPromptEvent extends Event {
  prompt: () => Promise<void>;
  userChoice: Promise<{ outcome: 'accepted' | 'dismissed' }>;
}

function isIos(): boolean {
  if (typeof navigator === 'undefined') return false;
  return /iphone|ipad|ipod/i.test(navigator.userAgent);
}

function isStandalone(): boolean {
  if (typeof window === 'undefined') return false;
  return (
    window.matchMedia('(display-mode: standalone)').matches ||
    (navigator as Navigator & { standalone?: boolean }).standalone === true
  );
}

export function InstallPrompt() {
  const [deferred, setDeferred] = useState<BeforeInstallPromptEvent | null>(null);
  const [visible, setVisible] = useState(false);
  const [iosHint, setIosHint] = useState(false);
  const [isDesktop, setIsDesktop] = useState(false);

  useEffect(() => {
    if (isStandalone()) return;
    if (localStorage.getItem(PWA_INSTALL_DISMISS_KEY) === '1') return;

    setIsDesktop(window.matchMedia('(min-width: 768px)').matches);

    if (isIos()) {
      const t = window.setTimeout(() => setIosHint(true), 4000);
      return () => window.clearTimeout(t);
    }

    const onBip = (e: Event) => {
      e.preventDefault();
      setDeferred(e as BeforeInstallPromptEvent);
      setVisible(true);
    };

    window.addEventListener('beforeinstallprompt', onBip);
    return () => window.removeEventListener('beforeinstallprompt', onBip);
  }, []);

  const dismiss = (never = false) => {
    if (never) localStorage.setItem(PWA_INSTALL_DISMISS_KEY, '1');
    setVisible(false);
    setIosHint(false);
  };

  const install = async () => {
    if (!deferred) return;
    await deferred.prompt();
    const { outcome } = await deferred.userChoice;
    if (outcome === 'accepted') dismiss(true);
    else dismiss(false);
    setDeferred(null);
  };

  if (!visible && !iosHint) return null;

  const card = (
    <div
      className={cn(
        'fixed z-[100] overflow-hidden rounded-2xl border border-primary/20 bg-card shadow-2xl',
        isDesktop && !iosHint
          ? 'right-4 top-4 w-[min(100%,22rem)]'
          : 'inset-x-0 bottom-0 rounded-b-none border-b-0 md:inset-x-auto md:right-4 md:bottom-4 md:w-[min(100%,22rem)] md:rounded-2xl md:border-b',
      )}
      role="dialog"
      aria-label="Install JebDekho app"
    >
      <div className="bg-gradient-to-br from-[#16a34a] to-[#15803d] px-4 py-3 text-white">
        <div className="flex items-start gap-3">
          <Image src="/pwa/icons/icon-96.png" alt="" width={48} height={48} className="rounded-xl bg-white/10" />
          <div className="min-w-0 flex-1">
            <p className="font-bold">Install {BRAND_NAME}</p>
            <p className="text-xs text-white/90">{BRAND_TAGLINE}</p>
          </div>
          <button type="button" onClick={() => dismiss(false)} className="rounded-lg p-1 hover:bg-white/10" aria-label="Close">
            <X className="h-4 w-4" />
          </button>
        </div>
      </div>

      <div className="space-y-3 p-4">
        {iosHint ? (
          <div className="space-y-2 text-sm text-jd-text-secondary">
            <p className="font-medium text-jd-text-primary">Add to Home Screen</p>
            <p className="flex items-center gap-2">
              <Share className="h-4 w-4 shrink-0 text-primary" />
              Tap Share, then &quot;Add to Home Screen&quot;
            </p>
            <ul className="list-inside list-disc text-xs text-jd-text-muted">
              <li>Open faster in full screen</li>
              <li>Receive offers & updates</li>
            </ul>
          </div>
        ) : (
          <ul className="space-y-1 text-sm text-jd-text-secondary">
            <li>⚡ Open faster from your home screen</li>
            <li>📱 Full-screen shopping experience</li>
            <li>🏷️ Never miss offers & price drops</li>
          </ul>
        )}

        <div className="flex flex-wrap gap-2">
          {!iosHint && (
            <Button type="button" className="flex-1 gap-2" onClick={() => void install()}>
              <Download className="h-4 w-4" />
              Install App
            </Button>
          )}
          <Button type="button" variant="outline" className="flex-1" onClick={() => dismiss(false)}>
            Later
          </Button>
          <button type="button" className="w-full text-center text-xs text-jd-text-muted underline" onClick={() => dismiss(true)}>
            Never show again
          </button>
        </div>
      </div>
    </div>
  );

  return card;
}
