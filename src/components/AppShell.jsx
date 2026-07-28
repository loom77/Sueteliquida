import React, { useEffect, useState } from 'react';
import { HomeIcon, ListIcon, PlusIcon, SettingsIcon, SparklesIcon } from './Icons.jsx';

const NAV = [
  { id: 'dashboard', label: 'Inicio', icon: HomeIcon },
  { id: 'generate', label: 'Crear jugada', icon: PlusIcon },
  { id: 'plays', label: 'Mis jugadas', icon: ListIcon },
  { id: 'settings', label: 'Ajustes', icon: SettingsIcon },
];

function NavButton({ item, active, onSelect, mobile = false, badge = 0 }) {
  const Icon = item.icon;
  return (
    <button type="button" onClick={() => onSelect(item.id)} aria-current={active ? 'page' : undefined} className={mobile ? `relative flex min-h-14 flex-1 flex-col items-center justify-center gap-1 px-2 text-xs font-bold ${active ? 'text-indigo-700' : 'text-secondary'}` : `relative flex min-h-12 w-full items-center gap-3 rounded-xl px-3 py-2 text-left text-sm font-bold transition ${active ? 'bg-slate-950 text-white' : 'text-secondary hover:bg-muted-strong hover:text-primary'}`}>
      <Icon width={mobile ? 21 : 19} height={mobile ? 21 : 19}/><span>{item.label}</span>
      {badge > 0 && <span className={mobile ? 'absolute right-[calc(50%-22px)] top-1 min-w-5 rounded-full bg-amber-500 px-1 text-center text-xs leading-5 text-primary' : 'ml-auto min-w-6 rounded-full bg-amber-400 px-1.5 text-center text-xs leading-6 text-primary'}>{badge > 99 ? '99+' : badge}</span>}
    </button>
  );
}

function SyncLabel({ status, lastSyncedAt }) {
  if (status === 'syncing' || status === 'loading') return <span className="text-amber-700">Sincronizando…</span>;
  if (status === 'offline') return <span className="text-amber-700">Pendiente de sincronizar</span>;
  if (status === 'error') return <span className="text-rose-700">Sin conexión con la cuenta</span>;
  if (status === 'synced') {
    const time = lastSyncedAt ? new Intl.DateTimeFormat('es-ES', { hour: '2-digit', minute: '2-digit' }).format(lastSyncedAt) : '';
    return <span className="text-emerald-700">Sincronizado{time ? ` · ${time}` : ''}</span>;
  }
  return <span className="text-secondary">Cuenta conectada</span>;
}

export default function AppShell({ view, onNavigate, dueCount = 0, user, onSignOut, syncStatus, lastSyncedAt, children }) {
  const [online, setOnline] = useState(() => navigator.onLine !== false);
  useEffect(() => {
    const update = () => setOnline(navigator.onLine !== false);
    window.addEventListener('online', update);
    window.addEventListener('offline', update);
    return () => { window.removeEventListener('online', update); window.removeEventListener('offline', update); };
  }, []);

  const displayName = user?.user_metadata?.display_name?.trim() || user?.email?.split('@')[0] || 'Cuenta';
  const initial = displayName.charAt(0).toUpperCase();

  return (
    <div className="min-h-screen bg-app text-primary">
      <a href="#main-content" className="sr-only z-50 rounded-lg bg-surface px-4 py-2 font-bold text-primary focus:not-sr-only focus:fixed focus:left-4 focus:top-4">Ir al contenido</a>
      <aside className="fixed inset-y-0 left-0 z-30 hidden w-64 flex-col border-r border-default bg-surface p-5 lg:flex">
        <div className="flex items-center gap-3"><span className="flex h-11 w-11 items-center justify-center rounded-2xl bg-slate-950 text-white"><SparklesIcon width="21" height="21"/></span><div><p className="text-lg font-black text-primary">Primy</p><p className="text-xs text-secondary">Asistente privado de juego</p></div></div>
        <nav className="mt-8 space-y-2" aria-label="Navegación principal">{NAV.map(item => <NavButton key={item.id} item={item} active={view === item.id} onSelect={onNavigate} badge={item.id === 'plays' ? dueCount : 0}/>)}</nav>
        <section className="mt-auto rounded-2xl border border-default bg-muted p-3">
          <div className="flex items-center gap-3">
            <span className="flex h-10 w-10 shrink-0 items-center justify-center rounded-full bg-indigo-100 font-black text-indigo-800">{initial}</span>
            <div className="min-w-0"><p className="truncate text-sm font-black text-primary">{displayName}</p><p className="truncate text-xs text-secondary">{user?.email}</p></div>
          </div>
          <p className="mt-3 text-xs font-bold"><SyncLabel status={syncStatus} lastSyncedAt={lastSyncedAt}/></p>
          <button type="button" onClick={onSignOut} className="mt-3 min-h-10 w-full rounded-xl border border-default bg-surface px-3 text-sm font-black text-primary hover:bg-muted-strong">Cerrar sesión</button>
        </section>
      </aside>
      <header className="sticky top-0 z-20 border-b border-default bg-surface/95 px-4 py-3 backdrop-blur lg:hidden">
        <div className="flex items-center justify-between gap-3">
          <div className="flex min-w-0 items-center gap-3"><span className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl bg-slate-950 text-white"><SparklesIcon width="19" height="19"/></span><div className="min-w-0"><p className="font-black">Primy</p><p className="truncate text-xs text-secondary">{NAV.find(item => item.id === view)?.label} · {user?.email}</p></div></div>
          <div className="flex items-center gap-2">{dueCount > 0 && <button type="button" onClick={() => onNavigate('plays')} className="rounded-full bg-amber-100 px-3 py-1.5 text-xs font-black text-amber-950">{dueCount}</button>}<button type="button" onClick={onSignOut} className="min-h-10 rounded-xl border border-default px-3 text-xs font-black text-primary">Salir</button></div>
        </div>
      </header>
      {!online && <div role="status" className="border-b border-amber-300 bg-amber-100 px-4 py-2 text-center text-sm font-bold text-amber-950 lg:ml-64">Modo sin conexión: los cambios se guardarán en este dispositivo y se sincronizarán al recuperar internet.</div>}
      <main id="main-content" className="pb-24 lg:ml-64 lg:pb-0">{children}</main>
      <nav className="fixed inset-x-0 bottom-0 z-30 flex border-t border-default bg-surface pb-[env(safe-area-inset-bottom)] lg:hidden" aria-label="Navegación principal">{NAV.map(item => <NavButton key={item.id} item={item} active={view === item.id} onSelect={onNavigate} mobile badge={item.id === 'plays' ? dueCount : 0}/>)}</nav>
    </div>
  );
}
