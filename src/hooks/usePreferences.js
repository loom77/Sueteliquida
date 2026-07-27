import { useEffect, useState } from 'react';

const KEY = 'primy_preferences_v3';
const LEGACY_KEYS = ['primy_preferences_v2', 'primy_preferences_v1'];
const DEFAULTS = {
  monthlyLimit: null,
  appearance: 'system',
  notifications: false,
  defaultGame: 'primitiva',
  onboardingSeen: false,
};

function normalizeAppearance(value) {
  return ['system', 'light', 'dark'].includes(value) ? value : 'system';
}

function loadPreferences() {
  try {
    const source = localStorage.getItem(KEY) || LEGACY_KEYS.map(key => localStorage.getItem(key)).find(Boolean) || '{}';
    const parsed = JSON.parse(source);
    const monthlyLimit = parsed.monthlyLimit == null ? null : Math.max(0, Number(parsed.monthlyLimit) || 0);
    return {
      ...DEFAULTS,
      ...parsed,
      monthlyLimit,
      appearance: normalizeAppearance(parsed.appearance),
      notifications: Boolean(parsed.notifications),
      defaultGame: parsed.defaultGame === 'eurodreams' ? 'eurodreams' : 'primitiva',
      onboardingSeen: Boolean(parsed.onboardingSeen),
    };
  } catch {
    return DEFAULTS;
  }
}

function resolveTheme(appearance) {
  if (appearance === 'dark') return 'dark';
  if (appearance === 'light') return 'light';
  return window.matchMedia?.('(prefers-color-scheme: dark)').matches ? 'dark' : 'light';
}

export function usePreferences() {
  const [preferences, setPreferences] = useState(DEFAULTS);
  const [error, setError] = useState('');

  useEffect(() => {
    setPreferences(loadPreferences());
  }, []);

  useEffect(() => {
    const apply = () => {
      const theme = resolveTheme(preferences.appearance);
      document.documentElement.dataset.theme = theme;
      document.documentElement.style.colorScheme = theme;
      document.querySelector('meta[name="theme-color"]')?.setAttribute('content', theme === 'dark' ? '#020617' : '#0f172a');
    };
    apply();
    const media = window.matchMedia?.('(prefers-color-scheme: dark)');
    if (preferences.appearance !== 'system' || !media) return undefined;
    media.addEventListener?.('change', apply);
    return () => media.removeEventListener?.('change', apply);
  }, [preferences.appearance]);

  const updatePreferences = patch => {
    setPreferences(current => {
      const next = { ...current, ...patch };
      try {
        localStorage.setItem(KEY, JSON.stringify(next));
        setError('');
      } catch {
        setError('Non è stato possibile salvare le preferenze sul dispositivo.');
      }
      return next;
    });
  };

  return { preferences, updatePreferences, error };
}
