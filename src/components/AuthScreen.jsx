import React, { useState } from 'react';
import { CheckIcon, ShieldIcon } from './Icons.jsx';
import { PrimyMascotGraphic, PrimyWordmark } from './BrandVisuals.jsx';
import ReleaseStamp from './ReleaseStamp.jsx';

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
  // Web testing policy: account creation is intentionally unavailable here.
  // Android keeps its own sign-up flow against the same Supabase project.
  const [mode, setMode] = useState(initialMode === 'update-password' ? 'update-password' : 'signin');
  const [email, setEmail] = useState('');
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
    if (mode === 'update-password' && password !== confirmPassword) return setError('Las contraseñas no coinciden.');
    if (mode === 'update-password' && password.length < 8) return setError('La contraseña debe tener al menos 8 caracteres.');
    run(async () => {
      if (mode === 'signin') {
        const result = await auth.signIn({ email, password });
        if (result.error) setError(result.error);
      } else if (mode === 'forgot') {
        const result = await auth.requestPasswordReset(email);
        if (result.error) setError(result.error); else setMessage('Te hemos enviado un correo para restablecer la contraseña.');
      } else if (mode === 'update-password') {
        const result = await auth.updatePassword(password);
        if (result.error) setError(result.error);
      }
    });
  };

  if (!auth.configured) {
    return <main className="flex min-h-screen items-center justify-center bg-app px-4 py-10 text-primary"><section className="primy-panel w-full max-w-lg p-8 text-center"><PrimyWordmark className="justify-center"/><h1 className="mt-6 text-2xl font-semibold">Primy no está configurada</h1><p className="mt-3 text-sm leading-6 text-secondary">Faltan las variables VITE_SUPABASE_URL y VITE_SUPABASE_PUBLISHABLE_KEY en el despliegue.</p><ReleaseStamp className="mt-6 block"/></section></main>;
  }

  const titles = {
    signin: ['Bienvenido de nuevo', 'Acceso web reservado a la cuenta de pruebas existente.'],
    forgot: ['Recupera tu contraseña', 'Te enviaremos un enlace seguro por correo.'],
    'update-password': ['Elige una nueva contraseña', 'La nueva contraseña debe tener al menos 8 caracteres.'],
  };
  const [title, subtitle] = titles[mode] || titles.signin;

  return (
    <main className="primy-page-enter min-h-screen bg-app px-4 py-4 text-primary sm:px-6 lg:py-6">
      <div className="mx-auto grid w-full max-w-[1040px] overflow-hidden rounded-[2rem] border border-primy-100 bg-ivory shadow-lift lg:grid-cols-[400px_minmax(0,1fr)]">
        <section className="relative overflow-hidden bg-gradient-to-br from-primy-800 via-primy-700 to-primy-600 p-6 text-white sm:p-8">
          <div className="relative z-10 flex h-full flex-col">
            <PrimyWordmark className="[&_p]:text-white"/>
            <div className="mt-7">
              <p className="inline-flex rounded-full bg-white/10 px-3 py-1.5 text-xs font-semibold text-primy-50">Entorno web de pruebas</p>
              <h1 className="mt-4 text-4xl font-semibold tracking-[-0.045em] text-white sm:text-[3rem]">Tus jugadas, siempre contigo.</h1>
              <p className="mt-4 text-sm leading-7 text-primy-50">La web mantiene el acceso a la cuenta existente mientras desarrollamos y validamos la aplicación Android.</p>
            </div>
            <PrimyMascotGraphic className="mt-6 w-full" variant="welcome" size="dashboard" caption="Entorno de pruebas Primy"/>
            <div className="mt-5 grid gap-2 text-sm sm:grid-cols-3 lg:grid-cols-1">
              {['Acceso privado', 'Datos sincronizados', 'Registro web cerrado'].map(item => <div key={item} className="flex items-center gap-2 rounded-2xl bg-white/10 px-3 py-2.5 font-medium"><CheckIcon width="17" height="17"/>{item}</div>)}
            </div>
          </div>
        </section>

        <section className="flex items-start bg-[linear-gradient(180deg,#fffdf8_0%,#ffffff_55%,#f7fbf8_100%)] p-5 sm:p-8 lg:p-9">
          <div className="w-full">
            <div className="flex items-center gap-2 text-sm font-semibold text-primy-700"><ShieldIcon width="18" height="18"/>Cuenta Primy</div>
            <h2 className="mt-3 text-3xl font-semibold tracking-[-0.04em] text-primary sm:text-[2.55rem]">{title}</h2>
            <p className="mt-3 max-w-lg text-sm leading-6 text-secondary">{subtitle}</p>

            {auth.notice && (
              <p role="status" className="mt-5 rounded-2xl border border-amber-200 bg-amber-50 p-4 text-sm font-semibold leading-6 text-amber-950">
                {auth.notice}
              </p>
            )}

            {mode === 'signin' && (
              <div className="mt-5 rounded-2xl border border-amber-200 bg-amber-50 p-4 text-sm leading-6 text-amber-950" role="note">
                <strong>Registro web temporalmente cerrado.</strong> No se pueden crear cuentas nuevas desde esta versión web de pruebas.
              </div>
            )}

            <form onSubmit={submit} className="mt-7 space-y-4">
              {mode !== 'update-password' && <Field label="Correo electrónico" type="email" value={email} onChange={setEmail} autoComplete="email"/>}
              {(mode === 'signin' || mode === 'update-password') && <Field label={mode === 'update-password' ? 'Nueva contraseña' : 'Contraseña'} type="password" value={password} onChange={setPassword} autoComplete={mode === 'signin' ? 'current-password' : 'new-password'} minLength={8} hint={mode === 'update-password' ? 'Mínimo 8 caracteres.' : undefined}/>}              
              {mode === 'update-password' && <Field label="Repite la nueva contraseña" type="password" value={confirmPassword} onChange={setConfirmPassword} autoComplete="new-password" minLength={8}/>}              
              {error && <p role="alert" className="rounded-2xl bg-rose-50 p-4 text-sm font-semibold leading-6 text-rose-900">{error}</p>}
              {message && <p role="status" className="rounded-2xl bg-primy-50 p-4 text-sm font-semibold leading-6 text-primy-900">{message}</p>}
              <button type="submit" disabled={busy} className="primy-shimmer min-h-14 w-full rounded-2xl bg-primy-700 px-5 font-semibold text-white shadow-soft hover:bg-primy-800 disabled:opacity-60">
                {busy ? 'Procesando…' : mode === 'signin' ? 'Iniciar sesión' : mode === 'forgot' ? 'Enviar enlace' : 'Guardar nueva contraseña'}
              </button>
            </form>

            <div className="mt-6 flex flex-wrap gap-x-5 gap-y-3 text-sm font-semibold">
              {mode === 'signin' && <button type="button" onClick={() => { setMode('forgot'); setError(''); setMessage(''); }} className="text-secondary hover:text-primary hover:underline">He olvidado mi contraseña</button>}
              {(mode === 'forgot' || mode === 'update-password') && <button type="button" onClick={() => { setMode('signin'); setError(''); setMessage(''); }} className="text-primy-700 hover:underline">Volver a iniciar sesión</button>}
            </div>

            <div className="mt-7 grid gap-3 border-t border-primy-100 pt-5 text-xs leading-5 text-secondary sm:grid-cols-2">
              <p><strong className="text-primary">Sin acceso con Google.</strong> Solo email y contraseña.</p>
              <p><strong className="text-primary">Registro cerrado en web.</strong> La cuenta de pruebas existente permanece activa.</p>
            </div>
            <nav className="mt-4 flex flex-wrap gap-3 text-xs font-semibold text-primy-700" aria-label="Información legal">
              <a href="/legal/terms.html" className="hover:underline">Condiciones</a>
              <a href="/legal/privacy.html" className="hover:underline">Privacidad</a>
              <a href="/legal/responsible-play.html" className="hover:underline">Juego responsable</a>
            </nav>
          </div>
        </section>
      </div>
      <ReleaseStamp className="mx-auto mt-4 block text-center"/>
    </main>
  );
}
