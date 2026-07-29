import { useCallback, useEffect, useState } from 'react';
import { supabase } from '../lib/supabase.js';

const KEY = 'primy_preferences_v4';
const LEGACY_KEYS = ['primy_preferences_v3', 'primy_preferences_v2', 'primy_preferences_v1'];
const DEFAULTS = {
  monthlyLimit: null,
  appearance: 'system',
  notifications: false,
  defaultGame: 'primitiva',
  onboardingSeen: false,
  ageConfirmed: false,
  ageConfirmedAt: null,
};

function userKey(userId) {
  return `${KEY}_${userId}`;
}

function normalizeAppearance(value) {
  return ['system', 'light', 'dark'].includes(value) ? value : 'system';
}

function normalizePreferences(parsed = {}) {
  const monthlyLimit = parsed.monthlyLimit == null ? null : Math.max(0, Number(parsed.monthlyLimit) || 0);
  return {
    ...DEFAULTS,
    ...parsed,
    monthlyLimit,
    appearance: normalizeAppearance(parsed.appearance),
    notifications: Boolean(parsed.notifications),
    defaultGame: parsed.defaultGame === 'eurodreams' ? 'eurodreams' : 'primitiva',
    onboardingSeen: Boolean(parsed.onboardingSeen),
    ageConfirmed: Boolean(parsed.ageConfirmed),
    ageConfirmedAt: parsed.ageConfirmed && typeof parsed.ageConfirmedAt === 'string' ? parsed.ageConfirmedAt : null,
  };
}

function loadPreferences(userId) {
  try {
    const sources = userId
      ? [localStorage.getItem(userKey(userId)), localStorage.getItem(KEY), ...LEGACY_KEYS.map(key => localStorage.getItem(key))]
      : [localStorage.getItem(KEY), ...LEGACY_KEYS.map(key => localStorage.getItem(key))];
    const source = sources.find(Boolean) || '{}';
    return normalizePreferences(JSON.parse(source));
  } catch {
    return DEFAULTS;
  }
}

function resolveTheme(appearance) {
  if (appearance === 'dark') return 'dark';
  if (appearance === 'light') return 'light';
  return window.matchMedia?.('(prefers-color-scheme: dark)').matches ? 'dark' : 'light';
}

export function usePreferences(user) {
  const [preferences, setPreferences] = useState(() => loadPreferences(user?.id));
  const [error, setError] = useState('');

  useEffect(() => {
    let cancelled = false;
    const local = loadPreferences(user?.id);
    setPreferences(local);
    if (!user?.id || !supabase) return undefined;

    const loadRemote = async () => {
      const { data, error: fetchError } = await supabase
        .from('primy_user_settings')
        .select('data')
        .eq('user_id', user.id)
        .maybeSingle();
      if (cancelled) return;
      if (fetchError) {
        setError('No se han podido sincronizar las preferencias de tu cuenta.');
        return;
      }
      if (data?.data) {
        const remote = normalizePreferences(data.data);
        setPreferences(current => {
          const merged = current.ageConfirmed && !remote.ageConfirmed
            ? { ...remote, ageConfirmed: true, ageConfirmedAt: current.ageConfirmedAt }
            : remote;
          localStorage.setItem(userKey(user.id), JSON.stringify(merged));
          if (merged.ageConfirmed && !remote.ageConfirmed) {
            supabase.from('primy_user_settings').upsert({ user_id: user.id, data: merged, updated_at: new Date().toISOString() });
          }
          return merged;
        });
      } else {
        await supabase.from('primy_user_settings').upsert({ user_id: user.id, data: local, updated_at: new Date().toISOString() });
      }
    };
    loadRemote();
    return () => { cancelled = true; };
  }, [user?.id]);

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

  const updatePreferences = useCallback(patch => {
    setPreferences(current => {
      const next = normalizePreferences({ ...current, ...patch });
      try {
        const storageKey = user?.id ? userKey(user.id) : KEY;
        localStorage.setItem(storageKey, JSON.stringify(next));
        setError('');
      } catch {
        setError('No se han podido guardar las preferencias en el dispositivo.');
      }
      if (user?.id && supabase) {
        supabase.from('primy_user_settings').upsert({
          user_id: user.id,
          data: next,
          updated_at: new Date().toISOString(),
        }).then(({ error: syncError }) => {
          if (syncError) setError('La preferencia se ha guardado en este dispositivo, pero no se ha podido sincronizar.');
        });
      }
      return next;
    });
  }, [user?.id]);

  return { preferences, updatePreferences, error };
}
