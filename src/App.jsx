import React from 'react';
import { useAuth } from './hooks/useAuth.js';
import { useAppController } from './hooks/useAppController.js';
import AppShell from './components/AppShell.jsx';
import AuthScreen from './components/AuthScreen.jsx';
import AgeVerificationDialog from './components/AgeVerificationDialog.jsx';
import AppViews from './app/AppViews.jsx';
import AppOverlays from './app/AppOverlays.jsx';

function AuthenticatedApp({ auth }) {
  const app = useAppController(auth);

  if (app.requiresAgeConfirmation) {
    return (
      <main className="min-h-screen bg-app text-primary">
        <AgeVerificationDialog {...app.ageGate}/>
      </main>
    );
  }

  return (
    <AppShell {...app.shellProps}>
      <AppViews view={app.view} propsByView={app.propsByView} onGoHome={() => app.navigate('dashboard')}/>
      <AppOverlays {...app.overlays}/>
    </AppShell>
  );
}

function AuthLoadingScreen() {
  return (
    <main className="flex min-h-screen items-center justify-center bg-app px-4 text-primary">
      <div role="status" className="rounded-2xl border border-default bg-surface px-6 py-5 text-sm font-bold text-secondary">Abriendo tu cuenta…</div>
    </main>
  );
}

export default function App() {
  const auth = useAuth();
  if (auth.loading) return <AuthLoadingScreen/>;
  if (auth.recoveryMode) return <AuthScreen auth={auth} initialMode="update-password"/>;
  if (!auth.user) return <AuthScreen auth={auth}/>;
  return <AuthenticatedApp auth={auth}/>;
}
