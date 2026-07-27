import React, { useEffect, useState } from 'react';
import { HomeIcon, ListIcon, PlusIcon, SettingsIcon, SparklesIcon } from './Icons.jsx';

const NAV = [
  { id: 'dashboard', label: 'Dashboard', icon: HomeIcon },
  { id: 'generate', label: 'Genera', icon: PlusIcon },
  { id: 'plays', label: 'Le mie giocate', icon: ListIcon },
  { id: 'settings', label: 'Impostazioni', icon: SettingsIcon },
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

export default function AppShell({ view, onNavigate, providerStatus, dueCount = 0, children }) {
  const [online, setOnline] = useState(() => navigator.onLine !== false);
  useEffect(() => {
    const update = () => setOnline(navigator.onLine !== false);
    window.addEventListener('online', update);
    window.addEventListener('offline', update);
    return () => { window.removeEventListener('online', update); window.removeEventListener('offline', update); };
  }, []);

  return (
    <div className="min-h-screen bg-app text-primary">
      <a href="#main-content" className="sr-only z-50 rounded-lg bg-surface px-4 py-2 font-bold text-primary focus:not-sr-only focus:fixed focus:left-4 focus:top-4">Vai al contenuto</a>
      <aside className="fixed inset-y-0 left-0 z-30 hidden w-64 flex-col border-r border-default bg-surface p-5 lg:flex">
        <div className="flex items-center gap-3"><span className="flex h-11 w-11 items-center justify-center rounded-2xl bg-slate-950 text-white"><SparklesIcon width="21" height="21"/></span><div><p className="text-lg font-black text-primary">Primy</p><p className="text-xs text-secondary">Assistente privato di gioco</p></div></div>
        <nav className="mt-8 space-y-2" aria-label="Navigazione principale">{NAV.map(item => <NavButton key={item.id} item={item} active={view === item.id} onSelect={onNavigate} badge={item.id === 'plays' ? dueCount : 0}/>)}</nav>
        <div className="mt-auto space-y-4"><button type="button" onClick={providerStatus.reload} className="flex min-h-11 w-full items-center gap-3 rounded-xl bg-muted px-3 text-left text-xs font-bold text-secondary hover:bg-muted-strong"><span className={`h-2.5 w-2.5 rounded-full ${providerStatus.loading ? 'bg-slate-400' : providerStatus.online ? 'bg-emerald-500' : 'bg-amber-500'}`}/>{providerStatus.loading ? 'Controllo dati…' : providerStatus.online ? 'Fonte dati collegata' : 'Fonte dati da controllare'}</button><p className="px-2 text-xs leading-5 text-secondary">Primy non vende schedine e non garantisce vincite. Solo per maggiorenni.</p></div>
      </aside>
      <header className="sticky top-0 z-20 border-b border-default bg-surface/95 px-4 py-3 backdrop-blur lg:hidden"><div className="flex items-center justify-between"><div className="flex items-center gap-3"><span className="flex h-10 w-10 items-center justify-center rounded-xl bg-slate-950 text-white"><SparklesIcon width="19" height="19"/></span><div><p className="font-black">Primy</p><p className="text-xs text-secondary">{NAV.find(item => item.id === view)?.label}</p></div></div><div className="flex items-center gap-3">{dueCount > 0 && <button type="button" onClick={() => onNavigate('plays')} className="rounded-full bg-amber-100 px-3 py-1.5 text-xs font-black text-amber-950">{dueCount} da verificare</button>}<span className={`h-3 w-3 rounded-full ${providerStatus.loading ? 'bg-slate-400' : providerStatus.online ? 'bg-emerald-500' : 'bg-amber-500'}`} aria-label={providerStatus.online ? 'Fonte dati collegata' : 'Fonte dati non disponibile'}/></div></div></header>
      {!online && <div role="status" className="border-b border-amber-300 bg-amber-100 px-4 py-2 text-center text-sm font-bold text-amber-950 lg:ml-64">Modalità offline: generazione e dati locali disponibili; risultati e sincronizzazione richiedono internet.</div>}
      <main id="main-content" className="pb-24 lg:ml-64 lg:pb-0">{children}</main>
      <nav className="fixed inset-x-0 bottom-0 z-30 flex border-t border-default bg-surface pb-[env(safe-area-inset-bottom)] lg:hidden" aria-label="Navigazione principale">{NAV.map(item => <NavButton key={item.id} item={item} active={view === item.id} onSelect={onNavigate} mobile badge={item.id === 'plays' ? dueCount : 0}/>)}</nav>
    </div>
  );
}
