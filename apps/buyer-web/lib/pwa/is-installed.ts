import { PWA_STORAGE_KEYS } from './storage-keys';

export function isDisplayModeStandalone(): boolean {
  if (typeof window === 'undefined') return false;
  return window.matchMedia('(display-mode: standalone)').matches;
}

export function isIosStandalone(): boolean {
  if (typeof navigator === 'undefined') return false;
  return (navigator as Navigator & { standalone?: boolean }).standalone === true;
}

export function isStandaloneLaunch(): boolean {
  return isDisplayModeStandalone() || isIosStandalone();
}

export function readInstalledFlag(): boolean {
  if (typeof localStorage === 'undefined') return false;
  return localStorage.getItem(PWA_STORAGE_KEYS.installed) === '1';
}

export function markPwaInstalled(): void {
  if (typeof localStorage === 'undefined') return;
  localStorage.setItem(PWA_STORAGE_KEYS.installed, '1');
}

/** True when launched as installed PWA or install was previously recorded. */
export function isPwaInstalled(): boolean {
  if (isStandaloneLaunch()) {
    markPwaInstalled();
    return true;
  }
  return readInstalledFlag();
}

export function isIosDevice(): boolean {
  if (typeof navigator === 'undefined') return false;
  return /iphone|ipad|ipod/i.test(navigator.userAgent);
}
