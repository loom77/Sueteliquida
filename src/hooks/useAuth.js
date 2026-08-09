import { useCallback, useEffect, useMemo, useState } from 'react';
import { supabase, supabaseConfigured } from '../lib/supabase.js';

function redirectUrl(path) {
  return `${window.location.origin}${path}`;
}

const WEB_TEST_EMAIL = String(import.meta.env.VITE_WEB_TEST_EMAIL || '').trim().toLowerCase();
const AUTH_BOOTSTRAP_TIMEOUT_MS = 8_000;

function cleanDisplayName(value) {
  return String(value || '').replace(/\s+/g, ' ').trim().slice(0, 60);
}

async function loadOrCreatePrimyProfile(user) {
  if (!supabase || !user?.id) return { displayName: '', email: user?.email || '' };
  const { data, error } = await supabase
    .from('primy_profiles')
    .select('display_name,email')
    .eq('id', user.id)
    .maybeSingle();

  if (!error && data) {
    const displayName = cleanDisplayName(data.display_name || user.user_metadata?.display_name);
    if (data.email !== (user.email || null)) {
      await supabase.from('primy_profiles').update({ email: user.email || null }).eq('id', user.id);
    }
    return { displayName, email: user.email || data.email || '' };
  }

  const displayName = cleanDisplayName(user.user_metadata?.display_name);
  await supabase.from('primy_profiles').upsert({
    id: user.id,
    email: user.email || null,
    display_name: displayName || null,
    updated_at: new Date().toISOString(),
  });
  return { displayName, email: user.email || '' };
}

function translateAuthError(error) {
  const message = String(error?.message || '').toLowerCase();
  if (message.includes('invalid login credentials')) return 'El correo o la contraseña no son correctos.';
  if (message.includes('email not confirmed')) return 'Debes confirmar tu correo antes de iniciar sesión.';
  if (message.includes('user already registered')) return 'Ya existe una cuenta con este correo.';
  if (message.includes('password should be at least')) return 'La contraseña debe tener al menos 8 caracteres.';
  if (message.includes('rate limit')) return 'Se han realizado demasiados intentos. Espera unos minutos y vuelve a intentarlo.';
  if (message.includes('network') || message.includes('fetch')) return 'No se puede conectar con el servicio de acceso. Comprueba tu conexión.';
  return error?.message || 'No se ha podido completar la operación.';
}

export function useAuth() {
  const [session, setSession] = useState(null);
  const [profile, setProfile] = useState({ displayName: '', email: '' });
  const [profileLoading, setProfileLoading] = useState(false);
  const [loading, setLoading] = useState(true);
  const [recoveryMode, setRecoveryMode] = useState(false);
  const [notice, setNotice] = useState('');

  const hydrateProfile = useCallback(async user => {
    if (!user) {
      setProfile({ displayName: '', email: '' });
      return;
    }
    setProfileLoading(true);
    try {
      setProfile(await loadOrCreatePrimyProfile(user));
    } finally {
      setProfileLoading(false);
    }
  }, []);

  useEffect(() => {
    if (!supabase) {
      setLoading(false);
      return undefined;
    }

    let active = true;
    let bootstrapTimer;
    const bootstrapTimeout = new Promise(resolve => {
      bootstrapTimer = window.setTimeout(() => resolve({ timedOut: true }), AUTH_BOOTSTRAP_TIMEOUT_MS);
    });

    Promise.race([supabase.auth.getSession(), bootstrapTimeout]).then(result => {
      if (!active) return;
      window.clearTimeout(bootstrapTimer);
      if (result?.timedOut) {
        setNotice('No se ha podido recuperar la sesión guardada. Vuelve a iniciar sesión.');
        setRecoveryMode(false);
        setLoading(false);
        return;
      }
      const { data, error } = result;
      if (!error) {
        setSession(data.session || null);
        if (data.session?.user) hydrateProfile(data.session.user);
      }
      setRecoveryMode(window.location.pathname === '/auth/recovery' && Boolean(data.session));
      setLoading(false);
    });

    const { data: subscription } = supabase.auth.onAuthStateChange((event, nextSession) => {
      if (!active) return;
      setSession(nextSession || null);
      if (nextSession?.user) hydrateProfile(nextSession.user);
      else setProfile({ displayName: '', email: '' });
      if (event === 'PASSWORD_RECOVERY') setRecoveryMode(true);
      if (event === 'SIGNED_IN' && window.location.pathname === '/auth/confirm') {
        setNotice('Correo confirmado correctamente. Tu cuenta ya está activa.');
        window.history.replaceState({}, '', '/');
      }
      if (event === 'SIGNED_OUT') setRecoveryMode(false);
      setLoading(false);
    });

    return () => {
      active = false;
      window.clearTimeout(bootstrapTimer);
      subscription.subscription.unsubscribe();
    };
  }, [hydrateProfile]);

  const signIn = useCallback(async ({ email, password }) => {
    if (!supabase) return { error: 'Supabase no está configurado.' };
    const normalizedEmail = email.trim().toLowerCase();
    if (WEB_TEST_EMAIL && normalizedEmail !== WEB_TEST_EMAIL) {
      return { error: 'El acceso web está reservado a la cuenta de pruebas autorizada.' };
    }
    const { data, error } = await supabase.auth.signInWithPassword({
      email: normalizedEmail,
      password,
    });
    return error ? { error: translateAuthError(error) } : { data };
  }, []);

  const resendConfirmation = useCallback(async email => {
    if (!supabase) return { error: 'Supabase no está configurado.' };
    const { error } = await supabase.auth.resend({
      type: 'signup',
      email: email.trim().toLowerCase(),
      options: { emailRedirectTo: redirectUrl('/auth/confirm') },
    });
    return error ? { error: translateAuthError(error) } : { success: true };
  }, []);

  const requestPasswordReset = useCallback(async email => {
    if (!supabase) return { error: 'Supabase no está configurado.' };
    const { error } = await supabase.auth.resetPasswordForEmail(email.trim().toLowerCase(), {
      redirectTo: redirectUrl('/auth/recovery'),
    });
    return error ? { error: translateAuthError(error) } : { success: true };
  }, []);

  const updatePassword = useCallback(async password => {
    if (!supabase) return { error: 'Supabase no está configurado.' };
    const { error } = await supabase.auth.updateUser({ password });
    if (error) return { error: translateAuthError(error) };
    setRecoveryMode(false);
    setNotice('Contraseña actualizada correctamente.');
    window.history.replaceState({}, '', '/');
    return { success: true };
  }, []);

  const updateDisplayName = useCallback(async value => {
    if (!supabase || !session?.user?.id) return { error: 'No se puede actualizar el nombre sin una sesión activa.' };
    const displayName = cleanDisplayName(value);
    if (displayName && displayName.length < 2) return { error: 'El nombre debe tener al menos 2 caracteres.' };

    const { error: profileError } = await supabase.from('primy_profiles').upsert({
      id: session.user.id,
      email: session.user.email || null,
      display_name: displayName || null,
      updated_at: new Date().toISOString(),
    });
    if (profileError) return { error: 'No se ha podido guardar el nombre en tu cuenta.' };

    const { error: metadataError } = await supabase.auth.updateUser({
      data: { ...session.user.user_metadata, display_name: displayName || null },
    });
    if (metadataError) return { error: translateAuthError(metadataError) };

    setProfile(current => ({ ...current, displayName }));
    return { success: true, displayName };
  }, [session?.user]);

  const deleteAccount = useCallback(async () => {
    if (!supabase || !session?.user?.id) return { error: 'No hay una sesión activa.' };
    const { error } = await supabase.functions.invoke('delete-account', { body: {} });
    if (error) return { error: 'No se ha podido eliminar la cuenta. Comprueba que la función de eliminación esté desplegada e inténtalo de nuevo.' };
    await supabase.auth.signOut({ scope: 'local' });
    return { success: true };
  }, [session?.user?.id]);

  const signOut = useCallback(async () => {
    if (!supabase) return;
    await supabase.auth.signOut();
  }, []);

  const displayName = useMemo(
    () => profile.displayName || cleanDisplayName(session?.user?.user_metadata?.display_name),
    [profile.displayName, session?.user?.user_metadata?.display_name],
  );

  return {
    configured: supabaseConfigured,
    session,
    user: session?.user || null,
    profile,
    displayName,
    profileLoading,
    loading,
    recoveryMode,
    notice,
    clearNotice: () => setNotice(''),
    signIn,
    signOut,
    deleteAccount,
    resendConfirmation,
    requestPasswordReset,
    updatePassword,
    updateDisplayName,
  };
}
