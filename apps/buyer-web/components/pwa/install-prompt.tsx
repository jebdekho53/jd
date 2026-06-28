'use client';

import Image from 'next/image';
import { Download, Share, X } from 'lucide-react';
import { BRAND_NAME, BRAND_TAGLINE } from '@/lib/brand';
import { usePwaInstall } from '@/hooks/use-pwa-install';
import { Button } from '@/components/ui/button';
import { cn } from '@/lib/utils';

interface InstallPromptProps {
  blockedByUpdate?: boolean;
}

export function InstallPrompt({ blockedByUpdate = false }: InstallPromptProps) {
  const {
    showAndroidPrompt,
    showIosHint,
    isDesktop,
    install,
    dismissLater,
    dismissNever,
  } = usePwaInstall(blockedByUpdate);

  if (!showAndroidPrompt && !showIosHint) return null;

  return (
    <div
      className={cn(
        'fixed z-[100] overflow-hidden rounded-2xl border border-primary/20 bg-card shadow-2xl',
        isDesktop && !showIosHint
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
          <button
            type="button"
            onClick={dismissLater}
            className="rounded-lg p-1 hover:bg-white/10"
            aria-label="Close"
          >
            <X className="h-4 w-4" />
          </button>
        </div>
      </div>

      <div className="space-y-3 p-4">
        {showIosHint ? (
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
          {showAndroidPrompt && (
            <Button type="button" className="flex-1 gap-2" onClick={() => void install()}>
              <Download className="h-4 w-4" />
              Install App
            </Button>
          )}
          <Button type="button" variant="outline" className="flex-1" onClick={dismissLater}>
            Later
          </Button>
          <button
            type="button"
            className="w-full text-center text-xs text-jd-text-muted underline"
            onClick={dismissNever}
          >
            Never show again
          </button>
        </div>
      </div>
    </div>
  );
}
