import React, { memo, useMemo, useRef, useState } from 'react';
import GameSwitch from './GameSwitch.jsx';
import HistoryLab from './HistoryLab.jsx';
import { PrimyMascotGraphic } from './BrandVisuals.jsx';
import { BellIcon, DatabaseIcon, DeviceIcon, DownloadIcon, InfoIcon, InstallIcon, MoonIcon, ShieldIcon, SunIcon, TrashIcon, UploadIcon } from './Icons.jsx';
import { Eyebrow } from './DesignSystem.jsx';

const euro = new Intl.NumberFormat('es-ES', { style: 'currency', currency: 'EUR' });
const syncTime = new Intl.DateTimeFormat('es-ES', { hour: '2-digit', minute: '2-digit' });

const ProfileSection = memo(function ProfileSection({ title, description, icon: Icon, children, className = '' }) {
  return (
    <section className={`primy-profile-section ${className}`}>
      <div className="flex items-start gap-3">
        {Icon && <span className="primy-action-icon" aria-hidden="true"><Icon width="20" height="20"/></span>}
        <div className="min-w-0">
          <h2 className="text-xl font-semibold text-primary">{title}</h2>
          {description && <p className="mt-1 text-sm leading-6 text-secondary">{description}</p>}
        </div>
      </div>
      <div className="mt-5">{children}</div>
    </section>
  );
});

export default function SettingsView({ activeGame, onGameChange, providerStatus, historyState, preferences, updatePreferences, preferenceError, storageError, history, onImport, onClear, onToast, installPrompt, user, onSignOut, syncStatus, lastSyncedAt, pendingSyncCount = 0, onRetrySync }) {
  const fileRef = useRef(null);
  const [limitDraft, setLimitDraft] = useState(preferences.monthlyLimit ?? '');
  const [advancedOpen, setAdvancedOpen] = useState(false);

  const syncLabel = useMemo(() => {
    if (syncStatus === 'synced') return `Datos sincronizados${lastSyncedAt ? ` · ${syncTime.format(lastSyncedAt)}` : ''}`;
    if (syncStatus === 'syncing' || syncStatus === 'loading') return 'Sincronizando datos…';
    if (syncStatus === 'offline') return pendingSyncCount ? `${pendingSyncCount} ${pendingSyncCount === 1 ? 'cambio pendiente de sincronizar' : 'cambios pendientes de sincronizar'}` : 'Cambios pendientes de sincronizar';
    return 'No se puede conectar con la cuenta';
  }, [syncStatus, lastSyncedAt, pendingSyncCount]);


  const retrySync = async () => {
    if (!onRetrySync) return;
    const synced = await onRetrySync();
    onToast(synced ? 'Los cambios pendientes se han sincronizado.' : 'La sincronización sigue pendiente. Comprueba la conexión e inténtalo de nuevo.');
  };

  const saveLimit = () => {
    const value = limitDraft === '' ? null : Math.max(0, Number(limitDraft) || 0);
    updatePreferences({ monthlyLimit: value });
    onToast(value == null ? 'Límite mensual eliminado.' : `Límite mensual establecido en ${euro.format(value)}.`);
  };

  const enableNotifications = async () => {
    if (!('Notification' in window)) return onToast('Este navegador no admite notificaciones web.');
    const permission = await Notification.requestPermission();
    const enabled = permission === 'granted';
    updatePreferences({ notifications: enabled });
    onToast(enabled ? 'Notificaciones activadas.' : 'No se ha concedido permiso para las notificaciones.');
  };

  const exportData = () => {
    const blob = new Blob([JSON.stringify({ version: 13, exportedAt: new Date().toISOString(), plays: history }, null, 2)], { type: 'application/json' });
    const url = URL.createObjectURL(blob);
    const anchor = document.createElement('a');
    anchor.href = url;
    anchor.download = `primy-backup-${new Date().toISOString().slice(0, 10)}.json`;
    anchor.click();
    URL.revokeObjectURL(url);
  };

  const importFile = async event => {
    const file = event.target.files?.[0];
    event.target.value = '';
    if (!file) return;
    if (file.size > 2 * 1024 * 1024) return onToast('La copia de seguridad supera los 2 MB y no puede importarse en el navegador.');
    try {
      const parsed = JSON.parse(await file.text());
      const count = onImport(parsed);
      onToast(`${count} ${count === 1 ? 'jugada importada' : 'jugadas importadas'}.`);
    } catch (error) {
      onToast(error?.message || 'El archivo seleccionado no es válido.');
    }
  };

  return (
    <div className="primy-page-enter mx-auto max-w-[1120px] px-4 py-6 sm:px-6 lg:px-8 lg:py-10">
      <header className="max-w-3xl">
        <Eyebrow>Perfil</Eyebrow>
        <h1 className="mt-4 text-4xl font-semibold tracking-[-.05em] text-primary sm:text-5xl">Tu cuenta, a tu manera.</h1>
        <p className="mt-4 text-base leading-7 text-secondary">Personaliza Primy, protege tus datos y mantén tus límites bajo control.</p>
      </header>

      <div className="mt-8 grid gap-5 lg:grid-cols-[1.1fr_.9fr]">
        <div className="space-y-5">
          <ProfileSection title="Tu cuenta" description={user?.email}>
            <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
              <div>
                <p className="text-lg font-semibold text-primary">{user?.user_metadata?.display_name || user?.email}</p>
                <p className={`mt-2 text-sm font-bold ${syncStatus === 'synced' ? 'text-emerald-700' : syncStatus === 'error' ? 'text-rose-700' : 'text-amber-700'}`}>{syncLabel}</p>
              </div>
              <div className="flex flex-wrap gap-2">
                {syncStatus === 'offline' && pendingSyncCount > 0 && onRetrySync && (
                  <button type="button" onClick={retrySync} disabled={syncStatus === 'syncing'} className="min-h-11 rounded-2xl bg-primy-700 px-4 text-sm font-semibold text-white hover:bg-primy-800 disabled:opacity-50">Reintentar sincronización</button>
                )}
                <button type="button" onClick={onSignOut} className="min-h-11 rounded-2xl border border-default px-4 text-sm font-semibold text-primary hover:bg-muted">Cerrar sesión</button>
              </div>
            </div>
          </ProfileSection>

          <ProfileSection title="Apariencia" description="Elige un tema o deja que Primy siga la configuración del dispositivo." icon={DeviceIcon}>
            <div className="grid gap-3 sm:grid-cols-3">
              {[{ id:'system', label:'Sistema', icon:DeviceIcon },{ id:'light', label:'Claro', icon:SunIcon },{ id:'dark', label:'Oscuro', icon:MoonIcon }].map(item => {
                const Icon = item.icon;
                const selected = preferences.appearance === item.id;
                return (
                  <button
                    type="button"
                    key={item.id}
                    onClick={() => updatePreferences({ appearance:item.id })}
                    aria-pressed={selected}
                    className={`primy-profile-choice ${selected ? 'is-selected' : ''}`}
                  >
                    <Icon width="19" height="19"/>{item.label}
                  </button>
                );
              })}
            </div>
          </ProfileSection>

          <ProfileSection title="Límite mensual personal" description="Un recordatorio privado para mantener el gasto dentro de la cantidad que tú decidas." icon={ShieldIcon}>
            <div className="flex flex-col gap-3 sm:flex-row sm:items-end">
              <label className="flex-1 text-sm font-bold text-primary">
                Límite en euros
                <input type="number" min="0" step="1" inputMode="decimal" value={limitDraft} onChange={event => setLimitDraft(event.target.value)} placeholder="Sin límite" className="mt-2 min-h-11 w-full rounded-2xl border border-default bg-surface px-3 font-normal text-primary"/>
              </label>
              <button type="button" onClick={saveLimit} className="min-h-11 rounded-xl bg-primy-700 px-5 text-sm font-semibold text-white hover:bg-primy-800">Guardar límite</button>
            </div>
            {(preferenceError || storageError) && <div role="alert" className="mt-4 rounded-2xl border border-rose-200 bg-rose-50 p-4 text-sm leading-6 text-rose-800">{preferenceError || storageError}</div>}
          </ProfileSection>
        </div>

        <div className="space-y-5">
          <ProfileSection title="Avisos" description="Recibe un aviso cuando Primy encuentre jugadas listas para comprobar." icon={BellIcon}>
            <button type="button" onClick={preferences.notifications ? () => updatePreferences({ notifications:false }) : enableNotifications} className="min-h-11 rounded-xl bg-primy-700 px-5 text-sm font-semibold text-white hover:bg-primy-800">
              {preferences.notifications ? 'Desactivar notificaciones' : 'Activar notificaciones'}
            </button>
          </ProfileSection>

          <ProfileSection title="Instalación" description="Usa Primy como aplicación independiente desde la pantalla de inicio." icon={InstallIcon}>
            {installPrompt?.installed ? (
              <p className="rounded-xl bg-emerald-50 p-4 font-bold text-emerald-900">Primy ya está instalada.</p>
            ) : installPrompt?.canInstall ? (
              <button type="button" onClick={installPrompt.install} className="min-h-11 rounded-xl bg-primy-700 px-5 text-sm font-semibold text-white hover:bg-primy-800">Instalar Primy</button>
            ) : (
              <p className="text-sm leading-6 text-secondary">En iPhone o iPad: Compartir → Añadir a pantalla de inicio.</p>
            )}
          </ProfileSection>

          <ProfileSection title="Copia de seguridad" description="Exporta tus jugadas o restaura una copia de Primy." icon={DownloadIcon}>
            <div className="flex flex-wrap gap-3">
              <button type="button" onClick={exportData} disabled={!history.length} className="flex min-h-11 items-center gap-2 rounded-2xl border border-default px-4 text-sm font-bold hover:bg-muted disabled:opacity-50"><DownloadIcon width="18" height="18"/>Exportar</button>
              <button type="button" onClick={() => fileRef.current?.click()} className="flex min-h-11 items-center gap-2 rounded-2xl border border-default px-4 text-sm font-bold hover:bg-muted"><UploadIcon width="18" height="18"/>Importar</button>
              <input ref={fileRef} type="file" accept="application/json,.json" onChange={importFile} className="sr-only"/>
            </div>
          </ProfileSection>
        </div>
      </div>

      <section className="primy-profile-advanced mt-5">
        <button
          type="button"
          onClick={() => setAdvancedOpen(value => !value)}
          aria-expanded={advancedOpen}
          aria-controls="profile-advanced-content"
          className="flex min-h-14 w-full items-center justify-between gap-4 text-left"
        >
          <span>
            <span className="flex items-center gap-2 text-xl font-semibold text-primary"><InfoIcon width="21" height="21"/>Información y ajustes avanzados</span>
            <span className="mt-1 block text-sm leading-6 text-secondary">Fuente de datos, guía inicial e información técnica.</span>
          </span>
          <span aria-hidden="true" className={`text-2xl transition-transform ${advancedOpen ? 'rotate-45' : ''}`}>+</span>
        </button>

        {advancedOpen && (
          <div id="profile-advanced-content" className="mt-5 space-y-5 border-t border-default pt-5">
            <div className="rounded-2xl bg-muted p-4">
              <div className="flex flex-col gap-4 sm:flex-row sm:items-start sm:justify-between">
                <div>
                  <h3 className="flex items-center gap-2 text-lg font-semibold text-primary"><DatabaseIcon width="20" height="20"/>Fuente de datos</h3>
                  <p className="mt-1 text-sm leading-6 text-secondary">Conexión utilizada para el historial, los botes y la comprobación.</p>
                </div>
                <button type="button" onClick={providerStatus.reload} className="min-h-11 rounded-2xl border border-default bg-surface px-4 text-sm font-bold hover:bg-muted">Volver a comprobar</button>
              </div>
              <div className={`mt-4 rounded-xl p-4 ${providerStatus.online ? 'bg-emerald-50 text-emerald-900' : providerStatus.configured === false ? 'bg-amber-50 text-amber-950' : 'bg-rose-50 text-rose-900'}`} role="status">
                <p className="font-semibold">{providerStatus.loading ? 'Comprobando…' : providerStatus.online ? 'Fuente de datos conectada' : providerStatus.configured === false ? 'Clave API no configurada' : 'Fuente de datos no disponible'}</p>
                {providerStatus.message && <p className="mt-1 text-sm leading-6">{providerStatus.message}</p>}
              </div>
            </div>

            <div className="rounded-2xl bg-muted p-4">
              <div className="flex flex-col gap-4 sm:flex-row sm:items-start sm:justify-between">
                <div>
                  <h3 className="text-lg font-semibold text-primary">Guía inicial</h3>
                  <p className="mt-1 text-sm leading-6 text-secondary">Vuelve a ver el recorrido de bienvenida cuando quieras.</p>
                </div>
                <button type="button" onClick={() => updatePreferences({ onboardingSeen:false })} className="min-h-11 rounded-2xl border border-default bg-surface px-4 text-sm font-semibold text-primary hover:bg-muted">Ver introducción</button>
              </div>
            </div>

            <div>
              <h3 className="text-lg font-semibold text-primary">Cómo funciona Primy Core</h3>
              <p className="mt-1 text-sm leading-6 text-secondary">Primy Core crea combinaciones válidas de forma independiente. El historial se muestra aparte y nunca determina la próxima jugada.</p>
              <div className="mt-4"><GameSwitch active={activeGame} onChange={onGameChange} label="Juego que analizar"/></div>
              <div className="mt-5"><HistoryLab historyState={historyState}/></div>
            </div>
          </div>
        )}
      </section>

      <section className="mt-5 grid gap-5 rounded-[2rem] border border-primy-100 bg-gradient-to-br from-ivory via-white to-sky/30 p-5 shadow-soft md:grid-cols-[minmax(0,1fr)_280px] md:p-6">
        <div className="flex flex-col justify-center">
          <p className="text-sm font-bold text-primy-700">Consejo de Primy</p>
          <h2 className="mt-2 text-2xl font-semibold text-primary">Usa la app con calma y criterio</h2>
          <p className="mt-3 text-sm leading-7 text-secondary">Primy está para organizar tus jugadas, no para empujarte a jugar más. Mantén siempre tus límites personales y disfruta del juego de forma responsable.</p>
        </div>
        <PrimyMascotGraphic className="mx-auto w-full max-w-[280px]" variant="responsible" size="dashboard" caption="Tu guía para jugar con cabeza"/>
      </section>

      <section className="mt-5 rounded-2xl border border-rose-200 bg-surface p-5 md:p-6">
        <h2 className="text-xl font-semibold text-rose-800">Eliminar las jugadas de la cuenta</h2>
        <p className="mt-1 text-sm leading-6 text-secondary">Esta acción elimina definitivamente las jugadas y los borradores sincronizados con tu cuenta.</p>
        <button type="button" onClick={onClear} disabled={!history.length} className="mt-5 flex min-h-11 items-center gap-2 rounded-xl bg-rose-700 px-4 text-sm font-semibold text-white hover:bg-rose-800 disabled:opacity-50"><TrashIcon width="18" height="18"/>Eliminar todo</button>
      </section>

      <section className="mt-5 rounded-2xl bg-primy-700 p-5 text-white md:p-6">
        <h2 className="text-xl font-semibold">Juego responsable</h2>
        <p className="mt-2 text-sm leading-6 text-primy-100">Primy es una herramienta informativa para mayores de edad. No vende boletos, no predice sorteos ni garantiza premios. No persigas las pérdidas ni utilices dinero necesario para gastos esenciales.</p>
      </section>
    </div>
  );
}
