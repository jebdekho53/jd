'use client';

import { useCallback, useEffect, useState } from 'react';
import { isIosDevice, isPwaInstalled, markPwaInstalled } from '@/lib/pwa/is-installed';
import {
  dismissInstallPromptLater,
  dismissInstallPromptNever,
  getInstallPromptState,
  shouldShowInstallPrompt,
} from '@/lib/pwa/install-prompt-state';

interface BeforeInstallPromptEvent extends Event {
  prompt: () => Promise<void>;
  userChoice: Promise<{ outcome: 'accepted' | 'dismissed' }>;
}

export interface UsePwaInstallResult {
  showAndroidPrompt: boolean;
  showIosHint: boolean;
  isDesktop: boolean;
  install: () => Promise<void>;
  dismissLater: () => void;
  dismissNever: () => void;
}

export function usePwaInstall(blockedByUpdate = false): UsePwaInstallResult {
  const [deferred, setDeferred] = useState<BeforeInstallPromptEvent | null>(null);
  const [showAndroidPrompt, setShowAndroidPrompt] = useState(false);
  const [showIosHint, setShowIosHint] = useState(false);
  const [isDesktop, setIsDesktop] = useState(false);

  const canPrompt = useCallback(() => {
    if (blockedByUpdate) return false;
    const state = getInstallPromptState();
    return shouldShowInstallPrompt(state);
  }, [blockedByUpdate]);

  useEffect(() => {
    if (isPwaInstalled()) return;
    if (!canPrompt()) return;

    setIsDesktop(window.matchMedia('(min-width: 768px)').matches);

    const onInstalled = () => {
      markPwaInstalled();
      setShowAndroidPrompt(false);
      setShowIosHint(false);
      setDeferred(null);
    };

    window.addEventListener('appinstalled', onInstalled);

    if (isIosDevice()) {
      const timer = window.setTimeout(() => {
        if (canPrompt()) setShowIosHint(true);
      }, 4000);
      return () => {
        window.clearTimeout(timer);
        window.removeEventListener('appinstalled', onInstalled);
      };
    }

    const onBip = (e: Event) => {
      e.preventDefault();
      if (!canPrompt()) return;
      setDeferred(e as BeforeInstallPromptEvent);
      setShowAndroidPrompt(true);
    };

    window.addEventListener('beforeinstallprompt', onBip);
    return () => {
      window.removeEventListener('beforeinstallprompt', onBip);
      window.removeEventListener('appinstalled', onInstalled);
    };
  }, [canPrompt]);

  const dismissLater = useCallback(() => {
    dismissInstallPromptLater();
    setShowAndroidPrompt(false);
    setShowIosHint(false);
  }, []);

  const dismissNever = useCallback(() => {
    dismissInstallPromptNever();
    setShowAndroidPrompt(false);
    setShowIosHint(false);
  }, []);

  const install = useCallback(async () => {
    if (!deferred) return;
    await deferred.prompt();
    const { outcome } = await deferred.userChoice;
    if (outcome === 'accepted') {
      markPwaInstalled();
      dismissInstallPromptNever();
    } else {
      dismissInstallPromptLater();
    }
    setDeferred(null);
    setShowAndroidPrompt(false);
  }, [deferred]);

  return {
    showAndroidPrompt,
    showIosHint: showIosHint && canPrompt(),
    isDesktop,
    install,
    dismissLater,
    dismissNever,
  };
}
