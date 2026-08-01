import { useCallback, useEffect, useMemo, useState } from 'react';
import { supabase, supabaseConfigured } from '../lib/supabase.js';

function redirectUrl(path) {
  return `${window.location.origin}${path}`;
}

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
    supabase.auth.getSession().then(({ data, error }) => {
      if (!active) return;
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
      subscription.subscription.unsubscribe();
    };
  }, [hydrateProfile]);

  const signUp = useCallback(async ({ email, password, displayName, adultDeclaration }) => {
    if (!supabase) return { error: 'Supabase no está configurado.' };
    const normalizedName = cleanDisplayName(displayName);
    if (normalizedName.length < 2) return { error: 'Indica cómo quieres que Primy te llame.' };
    const { data, error } = await supabase.auth.signUp({
      email: email.trim().toLowerCase(),
      password,
      options: {
        emailRedirectTo: redirectUrl('/auth/confirm'),
        data: {
          display_name: normalizedName,
          i18n: 'es',
          adult_declaration_at: adultDeclaration ? new Date().toISOString() : null,
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
    signUp,
    signIn,
    signOut,
    resendConfirmation,
    requestPasswordReset,
    updatePassword,
    updateDisplayName,
  };
}
