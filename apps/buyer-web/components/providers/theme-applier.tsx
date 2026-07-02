'use client';

import { useEffect } from 'react';
import { useProfilePreferencesStore } from '@/store/profile-preferences-store';

/**
 * Applies the persisted dark-mode preference to the document root so Tailwind's
 * class-based `dark:` variants take effect. The preference lives in the existing
 * profile-preferences store (localStorage-persisted); this just reflects it onto
 * <html>. Renders nothing.
 */
export function ThemeApplier() {
  const darkMode = useProfilePreferencesStore((s) => s.settings.darkMode);

  useEffect(() => {
    document.documentElement.classList.toggle('dark', darkMode);
  }, [darkMode]);

  return null;
}
