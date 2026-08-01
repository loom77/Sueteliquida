import React, { memo, useEffect, useMemo, useRef, useState } from 'react';
import GameSwitch from './GameSwitch.jsx';
import HistoryLab from './HistoryLab.jsx';
import { PrimyMascot } from './PrimyMascot.jsx';
import { BellIcon, DatabaseIcon, DeviceIcon, DownloadIcon, InfoIcon, InstallIcon, MoonIcon, ShieldIcon, SunIcon, TrashIcon, UploadIcon } from './Icons.jsx';
import { Eyebrow } from './DesignSystem.jsx';
import { getMonthlyStats } from '../utils/appMetrics.js';

const euro = new Intl.NumberFormat('es-ES', { style: 'currency', currency: 'EUR' });
const syncTime = new Intl.DateTimeFormat('es-ES', { hour: '2-digit', minute: '2-digit' });
const verificationDate = new Intl.DateTimeFormat('es-ES', { dateStyle: 'medium' });

const ProfileSection = memo(function ProfileSection({ title, description, icon: Icon, children, tone = 'neutral', className = '' }) {
  return (
    <section className={`primy-profile-block ${className}`} data-tone={tone}>
      <header>
        {Icon && <span aria-hidden="true"><Icon width="20" height="20"/></span>}
        <div><h2>{title}</h2>{description && <p>{description}</p>}</div>
      </header>
      <div className="primy-profile-block__content">{children}</div>
    </section>
  );
});

export default function SettingsView({ activeGame, onGameChange, providerStatus, historyState, preferences, updatePreferences, preferenceError, storageError, history, onImport, onClear, onToast, installPrompt, user, onSignOut, syncStatus, lastSyncedAt, pendingSyncCount = 0, onRetrySync }) {
  const fileRef = useRef(null);
  const [limitDraft, setLimitDraft] = useState(preferences.monthlyLimit ?? '');
  const [limitEditing, setLimitEditing] = useState(false);
  const [advancedOpen, setAdvancedOpen] = useState(false);
  const monthlyStats = useMemo(() => getMonthlyStats(history), [history]);

  useEffect(() => setLimitDraft(preferences.monthlyLimit ?? ''), [preferences.monthlyLimit]);

  const normalizedLimitDraft = limitDraft === '' ? null : Math.max(0, Number(limitDraft) || 0);
  const limitChanged = normalizedLimitDraft !== (preferences.monthlyLimit ?? null);
  const limit = preferences.monthlyLimit > 0 ? preferences.monthlyLimit : null;
  const limitPercent = limit ? Math.min(100, (monthlyStats.spent / limit) * 100) : 0;
  const remaining = limit ? Math.max(0, limit - monthlyStats.spent) : null;
  const displayName = user?.user_metadata?.display_name || user?.email?.split('@')[0] || 'tu';

  const syncLabel = useMemo(() => {
    if (syncStatus === 'synced') return `Sincronizada${lastSyncedAt ? ` · ${syncTime.format(lastSyncedAt)}` : ''}`;
    if (syncStatus === 'syncing' || syncStatus === 'loading') return 'Sincronizando…';
    if (syncStatus === 'offline') return pendingSyncCount ? `${pendingSyncCount} ${pendingSyncCount === 1 ? 'cambio pendiente' : 'cambios pendientes'}` : 'Pendiente de sincronizar';
    return 'Conexión no disponible';
  }, [syncStatus, lastSyncedAt, pendingSyncCount]);

  const retrySync = async () => {
    if (!onRetrySync) return;
    const synced = await onRetrySync();
    onToast(synced ? 'Los cambios pendientes se han sincronizado.' : 'La sincronización sigue pendiente. Comprueba la conexión e inténtalo de nuevo.');
  };

  const saveLimit = () => {
    const value = normalizedLimitDraft;
    updatePreferences({ monthlyLimit: value });
    setLimitEditing(false);
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
    const blob = new Blob([JSON.stringify({ version: '16.1', exportedAt: new Date().toISOString(), plays: history }, null, 2)], { type: 'application/json' });
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
    <div className="primy-page-enter mx-auto max-w-[1180px] px-4 py-6 sm:px-6 lg:px-8 lg:py-10">
      <section className="primy-profile-hero">
        <div className="primy-profile-hero__copy">
          <Eyebrow>Mi Primy</Eyebrow>
          <h1>Hola, {displayName}.</h1>
          <p>Tu cuenta, tus preferencias y tus límites reunidos sin ruido.</p>
          <div className="primy-profile-hero__identity">
            <span>{user?.email}</span>
            <strong data-status={syncStatus}>{syncLabel}</strong>
            {syncStatus === 'offline' && pendingSyncCount > 0 && onRetrySync && <button type="button" onClick={retrySync}>Reintentar</button>}
          </div>
        </div>
        <div className="primy-profile-hero__mascot"><PrimyMascot role="companion" size="dashboard" compact showCaption={false}/></div>
      </section>

      <div className="primy-profile-layout">
        <div className="primy-profile-layout__main">
          <ProfileSection title="Mi experiencia Primy" description="Ajusta el aspecto y cómo quieres recibir avisos." icon={DeviceIcon} tone="mint">
            <div className="primy-profile-themes">
              {[{ id:'system', label:'Sistema', icon:DeviceIcon },{ id:'light', label:'Claro', icon:SunIcon },{ id:'dark', label:'Oscuro', icon:MoonIcon }].map(item => {
                const Icon = item.icon;
                const selected = preferences.appearance === item.id;
                return <button type="button" key={item.id} onClick={() => updatePreferences({ appearance:item.id })} aria-pressed={selected} data-selected={selected ? 'true' : 'false'}><Icon width="19" height="19"/><span>{item.label}</span></button>;
              })}
            </div>
            <div className="primy-profile-inline-action">
              <span><BellIcon width="19" height="19"/><span><strong>Avisos de comprobación</strong><small>Primy te avisa cuando una jugada está lista.</small></span></span>
              <button type="button" onClick={preferences.notifications ? () => updatePreferences({ notifications:false }) : enableNotifications}>{preferences.notifications ? 'Desactivar' : 'Activar'}</button>
            </div>
            <div className="primy-profile-inline-action">
              <span><InstallIcon width="19" height="19"/><span><strong>Instalar Primy</strong><small>Úsala como una aplicación independiente.</small></span></span>
              {installPrompt.canInstall ? <button type="button" onClick={installPrompt.promptInstall}>Instalar</button> : <em>Compartir → Añadir a inicio</em>}
            </div>
          </ProfileSection>

          <ProfileSection title="Mi juego responsable" description="Una vista clara de lo que habías decidido gastar." icon={ShieldIcon} tone="responsible">
            <div className="primy-profile-budget">
              <div><span>Gastado este mes</span><strong>{euro.format(monthlyStats.spent)}</strong></div>
              <div><span>{limit ? 'Disponible' : 'Límite personal'}</span><strong>{limit ? euro.format(remaining) : 'Sin límite'}</strong></div>
              {limit && <span className="primy-profile-budget__track" aria-label={`${Math.round(limitPercent)}% del límite utilizado`}><span style={{ width: `${Math.max(3, limitPercent)}%` }}/></span>}
              <p>{limit ? `${euro.format(monthlyStats.spent)} utilizados de ${euro.format(limit)}` : 'Puedes establecer una cantidad mensual como recordatorio privado.'}</p>
            </div>
            {limitEditing ? (
              <div className="primy-profile-limit-editor">
                <label>Límite en euros<input type="number" min="0" step="1" inputMode="decimal" value={limitDraft} onChange={event => setLimitDraft(event.target.value)} placeholder="Sin límite"/></label>
                <button type="button" onClick={saveLimit} disabled={!limitChanged}>Guardar</button>
                <button type="button" onClick={() => { setLimitDraft(preferences.monthlyLimit ?? ''); setLimitEditing(false); }}>Cancelar</button>
              </div>
            ) : <button type="button" className="primy-profile-text-action" onClick={() => setLimitEditing(true)}>{limit ? 'Modificar límite' : 'Establecer límite'}</button>}
            {(preferenceError || storageError) && <div role="alert" className="primy-profile-error">{preferenceError || storageError}</div>}
          </ProfileSection>
        </div>

        <aside className="primy-profile-layout__side">
          <ProfileSection title="Privacidad y seguridad" description="Controla el acceso y las copias de tus datos." icon={ShieldIcon} tone="blue">
            <div className="primy-profile-security-item"><strong>Edad confirmada</strong><span>{preferences.ageConfirmedAt ? `Verificada el ${verificationDate.format(new Date(preferences.ageConfirmedAt))}` : 'Verificación completada'}. La fecha de nacimiento no se almacena.</span></div>
            <div className="primy-profile-backup">
              <button type="button" onClick={exportData} disabled={!history.length}><DownloadIcon width="18" height="18"/>Exportar</button>
              <button type="button" onClick={() => fileRef.current?.click()}><UploadIcon width="18" height="18"/>Importar</button>
              <input ref={fileRef} type="file" accept="application/json,.json" onChange={importFile} className="sr-only"/>
            </div>
            <button type="button" onClick={onSignOut} className="primy-profile-signout">Cerrar sesión</button>
          </ProfileSection>

          <ProfileSection title="Consejo de Primy" description="Organizar mejor no significa jugar más." icon={InfoIcon} tone="lavender">
            <p className="primy-profile-advice">Mantén tus límites personales y utiliza Primy como herramienta de organización, nunca como promesa de premio.</p>
          </ProfileSection>
        </aside>
      </div>

      <section className="primy-profile-advanced">
        <button type="button" onClick={() => setAdvancedOpen(value => !value)} aria-expanded={advancedOpen} aria-controls="profile-advanced-content">
          <span><DatabaseIcon width="21" height="21"/><span><strong>Datos y ajustes avanzados</strong><small>Proveedor oficial, análisis e información técnica.</small></span></span>
          <span aria-hidden="true">{advancedOpen ? '−' : '+'}</span>
        </button>
        {advancedOpen && (
          <div id="profile-advanced-content" className="primy-profile-advanced__content">
            <div className="primy-profile-provider"><div><h3>Fuente de datos</h3><p>{providerStatus.message || 'Resultados y archivo oficial.'}</p></div><button type="button" onClick={providerStatus.reload}>Volver a comprobar</button></div>
            <div><h3>Cómo funciona Primy Core</h3><p>Selecciona un juego para consultar sus estadísticas informativas. Ningún análisis garantiza resultados.</p><div className="mt-4"><GameSwitch active={activeGame} onChange={onGameChange} label="Juego que analizar"/></div><div className="mt-5"><HistoryLab historyState={historyState}/></div></div>
            <div className="primy-profile-danger"><div><h3>Eliminar las jugadas</h3><p>Borra definitivamente el archivo sincronizado de tu cuenta.</p></div><button type="button" onClick={onClear} disabled={!history.length}><TrashIcon width="18" height="18"/>Eliminar todo</button></div>
          </div>
        )}
      </section>
    </div>
  );
}
