import { INSTALL_PROMPT_COOLDOWN_MS, PWA_INSTALL_DISMISS_KEY_LEGACY, PWA_STORAGE_KEYS } from './storage-keys';
import { isPwaInstalled } from './is-installed';

export interface InstallPromptState {
  installed: boolean;
  neverShow: boolean;
  dismissedAt: number | null;
}

function readDismissedAt(): number | null {
  if (typeof localStorage === 'undefined') return null;
  const raw = localStorage.getItem(PWA_STORAGE_KEYS.installDismissedAt);
  if (!raw) return null;
  const ts = Number(raw);
  return Number.isFinite(ts) ? ts : null;
}

export function migrateLegacyInstallDismiss(): void {
  if (typeof localStorage === 'undefined') return;
  if (localStorage.getItem(PWA_INSTALL_DISMISS_KEY_LEGACY) === '1') {
    localStorage.setItem(PWA_STORAGE_KEYS.installNeverShow, '1');
    localStorage.removeItem(PWA_INSTALL_DISMISS_KEY_LEGACY);
  }
}

export function getInstallPromptState(): InstallPromptState {
  migrateLegacyInstallDismiss();
  if (typeof localStorage === 'undefined') {
    return { installed: false, neverShow: false, dismissedAt: null };
  }
  return {
    installed: isPwaInstalled(),
    neverShow: localStorage.getItem(PWA_STORAGE_KEYS.installNeverShow) === '1',
    dismissedAt: readDismissedAt(),
  };
}

export function shouldShowInstallPrompt(
  state: InstallPromptState,
  now = Date.now(),
): boolean {
  if (state.installed || state.neverShow) return false;
  if (state.dismissedAt === null) return true;
  return now - state.dismissedAt >= INSTALL_PROMPT_COOLDOWN_MS;
}

export function dismissInstallPromptLater(now = Date.now()): void {
  if (typeof localStorage === 'undefined') return;
  localStorage.setItem(PWA_STORAGE_KEYS.installDismissedAt, String(now));
}

export function dismissInstallPromptNever(): void {
  if (typeof localStorage === 'undefined') return;
  localStorage.setItem(PWA_STORAGE_KEYS.installNeverShow, '1');
}
