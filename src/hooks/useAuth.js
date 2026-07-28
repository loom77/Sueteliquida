import { useCallback, useEffect, useState } from 'react';
import { supabase, supabaseConfigured } from '../lib/supabase.js';

function redirectUrl(path) {
  return `${window.location.origin}${path}`;
}


async function ensurePrimyProfile(user) {
  if (!supabase || !user?.id) return;
  await supabase.from('primy_profiles').upsert({
    id: user.id,
    email: user.email || null,
    display_name: user.user_metadata?.display_name || null,
    updated_at: new Date().toISOString(),
  });
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
  const [loading, setLoading] = useState(true);
  const [recoveryMode, setRecoveryMode] = useState(false);
  const [notice, setNotice] = useState('');

  useEffect(() => {
    if (!supabase) {
      setLoading(false);
      return undefined;
    }

    let active = true;
    supabase.auth.getSession().then(({ data, error }) => {
      if (!active) return;
      if (!error) {
        setSession(data.session || null);
        if (data.session?.user) ensurePrimyProfile(data.session.user);
      }
      setRecoveryMode(window.location.pathname === '/auth/recovery' && Boolean(data.session));
      setLoading(false);
    });

    const { data: subscription } = supabase.auth.onAuthStateChange((event, nextSession) => {
      if (!active) return;
      setSession(nextSession || null);
      if (nextSession?.user) ensurePrimyProfile(nextSession.user);
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
      subscription.subscription.unsubscribe();
    };
  }, []);

  const signUp = useCallback(async ({ email, password, displayName }) => {
    if (!supabase) return { error: 'Supabase no está configurado.' };
    const { data, error } = await supabase.auth.signUp({
      email: email.trim().toLowerCase(),
      password,
      options: {
        emailRedirectTo: redirectUrl('/auth/confirm'),
        data: {
          display_name: displayName.trim(),
          i18n: 'es',
        },
      },
    });
    return error ? { error: translateAuthError(error) } : { data, needsConfirmation: !data.session };
  }, []);

  const signIn = useCallback(async ({ email, password }) => {
    if (!supabase) return { error: 'Supabase no está configurado.' };
    const { data, error } = await supabase.auth.signInWithPassword({
      email: email.trim().toLowerCase(),
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

  const signOut = useCallback(async () => {
    if (!supabase) return;
    await supabase.auth.signOut();
  }, []);

  return {
    configured: supabaseConfigured,
    session,
    user: session?.user || null,
    loading,
    recoveryMode,
    notice,
    clearNotice: () => setNotice(''),
    signUp,
    signIn,
    signOut,
    resendConfirmation,
    requestPasswordReset,
    updatePassword,
  };
}
