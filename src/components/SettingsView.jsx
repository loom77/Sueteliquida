import React, { useRef, useState } from 'react';
import GameSwitch from './GameSwitch.jsx';
import HistoryLab from './HistoryLab.jsx';
import { PrimyMascotGraphic } from './BrandVisuals.jsx';
import { BellIcon, DatabaseIcon, DeviceIcon, DownloadIcon, InfoIcon, InstallIcon, MoonIcon, ShieldIcon, SunIcon, TrashIcon, UploadIcon } from './Icons.jsx';

const euro = new Intl.NumberFormat('es-ES', { style: 'currency', currency: 'EUR' });

export default function SettingsView({ activeGame, onGameChange, providerStatus, historyState, preferences, updatePreferences, preferenceError, storageError, history, onImport, onClear, onToast, installPrompt, user, onSignOut, syncStatus, lastSyncedAt }) {
  const fileRef = useRef(null);
  const [limitDraft, setLimitDraft] = useState(preferences.monthlyLimit ?? '');

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
    onToast(enabled ? 'Notificaciones activadas. Primy avisará cuando la aplicación esté abierta y encuentre jugadas pendientes de comprobación.' : 'No se ha concedido permiso para las notificaciones.');
  };

  const exportData = () => {
    const blob = new Blob([JSON.stringify({ version: 12, exportedAt: new Date().toISOString(), plays: history }, null, 2)], { type: 'application/json' });
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
    try { const parsed = JSON.parse(await file.text()); const count = onImport(parsed); onToast(`${count} ${count === 1 ? 'jugada importada' : 'jugadas importadas'}.`); }
    catch (error) { onToast(error?.message || 'El archivo seleccionado no es válido.'); }
  };

  return (
    <div className="primy-page-enter mx-auto max-w-[1120px] space-y-6 px-4 py-6 sm:px-6 lg:px-8 lg:py-8">
      <div><p className="text-sm font-bold text-primy-700">Ajustes</p><h1 className="mt-1 text-3xl font-semibold tracking-tight text-primary">Gestiona Primy</h1><p className="mt-2 text-sm leading-6 text-secondary">Configura la experiencia, el límite de gasto y los datos sincronizados con tu cuenta.</p></div>

      <section className="rounded-3xl border border-default bg-surface shadow-soft p-5 md:p-6"><div className="flex flex-col gap-5 sm:flex-row sm:items-center sm:justify-between"><div><p className="text-sm font-semibold text-primy-700">Tu cuenta</p><h2 className="mt-1 text-xl font-semibold text-primary">{user?.user_metadata?.display_name || user?.email}</h2><p className="mt-1 text-sm text-secondary">{user?.email}</p><p className={`mt-3 text-sm font-bold ${syncStatus === 'synced' ? 'text-emerald-700' : syncStatus === 'error' ? 'text-rose-700' : 'text-amber-700'}`}>{syncStatus === 'synced' ? `Datos sincronizados${lastSyncedAt ? ` · ${new Intl.DateTimeFormat('es-ES', { hour: '2-digit', minute: '2-digit' }).format(lastSyncedAt)}` : ''}` : syncStatus === 'syncing' || syncStatus === 'loading' ? 'Sincronizando datos…' : syncStatus === 'offline' ? 'Cambios pendientes de sincronizar' : 'No se puede conectar con la cuenta'}</p></div><button type="button" onClick={onSignOut} className="min-h-11 rounded-2xl border border-default px-4 text-sm font-semibold text-primary hover:bg-muted">Cerrar sesión</button></div></section>

      <section className="rounded-3xl border border-default bg-surface shadow-soft p-5 md:p-6"><div className="flex flex-col gap-4 sm:flex-row sm:items-start sm:justify-between"><div><h2 className="flex items-center gap-2 text-xl font-semibold text-primary"><DatabaseIcon width="21" height="21"/>Fuente de datos</h2><p className="mt-1 text-sm leading-6 text-secondary">Conexión utilizada para el historial, los botes y la comprobación.</p></div><button type="button" onClick={providerStatus.reload} className="min-h-11 rounded-2xl border border-default px-4 text-sm font-bold hover:bg-muted">Volver a comprobar</button></div><div className={`mt-5 rounded-xl p-4 ${providerStatus.online ? 'bg-emerald-50 text-emerald-900' : providerStatus.configured === false ? 'bg-amber-50 text-amber-950' : 'bg-rose-50 text-rose-900'}`}><p className="font-semibold">{providerStatus.loading ? 'Comprobando…' : providerStatus.online ? 'Fuente de datos conectada' : providerStatus.configured === false ? 'Clave API no configurada' : 'Fuente de datos no disponible'}</p>{providerStatus.message && <p className="mt-1 text-sm leading-6">{providerStatus.message}</p>}</div></section>

      <section className="rounded-3xl border border-default bg-surface shadow-soft p-5 md:p-6"><div className="flex flex-col gap-4 sm:flex-row sm:items-start sm:justify-between"><div><h2 className="text-xl font-semibold text-primary">Guía inicial</h2><p className="mt-1 text-sm leading-6 text-secondary">Revisa en cualquier momento el recorrido que explica la generación, el guardado, la comprobación y la privacidad de tu cuenta.</p></div><button type="button" onClick={() => updatePreferences({ onboardingSeen:false })} className="min-h-11 rounded-2xl border border-default px-4 text-sm font-semibold text-primary hover:bg-muted">Volver a ver la introducción</button></div></section>

      <section className="rounded-3xl border border-default bg-surface shadow-soft p-5 md:p-6"><h2 className="text-xl font-semibold text-primary">Apariencia</h2><p className="mt-1 text-sm leading-6 text-secondary">Elige un tema o deja que Primy siga la configuración del dispositivo.</p><div className="mt-5 grid gap-3 sm:grid-cols-3">{[{ id:'system', label:'Sistema', icon:DeviceIcon },{ id:'light', label:'Claro', icon:SunIcon },{ id:'dark', label:'Oscuro', icon:MoonIcon }].map(item => { const Icon=item.icon; return <button type="button" key={item.id} onClick={() => updatePreferences({ appearance:item.id })} aria-pressed={preferences.appearance===item.id} className={`flex min-h-14 items-center gap-3 rounded-xl border px-4 text-sm font-semibold ${preferences.appearance===item.id ? 'border-primy-500 bg-primy-50 text-primy-800' : 'border-default text-primary hover:bg-muted'}`}><Icon width="19" height="19"/>{item.label}</button>; })}</div></section>

      <section className="grid gap-5 lg:grid-cols-2">
        <div className="rounded-3xl border border-default bg-surface shadow-soft p-5 md:p-6"><h2 className="flex items-center gap-2 text-xl font-semibold text-primary"><BellIcon width="21" height="21"/>Avisos</h2><p className="mt-1 text-sm leading-6 text-secondary">Cuando Primy está abierta, puede mostrar una notificación del sistema si encuentra jugadas listas para comprobar.</p><button type="button" onClick={preferences.notifications ? () => updatePreferences({ notifications:false }) : enableNotifications} className="mt-5 min-h-11 rounded-xl bg-primy-700 px-5 text-sm font-semibold text-white hover:bg-primy-800">{preferences.notifications ? 'Desactivar notificaciones' : 'Activar notificaciones'}</button></div>
        <div className="rounded-3xl border border-default bg-surface shadow-soft p-5 md:p-6"><h2 className="flex items-center gap-2 text-xl font-semibold text-primary"><InstallIcon width="21" height="21"/>Instalación</h2><p className="mt-1 text-sm leading-6 text-secondary">Usa Primy como aplicación independiente desde la pantalla de inicio.</p>{installPrompt?.installed ? <p className="mt-5 rounded-xl bg-emerald-50 p-4 font-bold text-emerald-900">Primy ya está instalada.</p> : installPrompt?.canInstall ? <button type="button" onClick={installPrompt.install} className="mt-5 min-h-11 rounded-xl bg-primy-700 px-5 text-sm font-semibold text-white hover:bg-primy-800">Instalar Primy</button> : <p className="mt-5 text-sm leading-6 text-secondary">En iPhone/iPad: Compartir → Añadir a pantalla de inicio.</p>}</div>
      </section>

      <section className="rounded-3xl border border-default bg-surface shadow-soft p-5 md:p-6"><h2 className="flex items-center gap-2 text-xl font-semibold text-primary"><ShieldIcon width="21" height="21"/>Límite mensual personal</h2><p className="mt-1 text-sm leading-6 text-secondary">Recordatorio local: Primy avisa antes de superar la cantidad elegida.</p><div className="mt-5 flex flex-col gap-3 sm:flex-row sm:items-end"><label className="flex-1 text-sm font-bold text-primary">Límite en euros<input type="number" min="0" step="1" value={limitDraft} onChange={event => setLimitDraft(event.target.value)} placeholder="Sin límite" className="mt-2 min-h-11 w-full rounded-2xl border border-default px-3 font-normal"/></label><button type="button" onClick={saveLimit} className="min-h-11 rounded-xl bg-primy-700 px-5 text-sm font-semibold text-white hover:bg-primy-800">Guardar límite</button></div>{(preferenceError || storageError) && <div role="alert" className="mt-4 rounded-2xl border border-rose-200 bg-rose-50 p-4 text-sm leading-6 text-rose-800">{preferenceError || storageError}</div>}</section>

      <details className="rounded-3xl border border-default bg-surface shadow-soft p-5 md:p-6">
        <summary className="cursor-pointer text-xl font-semibold text-primary">Ajustes avanzados y método Primy</summary>
        <p className="mt-2 text-sm leading-6 text-secondary">Abre esta sección solo para comprobar la fuente de datos históricos y los detalles técnicos del método automático.</p>
        <div className="mt-5 border-t border-default pt-5"><h2 className="flex items-center gap-2 text-lg font-semibold text-primary"><InfoIcon width="21" height="21"/>Método automático de Primy</h2><p className="mt-1 text-sm leading-6 text-secondary">La página Crear jugada no muestra algoritmos ni puntuaciones predictivas. Aquí puedes consultar el estado del historial.</p><div className="mt-5"><GameSwitch active={activeGame} onChange={onGameChange} label="Juego que analizar"/></div></div>
        <div className="mt-5"><HistoryLab historyState={historyState}/></div>
      </details>

      <section className="rounded-3xl border border-default bg-surface shadow-soft p-5 md:p-6"><h2 className="text-xl font-semibold text-primary">Copia de seguridad</h2><p className="mt-1 text-sm leading-6 text-secondary">Exporta las jugadas de tu cuenta en JSON o restaura una copia de seguridad de Primy.</p><div className="mt-5 flex flex-wrap gap-3"><button type="button" onClick={exportData} disabled={!history.length} className="flex min-h-11 items-center gap-2 rounded-2xl border border-default px-4 text-sm font-bold hover:bg-muted disabled:opacity-50"><DownloadIcon width="18" height="18"/>Exportar copia</button><button type="button" onClick={() => fileRef.current?.click()} className="flex min-h-11 items-center gap-2 rounded-2xl border border-default px-4 text-sm font-bold hover:bg-muted"><UploadIcon width="18" height="18"/>Importar copia</button><input ref={fileRef} type="file" accept="application/json,.json" onChange={importFile} className="sr-only"/></div></section>

      <section className="rounded-2xl border border-rose-200 bg-surface p-5 md:p-6"><h2 className="text-xl font-semibold text-rose-800">Eliminar las jugadas de la cuenta</h2><p className="mt-1 text-sm leading-6 text-secondary">Esta acción elimina definitivamente las jugadas y los borradores sincronizados con tu cuenta.</p><button type="button" onClick={onClear} disabled={!history.length} className="mt-5 flex min-h-11 items-center gap-2 rounded-xl bg-rose-700 px-4 text-sm font-semibold text-white hover:bg-rose-800 disabled:opacity-50"><TrashIcon width="18" height="18"/>Eliminar todo</button></section>
      <section className="grid gap-5 rounded-[2rem] border border-primy-100 bg-gradient-to-br from-ivory via-white to-sky/30 p-5 shadow-soft md:grid-cols-[minmax(0,1fr)_280px] md:p-6"><div className="flex flex-col justify-center"><p className="text-sm font-bold text-primy-700">Consejo de Primy</p><h2 className="mt-2 text-2xl font-semibold text-primary">Usa la app con calma y criterio</h2><p className="mt-3 text-sm leading-7 text-secondary">Nuestra mascota también recuerda que Primy está para organizar tus jugadas, no para empujarte a jugar más. Mantén siempre tus límites personales y disfruta del juego de forma responsable.</p></div><PrimyMascotGraphic className="mx-auto w-full max-w-[280px]" variant="responsible" size="dashboard" caption="Tu guía para jugar con cabeza"/></section>

      <section className="rounded-2xl bg-primy-700 p-5 text-white md:p-6"><h2 className="text-xl font-semibold">Juego responsable</h2><p className="mt-2 text-sm leading-6 text-primy-100">Primy es una herramienta informativa para mayores de edad. No vende boletos, no predice sorteos ni garantiza premios. No persigas las pérdidas ni utilices dinero necesario para gastos esenciales.</p></section>
    </div>
  );
}
