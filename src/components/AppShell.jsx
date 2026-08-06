import React, { useEffect, useRef, useState } from 'react';
import { GridIcon, HomeIcon, ListIcon, PlusIcon, SettingsIcon } from './Icons.jsx';
import { PrimyWordmark } from './BrandVisuals.jsx';
import { Button, Card, StatusNotice } from './DesignSystem.jsx';
import { PrimyMascot } from './PrimyMascot.jsx';
import ReleaseStamp from './ReleaseStamp.jsx';

const NAV = [
  { id: 'dashboard', label: 'Inicio', icon: HomeIcon },
  { id: 'generate', label: 'Preparar', icon: PlusIcon },
  { id: 'explore', label: 'Juegos', icon: GridIcon },
  { id: 'plays', label: 'Archivo', icon: ListIcon },
  { id: 'settings', label: 'Perfil', icon: SettingsIcon },
];

function NavButton({ item, active, onSelect, mobile = false, badge = 0 }) {
  const Icon = item.icon;
  return (
    <button
      type="button"
      onClick={() => onSelect(item.id)}
      aria-current={active ? 'page' : undefined}
      className={mobile ? 'primy-mobile-nav__item' : 'primy-nav-item'}
      data-active={active ? 'true' : 'false'}
    >
      <span className={mobile ? 'primy-mobile-nav__icon' : 'primy-nav-item__icon'}>
        <Icon width={mobile ? 21 : 19} height={mobile ? 21 : 19} aria-hidden="true" />
      </span>
      <span>{item.label}</span>
      {badge > 0 && (
        <span className={mobile ? 'primy-mobile-nav__badge' : 'primy-nav-item__badge'}>
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

export default function AppShell({ view, onNavigate, dueCount = 0, user, displayName = '', onSignOut, syncStatus, lastSyncedAt, pendingSyncCount = 0, children }) {
  const [online, setOnline] = useState(() => navigator.onLine !== false);
  const mainRef = useRef(null);
  const previousViewRef = useRef(view);

  useEffect(() => {
    const update = () => setOnline(navigator.onLine !== false);
    window.addEventListener('online', update);
    window.addEventListener('offline', update);
    return () => {
      window.removeEventListener('online', update);
      window.removeEventListener('offline', update);
    };
  }, []);

  useEffect(() => {
    if (previousViewRef.current === view) return;
    previousViewRef.current = view;
    const frame = window.requestAnimationFrame(() => mainRef.current?.focus({ preventScroll: true }));
    return () => window.cancelAnimationFrame(frame);
  }, [view]);

  const accountName = displayName?.trim() || 'Cuenta Primy';

  return (
    <div className="min-h-screen bg-app text-primary">
      <a href="#main-content" className="sr-only z-50 rounded-xl bg-surface px-4 py-2 font-semibold text-primary focus:not-sr-only focus:fixed focus:left-4 focus:top-4">Ir al contenido</a>

      <aside className="primy-sidebar">
        <div className="primy-sidebar__brand"><PrimyWordmark compact /></div>
        <nav className="primy-sidebar__nav" aria-label="Navegación principal">
          {NAV.map(item => (
            <NavButton
              key={item.id}
              item={item}
              active={view === item.id}
              onSelect={onNavigate}
              badge={item.id === 'plays' ? dueCount : 0}
            />
          ))}
        </nav>

        <Card as="section" tone="inset" padding="sm" className="primy-account-card">
          <div className="primy-account-card__identity">
            <PrimyMascot role="guide" protagonist={false} className="h-11 w-11 shrink-0" />
            <div className="min-w-0">
              <p className="truncate text-sm font-semibold text-primary">{accountName}</p>
              <p className="truncate text-xs text-secondary">{user?.email}</p>
            </div>
          </div>
          <p aria-live="polite" className="primy-account-card__sync">
            <SyncLabel status={syncStatus} lastSyncedAt={lastSyncedAt} pendingCount={pendingSyncCount} />
          </p>
          <Button variant="ghost" size="sm" onClick={onSignOut} className="w-full">Cerrar sesión</Button>
        </Card>
      </aside>

      <header className="primy-mobile-header">
        <PrimyWordmark compact />
        <div className="flex items-center gap-2">
          {dueCount > 0 && (
            <button type="button" onClick={() => onNavigate('plays')} className="ds-badge ds-badge--accent min-h-9 px-3">
              <span className="sr-only">Jugadas pendientes: </span>{dueCount}
            </button>
          )}
          <Button variant="ghost" size="sm" onClick={onSignOut}>Salir</Button>
        </div>
      </header>

      {!online && (
        <div className="primy-connectivity-notice">
          <StatusNotice tone="warning" title="Modo sin conexión">
            Los cambios se guardarán en este dispositivo y se sincronizarán al recuperar internet.
          </StatusNotice>
        </div>
      )}

      <main ref={mainRef} id="main-content" tabIndex="-1" className="primy-main-content" data-view={view}>{children}<footer className="primy-global-footer"><ReleaseStamp/></footer></main>

      <nav className="primy-mobile-nav" aria-label="Navegación principal">
        {NAV.map(item => (
          <NavButton
            key={item.id}
            item={item}
            active={view === item.id}
            onSelect={onNavigate}
            mobile
            badge={item.id === 'plays' ? dueCount : 0}
          />
        ))}
      </nav>
    </div>
  );
}
