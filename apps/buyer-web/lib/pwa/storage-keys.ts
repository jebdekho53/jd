export const PWA_STORAGE_KEYS = {
  installed: 'jebdekho:pwa:installed',
  installDismissedAt: 'jebdekho:pwa:install-dismissed-at',
  installNeverShow: 'jebdekho:pwa:install-never-show',
  updatePending: 'jebdekho:pwa:update-pending',
} as const;

/** @deprecated Migrated to {@link PWA_STORAGE_KEYS.installNeverShow} */
export const PWA_INSTALL_DISMISS_KEY_LEGACY = 'jebdekho-pwa-install-dismissed';

export const INSTALL_PROMPT_COOLDOWN_MS = 7 * 24 * 60 * 60 * 1000;
