import { useEffect } from 'react';
import { useUserStore } from '../stores/userStore';

export function useTheme() {
  const { preferences, updatePreferences } = useUserStore();

  useEffect(() => {
    const applyTheme = () => {
      const root = document.documentElement;
      const { theme } = preferences;
      
      if (theme === 'dark') {
        root.classList.add('dark');
      } else if (theme === 'light') {
        root.classList.remove('dark');
      } else {
        // System preference
        const prefersDark = window.matchMedia('(prefers-color-scheme: dark)').matches;
        if (prefersDark) {
          root.classList.add('dark');
        } else {
          root.classList.remove('dark');
        }
      }

      // Apply other accessibility preferences
      if (preferences.highContrast) {
        root.classList.add('high-contrast');
      } else {
        root.classList.remove('high-contrast');
      }

      if (preferences.reducedMotion) {
        root.classList.add('reduced-motion');
      } else {
        root.classList.remove('reduced-motion');
      }

      // Apply font size
      root.classList.remove('text-small', 'text-medium', 'text-large');
      root.classList.add(`text-${preferences.fontSize}`);
    };

    applyTheme();

    // Listen for system theme changes
    const mediaQuery = window.matchMedia('(prefers-color-scheme: dark)');
    const handleChange = () => {
      if (preferences.theme === 'system') {
        applyTheme();
      }
    };

    mediaQuery.addEventListener('change', handleChange);
    return () => mediaQuery.removeEventListener('change', handleChange);
  }, [preferences]);

  const toggleTheme = () => {
    const themes = ['light', 'dark', 'system'] as const;
    const currentIndex = themes.indexOf(preferences.theme);
    const nextTheme = themes[(currentIndex + 1) % themes.length];
    updatePreferences({ theme: nextTheme });
  };

  return {
    theme: preferences.theme,
    toggleTheme,
    updatePreferences,
    preferences,
  };
}