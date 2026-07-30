import React, { useEffect, useRef, useState } from 'react';
import { ChartIcon, HomeIcon, ListIcon, PlusIcon, SettingsIcon } from './Icons.jsx';
import { PrimyMark, PrimyMascotAvatar, PrimyWordmark } from './BrandVisuals.jsx';

const NAV = [
  { id: 'dashboard', label: 'Inicio', icon: HomeIcon },
  { id: 'generate', label: 'Crear', icon: PlusIcon },
  { id: 'explore', label: 'Explorar', icon: ChartIcon },
  { id: 'plays', label: 'Archivo', icon: ListIcon },
  { id: 'settings', label: 'Perfil', icon: SettingsIcon },
];

function NavButton({ item, active, onSelect, mobile = false, badge = 0 }) {
  const Icon = item.icon;
  const desktopClass = active
    ? 'bg-primy-700 text-white shadow-soft'
    : 'text-secondary hover:bg-primy-50 hover:text-primy-800';
  const mobileClass = active ? 'text-primy-700' : 'text-secondary';
  return (
    <button
      type="button"
      onClick={() => onSelect(item.id)}
      aria-current={active ? 'page' : undefined}
      className={mobile
        ? `relative flex min-h-16 flex-1 flex-col items-center justify-center gap-1 px-2 text-xs font-semibold ${mobileClass}`
        : `relative flex min-h-12 w-full items-center gap-3 rounded-2xl px-4 py-2.5 text-left text-sm font-semibold ${desktopClass}`}
    >
      <span className={mobile && active ? 'flex h-8 w-11 items-center justify-center rounded-full bg-primy-100' : ''}>
        <Icon width={mobile ? 21 : 19} height={mobile ? 21 : 19}/>
      </span>
      <span>{item.label}</span>
      {badge > 0 && (
        <span className={mobile
          ? 'absolute right-[calc(50%-28px)] top-1 min-w-5 rounded-full bg-gold px-1 text-center text-[11px] font-bold leading-5 text-primary'
          : 'ml-auto min-w-6 rounded-full bg-gold px-1.5 text-center text-xs font-bold leading-6 text-primary'}>
          <span aria-hidden="true">{badge > 99 ? '99+' : badge}</span>
          <span className="sr-only">{badge} {badge === 1 ? 'jugada pendiente' : 'jugadas pendientes'}</span>
        </span>
      )}
    </button>
  );
}

function SyncLabel({ status, lastSyncedAt, pendingCount = 0 }) {
  if (status === 'syncing' || status === 'loading') return <span className="text-amber-700">Sincronizando…</span>;
  if (status === 'offline') return <span className="text-amber-700">{pendingCount ? `${pendingCount} ${pendingCount === 1 ? 'cambio pendiente' : 'cambios pendientes'}` : 'Pendiente de sincronizar'}</span>;
  if (status === 'error') return <span className="text-rose-700">Sin conexión con la cuenta</span>;
  if (status === 'synced') {
    const time = lastSyncedAt ? new Intl.DateTimeFormat('es-ES', { hour: '2-digit', minute: '2-digit' }).format(lastSyncedAt) : '';
    return <span className="text-primy-700">Sincronizado{time ? ` · ${time}` : ''}</span>;
  }
  return <span className="text-secondary">Cuenta conectada</span>;
}

export default function AppShell({ view, onNavigate, dueCount = 0, user, onSignOut, syncStatus, lastSyncedAt, pendingSyncCount = 0, children }) {
  const [online, setOnline] = useState(() => navigator.onLine !== false);
  const mainRef = useRef(null);
  const previousViewRef = useRef(view);
  useEffect(() => {
    const update = () => setOnline(navigator.onLine !== false);
    window.addEventListener('online', update);
    window.addEventListener('offline', update);
    return () => { window.removeEventListener('online', update); window.removeEventListener('offline', update); };
  }, []);

  useEffect(() => {
    if (previousViewRef.current === view) return;
    previousViewRef.current = view;
    const frame = window.requestAnimationFrame(() => mainRef.current?.focus({ preventScroll: true }));
    return () => window.cancelAnimationFrame(frame);
  }, [view]);

  const displayName = user?.user_metadata?.display_name?.trim() || user?.email?.split('@')[0] || 'Cuenta';

  return (
    <div className="min-h-screen bg-app text-primary">
      <a href="#main-content" className="sr-only z-50 rounded-xl bg-surface px-4 py-2 font-semibold text-primary focus:not-sr-only focus:fixed focus:left-4 focus:top-4">Ir al contenido</a>

      <aside className="fixed inset-y-0 left-0 z-30 hidden w-72 flex-col border-r border-primy-100 bg-surface/95 p-5 backdrop-blur lg:flex">
        <PrimyWordmark/>
        <div className="primy-card-enter mt-7 rounded-3xl bg-gradient-to-br from-primy-700 to-primy-900 p-5 text-white">
          <p className="font-display text-lg font-semibold">Todo lo que necesitas para vivir cada sorteo con claridad.</p>
          <p className="mt-2 text-xs leading-5 text-primy-100">Crea, organiza y comprueba tus jugadas desde un solo lugar.</p>
          <div className="mt-4 flex items-center gap-3" aria-hidden="true">
            <span className="flex h-10 w-10 items-center justify-center rounded-2xl bg-white/95 shadow-sm"><PrimyMark className="h-8 w-8" title="" /></span>
            <span className="h-px flex-1 bg-white/30" />
            <span className="h-3 w-3 rounded-full bg-gold shadow-[0_0_0_5px_rgba(244,200,74,.15)]" />
          </div>
        </div>
        <nav className="mt-7 space-y-2" aria-label="Navegación principal">
          {NAV.map(item => <NavButton key={item.id} item={item} active={view === item.id} onSelect={onNavigate} badge={item.id === 'plays' ? dueCount : 0}/>) }
        </nav>
        <section className="mt-auto rounded-3xl border border-primy-100 bg-primy-50 p-4">
          <div className="flex items-center gap-3">
            <span className="flex h-12 w-12 shrink-0 items-center justify-center overflow-hidden rounded-full border border-primy-200 bg-ivory"><PrimyMascotAvatar className="h-14 w-14"/></span>
            <div className="min-w-0"><p className="truncate text-sm font-semibold text-primary">{displayName}</p><p className="truncate text-xs text-secondary">{user?.email}</p></div>
          </div>
          <p aria-live="polite" className="mt-3 text-xs font-semibold"><SyncLabel status={syncStatus} lastSyncedAt={lastSyncedAt} pendingCount={pendingSyncCount}/></p>
          <button type="button" onClick={onSignOut} className="mt-3 min-h-10 w-full rounded-xl border border-primy-200 bg-surface px-3 text-sm font-semibold text-primary hover:bg-primy-100">Cerrar sesión</button>
        </section>
      </aside>

      <header className="sticky top-0 z-20 border-b border-primy-100 bg-surface/95 px-4 py-3 backdrop-blur lg:hidden">
        <div className="flex items-center justify-between gap-3">
          <PrimyWordmark compact/>
          <div className="flex items-center gap-2">
            {dueCount > 0 && <button type="button" onClick={() => onNavigate('plays')} className="rounded-full bg-gold px-3 py-1.5 text-xs font-bold text-primary">{dueCount}</button>}
            <button type="button" onClick={onSignOut} className="min-h-10 rounded-xl border border-default px-3 text-xs font-semibold text-primary">Salir</button>
          </div>
        </div>
      </header>

      {!online && <div role="status" className="border-b border-amber-300 bg-amber-100 px-4 py-2 text-center text-sm font-semibold text-amber-950 lg:ml-72">Modo sin conexión: los cambios se guardarán en este dispositivo y se sincronizarán al recuperar internet.</div>}
      <main ref={mainRef} id="main-content" tabIndex="-1" className="pb-24 outline-none lg:ml-72 lg:pb-0">{children}</main>
      <nav className="fixed inset-x-0 bottom-0 z-30 flex border-t border-primy-100 bg-surface/95 pb-[env(safe-area-inset-bottom)] backdrop-blur lg:hidden" aria-label="Navegación principal">
        {NAV.map(item => <NavButton key={item.id} item={item} active={view === item.id} onSelect={onNavigate} mobile badge={item.id === 'plays' ? dueCount : 0}/>) }
      </nav>
    </div>
  );
}
