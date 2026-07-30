import React, { Suspense, lazy } from 'react';
import ViewErrorBoundary from './ViewErrorBoundary.jsx';

const DashboardView = lazy(() => import('../components/DashboardView.jsx'));
const GenerateView = lazy(() => import('../components/GenerateView.jsx'));
const ExploreView = lazy(() => import('../components/ExploreView.jsx'));
const PlaysView = lazy(() => import('../components/PlaysView.jsx'));
const SettingsView = lazy(() => import('../components/SettingsView.jsx'));

function ViewLoading() {
  return <div role="status" className="mx-4 my-6 rounded-2xl border border-default bg-surface p-6 text-sm text-secondary">Cargando pantalla…</div>;
}

export default function AppViews({ view, propsByView, onGoHome }) {
  return (
    <ViewErrorBoundary resetKey={view} onGoHome={onGoHome}>
      <Suspense fallback={<ViewLoading/>}>
        {view === 'dashboard' && <DashboardView {...propsByView.dashboard}/>} 
        {view === 'explore' && <ExploreView {...propsByView.explore}/>} 
        {view === 'generate' && <GenerateView {...propsByView.generate}/>} 
        {view === 'plays' && <PlaysView {...propsByView.plays}/>} 
        {view === 'settings' && <SettingsView {...propsByView.settings}/>} 
      </Suspense>
    </ViewErrorBoundary>
  );
}
