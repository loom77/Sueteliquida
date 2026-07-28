import React, { useState } from 'react';
import { CheckIcon, ShieldIcon } from './Icons.jsx';
import { MailGraphic, PrimyMascotGraphic, PrimyWordmark } from './BrandVisuals.jsx';

function Field({ label, type = 'text', value, onChange, autoComplete, minLength, required = true, hint }) {
  return (
    <label className="block text-sm font-semibold text-primary">
      {label}
      <input
        type={type}
        value={value}
        onChange={event => onChange(event.target.value)}
        autoComplete={autoComplete}
        minLength={minLength}
        required={required}
        className="mt-2 min-h-12 w-full rounded-2xl border border-default bg-surface px-4 font-normal text-primary shadow-sm hover:border-primy-300 focus:border-primy-500"
      />
      {hint && <span className="mt-1.5 block text-xs font-normal leading-5 text-secondary">{hint}</span>}
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
    setBusy(true); setError(''); setMessage('');
    try { await action(); } finally { setBusy(false); }
  };

  const submit = event => {
    event.preventDefault();
    if ((mode === 'signup' || mode === 'update-password') && password !== confirmPassword) return setError('Las contraseñas no coinciden.');
    if ((mode === 'signup' || mode === 'update-password') && password.length < 8) return setError('La contraseña debe tener al menos 8 caracteres.');
    run(async () => {
      if (mode === 'signin') {
        const result = await auth.signIn({ email, password }); if (result.error) setError(result.error);
      } else if (mode === 'signup') {
        const result = await auth.signUp({ email, password, displayName });
        if (result.error) setError(result.error); else if (result.needsConfirmation) setMode('check-email');
      } else if (mode === 'forgot') {
        const result = await auth.requestPasswordReset(email);
        if (result.error) setError(result.error); else setMessage('Te hemos enviado un correo para restablecer la contraseña.');
      } else if (mode === 'update-password') {
        const result = await auth.updatePassword(password); if (result.error) setError(result.error);
      }
    });
  };

  const resend = () => run(async () => {
    const result = await auth.resendConfirmation(email);
    if (result.error) setError(result.error); else setMessage('Correo de confirmación enviado de nuevo.');
  });

  if (!auth.configured) {
    return <main className="flex min-h-screen items-center justify-center bg-app px-4 py-10 text-primary"><section className="primy-panel w-full max-w-lg p-8 text-center"><PrimyWordmark className="justify-center"/><h1 className="mt-6 text-2xl font-semibold">Primy no está configurada</h1><p className="mt-3 text-sm leading-6 text-secondary">Faltan las variables VITE_SUPABASE_URL y VITE_SUPABASE_PUBLISHABLE_KEY en el despliegue.</p></section></main>;
  }

  if (mode === 'check-email') {
    return (
      <main className="flex min-h-screen items-center justify-center bg-app px-4 py-10 text-primary">
        <section className="primy-panel w-full max-w-xl p-7 text-center sm:p-10">
          <MailGraphic className="mx-auto h-40 w-52"/>
          <p className="mt-2 text-sm font-semibold text-primy-700">Confirma tu correo</p>
          <h1 className="mt-2 text-3xl font-semibold tracking-tight">Revisa tu bandeja de entrada</h1>
          <p className="mt-3 text-sm leading-6 text-secondary">Hemos enviado un enlace de confirmación a <strong className="text-primary">{email}</strong>. Pulsa el enlace para activar tu cuenta.</p>
          {message && <p role="status" className="mt-5 rounded-2xl bg-primy-50 p-4 text-sm font-semibold text-primy-900">{message}</p>}
          {error && <p role="alert" className="mt-5 rounded-2xl bg-rose-50 p-4 text-sm font-semibold text-rose-900">{error}</p>}
          <div className="mt-6 grid gap-3 sm:grid-cols-2">
            <button type="button" onClick={resend} disabled={busy} className="min-h-12 rounded-2xl border border-primy-200 px-4 font-semibold hover:bg-primy-50 disabled:opacity-60">Reenviar correo</button>
            <button type="button" onClick={() => setMode('signin')} className="min-h-12 rounded-2xl bg-primy-700 px-4 font-semibold text-white hover:bg-primy-800">Volver a iniciar sesión</button>
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
    <main className="min-h-screen bg-app px-4 py-7 text-primary sm:py-10">
      <div className="mx-auto grid w-full max-w-6xl overflow-hidden rounded-[2rem] border border-primy-100 bg-surface shadow-lift lg:grid-cols-[1fr_1fr]">
        <section className="relative overflow-hidden bg-gradient-to-br from-primy-800 via-primy-700 to-primy-600 p-7 text-white sm:p-10 lg:min-h-[720px]">
          <div className="relative z-10"><PrimyWordmark className="[&_p]:text-white"/></div>
          <div className="relative z-10 mt-10 max-w-lg">
            <p className="inline-flex rounded-full bg-white/10 px-3 py-1.5 text-xs font-semibold text-primy-50">Tu asistente privado de juego</p>
            <h1 className="mt-5 text-4xl font-semibold tracking-[-0.04em] sm:text-5xl">Tus jugadas, siempre contigo.</h1>
            <p className="mt-5 max-w-md text-sm leading-7 text-primy-50">Una forma clara, bonita y responsable de crear combinaciones, guardar boletos y saber cuándo comprobarlos.</p>
          </div>
          <PrimyMascotGraphic className="relative z-10 mt-8 w-full max-w-xl" size="hero" caption="Tu compañera de jugadas"/>
          <ul className="relative z-10 mt-6 grid gap-3 text-sm sm:grid-cols-3 lg:grid-cols-1 xl:grid-cols-3">
            {['Cuenta privada', 'Datos sincronizados', 'Control del gasto'].map(item => <li key={item} className="flex items-center gap-2 rounded-2xl bg-white/10 px-3 py-3 font-medium"><CheckIcon width="17" height="17"/>{item}</li>)}
          </ul>
        </section>

        <section className="flex items-center p-7 sm:p-10 lg:p-12">
          <div className="w-full">
            <div className="flex items-center gap-2 text-sm font-semibold text-primy-700"><ShieldIcon width="18" height="18"/>Cuenta Primy</div>
            <h2 className="mt-3 text-3xl font-semibold tracking-[-0.035em] sm:text-4xl">{title}</h2>
            <p className="mt-3 text-sm leading-6 text-secondary">{subtitle}</p>

            <form onSubmit={submit} className="mt-8 space-y-5">
              {mode === 'signup' && <Field label="Nombre" value={displayName} onChange={setDisplayName} autoComplete="name" hint="Se utiliza únicamente para personalizar tu cuenta."/>}
              {mode !== 'update-password' && <Field label="Correo electrónico" type="email" value={email} onChange={setEmail} autoComplete="email"/>}
              {(mode === 'signin' || mode === 'signup' || mode === 'update-password') && <Field label={mode === 'update-password' ? 'Nueva contraseña' : 'Contraseña'} type="password" value={password} onChange={setPassword} autoComplete={mode === 'signin' ? 'current-password' : 'new-password'} minLength={8} hint={mode !== 'signin' ? 'Mínimo 8 caracteres.' : undefined}/>} 
              {mode === 'signup' && <Field label="Repite la contraseña" type="password" value={confirmPassword} onChange={setConfirmPassword} autoComplete="new-password" minLength={8}/>} 
              {mode === 'update-password' && <Field label="Repite la nueva contraseña" type="password" value={confirmPassword} onChange={setConfirmPassword} autoComplete="new-password" minLength={8}/>} 
              {error && <p role="alert" className="rounded-2xl bg-rose-50 p-4 text-sm font-semibold leading-6 text-rose-900">{error}</p>}
              {message && <p role="status" className="rounded-2xl bg-primy-50 p-4 text-sm font-semibold leading-6 text-primy-900">{message}</p>}
              <button type="submit" disabled={busy} className="min-h-14 w-full rounded-2xl bg-primy-700 px-5 font-semibold text-white shadow-soft hover:bg-primy-800 disabled:opacity-60">
                {busy ? 'Procesando…' : mode === 'signin' ? 'Iniciar sesión' : mode === 'signup' ? 'Crear cuenta' : mode === 'forgot' ? 'Enviar enlace' : 'Guardar nueva contraseña'}
              </button>
            </form>

            <div className="mt-6 flex flex-wrap gap-x-5 gap-y-3 text-sm font-semibold">
              {mode === 'signin' && <><button type="button" onClick={() => { setMode('signup'); setError(''); }} className="text-primy-700 hover:underline">Crear una cuenta</button><button type="button" onClick={() => { setMode('forgot'); setError(''); }} className="text-secondary hover:text-primary hover:underline">He olvidado mi contraseña</button></>}
              {(mode === 'signup' || mode === 'forgot') && <button type="button" onClick={() => { setMode('signin'); setError(''); setMessage(''); }} className="text-primy-700 hover:underline">Volver a iniciar sesión</button>}
            </div>
          </div>
        </section>
      </div>
    </main>
  );
}
