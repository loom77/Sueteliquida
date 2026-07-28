import React, { useState } from 'react';
import { SparklesIcon } from './Icons.jsx';

function Field({ label, type = 'text', value, onChange, autoComplete, minLength, required = true, hint }) {
  return (
    <label className="block text-sm font-bold text-primary">
      {label}
      <input
        type={type}
        value={value}
        onChange={event => onChange(event.target.value)}
        autoComplete={autoComplete}
        minLength={minLength}
        required={required}
        className="mt-2 min-h-12 w-full rounded-xl border border-default bg-surface px-4 font-normal text-primary"
      />
      {hint && <span className="mt-1 block text-xs font-normal leading-5 text-secondary">{hint}</span>}
    </label>
  );
}

export default function AuthScreen({ auth, initialMode = 'signin' }) {
  const [mode, setMode] = useState(initialMode);
  const [email, setEmail] = useState('');
  const [displayName, setDisplayName] = useState('');
  const [password, setPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState('');
  const [message, setMessage] = useState('');

  const run = async action => {
    setBusy(true);
    setError('');
    setMessage('');
    try { await action(); }
    finally { setBusy(false); }
  };

  const submit = event => {
    event.preventDefault();
    if ((mode === 'signup' || mode === 'update-password') && password !== confirmPassword) {
      setError('Las contraseñas no coinciden.');
      return;
    }
    if ((mode === 'signup' || mode === 'update-password') && password.length < 8) {
      setError('La contraseña debe tener al menos 8 caracteres.');
      return;
    }

    run(async () => {
      if (mode === 'signin') {
        const result = await auth.signIn({ email, password });
        if (result.error) setError(result.error);
      } else if (mode === 'signup') {
        const result = await auth.signUp({ email, password, displayName });
        if (result.error) setError(result.error);
        else if (result.needsConfirmation) setMode('check-email');
      } else if (mode === 'forgot') {
        const result = await auth.requestPasswordReset(email);
        if (result.error) setError(result.error);
        else setMessage('Te hemos enviado un correo para restablecer la contraseña.');
      } else if (mode === 'update-password') {
        const result = await auth.updatePassword(password);
        if (result.error) setError(result.error);
      }
    });
  };

  const resend = () => run(async () => {
    const result = await auth.resendConfirmation(email);
    if (result.error) setError(result.error);
    else setMessage('Correo de confirmación enviado de nuevo.');
  });

  if (!auth.configured) {
    return (
      <main className="flex min-h-screen items-center justify-center bg-app px-4 py-10 text-primary">
        <section className="w-full max-w-lg rounded-3xl border border-default bg-surface p-7 text-center sm:p-9">
          <span className="mx-auto flex h-14 w-14 items-center justify-center rounded-2xl bg-slate-950 text-white"><SparklesIcon width="26" height="26"/></span>
          <h1 className="mt-5 text-2xl font-black">Primy no está configurada</h1>
          <p className="mt-3 text-sm leading-6 text-secondary">Faltan las variables VITE_SUPABASE_URL y VITE_SUPABASE_PUBLISHABLE_KEY en el despliegue.</p>
        </section>
      </main>
    );
  }

  if (mode === 'check-email') {
    return (
      <main className="flex min-h-screen items-center justify-center bg-app px-4 py-10 text-primary">
        <section className="w-full max-w-lg rounded-3xl border border-default bg-surface p-7 text-center sm:p-9">
          <span className="mx-auto flex h-14 w-14 items-center justify-center rounded-2xl bg-indigo-600 text-white"><SparklesIcon width="26" height="26"/></span>
          <p className="mt-5 text-sm font-black text-indigo-700">Confirma tu correo</p>
          <h1 className="mt-1 text-3xl font-black tracking-tight">Revisa tu bandeja de entrada</h1>
          <p className="mt-3 text-sm leading-6 text-secondary">Hemos enviado un enlace de confirmación a <strong className="text-primary">{email}</strong>. Pulsa el enlace para activar tu cuenta.</p>
          {message && <p role="status" className="mt-5 rounded-xl bg-emerald-50 p-4 text-sm font-bold text-emerald-900">{message}</p>}
          {error && <p role="alert" className="mt-5 rounded-xl bg-rose-50 p-4 text-sm font-bold text-rose-900">{error}</p>}
          <div className="mt-6 grid gap-3 sm:grid-cols-2">
            <button type="button" onClick={resend} disabled={busy} className="min-h-12 rounded-xl border border-default px-4 font-black hover:bg-muted disabled:opacity-60">Reenviar correo</button>
            <button type="button" onClick={() => setMode('signin')} className="min-h-12 rounded-xl bg-slate-950 px-4 font-black text-white hover:bg-slate-800">Volver a iniciar sesión</button>
          </div>
        </section>
      </main>
    );
  }

  const titles = {
    signin: ['Bienvenido de nuevo', 'Accede a tus jugadas desde cualquier dispositivo.'],
    signup: ['Crea tu cuenta', 'Tus jugadas quedarán privadas y sincronizadas.'],
    forgot: ['Recupera tu contraseña', 'Te enviaremos un enlace seguro por correo.'],
    'update-password': ['Elige una nueva contraseña', 'La nueva contraseña debe tener al menos 8 caracteres.'],
  };
  const [title, subtitle] = titles[mode];

  return (
    <main className="min-h-screen bg-app px-4 py-8 text-primary sm:py-12">
      <div className="mx-auto grid w-full max-w-5xl overflow-hidden rounded-3xl border border-default bg-surface lg:grid-cols-[0.9fr_1.1fr]">
        <section className="bg-slate-950 p-7 text-white sm:p-10">
          <span className="flex h-12 w-12 items-center justify-center rounded-2xl bg-white/10"><SparklesIcon width="23" height="23"/></span>
          <p className="mt-6 text-xl font-black">Primy</p>
          <h1 className="mt-10 text-3xl font-black tracking-tight sm:text-4xl">Tus jugadas, siempre contigo.</h1>
          <p className="mt-4 max-w-md text-sm leading-7 text-slate-300">Regístrate con correo y contraseña. No usamos acceso con Google ni compartimos tus jugadas con otros usuarios.</p>
          <ul className="mt-8 space-y-3 text-sm text-slate-200">
            <li>✓ Correo verificado antes del primer acceso</li>
            <li>✓ Datos separados por cuenta</li>
            <li>✓ Sincronización entre dispositivos</li>
          </ul>
        </section>

        <section className="p-7 sm:p-10">
          <p className="text-sm font-black text-indigo-700">Cuenta Primy</p>
          <h2 className="mt-1 text-3xl font-black tracking-tight">{title}</h2>
          <p className="mt-2 text-sm leading-6 text-secondary">{subtitle}</p>

          <form onSubmit={submit} className="mt-7 space-y-5">
            {mode === 'signup' && <Field label="Nombre" value={displayName} onChange={setDisplayName} autoComplete="name" hint="Se utiliza únicamente para personalizar tu cuenta."/>}
            {mode !== 'update-password' && <Field label="Correo electrónico" type="email" value={email} onChange={setEmail} autoComplete="email"/>}
            {(mode === 'signin' || mode === 'signup' || mode === 'update-password') && <Field label={mode === 'update-password' ? 'Nueva contraseña' : 'Contraseña'} type="password" value={password} onChange={setPassword} autoComplete={mode === 'signin' ? 'current-password' : 'new-password'} minLength={8} hint={mode !== 'signin' ? 'Mínimo 8 caracteres.' : undefined}/>} 
            {mode === 'signup' && <Field label="Repite la contraseña" type="password" value={confirmPassword} onChange={setConfirmPassword} autoComplete="new-password" minLength={8}/>} 
            {mode === 'update-password' && <Field label="Repite la nueva contraseña" type="password" value={confirmPassword} onChange={setConfirmPassword} autoComplete="new-password" minLength={8}/>} 

            {error && <p role="alert" className="rounded-xl bg-rose-50 p-4 text-sm font-bold leading-6 text-rose-900">{error}</p>}
            {message && <p role="status" className="rounded-xl bg-emerald-50 p-4 text-sm font-bold leading-6 text-emerald-900">{message}</p>}

            <button type="submit" disabled={busy} className="min-h-12 w-full rounded-xl bg-slate-950 px-5 font-black text-white hover:bg-slate-800 disabled:opacity-60">
              {busy ? 'Procesando…' : mode === 'signin' ? 'Iniciar sesión' : mode === 'signup' ? 'Crear cuenta' : mode === 'forgot' ? 'Enviar enlace' : 'Guardar nueva contraseña'}
            </button>
          </form>

          <div className="mt-6 flex flex-wrap gap-x-5 gap-y-3 text-sm font-bold">
            {mode === 'signin' && <><button type="button" onClick={() => { setMode('signup'); setError(''); }} className="text-indigo-700 hover:underline">Crear una cuenta</button><button type="button" onClick={() => { setMode('forgot'); setError(''); }} className="text-secondary hover:text-primary hover:underline">He olvidado mi contraseña</button></>}
            {(mode === 'signup' || mode === 'forgot') && <button type="button" onClick={() => { setMode('signin'); setError(''); setMessage(''); }} className="text-indigo-700 hover:underline">Volver a iniciar sesión</button>}
          </div>
        </section>
      </div>
    </main>
  );
}
