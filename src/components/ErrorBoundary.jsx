import React from 'react';

export default class ErrorBoundary extends React.Component {
  constructor(props) {
    super(props);
    this.state = { error: null, errorId: '' };
  }

  static getDerivedStateFromError(error) {
    return { error, errorId: crypto.randomUUID?.() || `err-${Date.now()}` };
  }

  componentDidCatch(error, info) {
    console.error(JSON.stringify({
      level: 'error',
      event: 'ui_error_boundary',
      errorId: this.state.errorId,
      message: error?.message || 'Unknown UI error',
      stack: error?.stack || '',
      componentStack: info?.componentStack || '',
      at: new Date().toISOString(),
    }));
  }

  render() {
    if (!this.state.error) return this.props.children;
    return (
      <main className="min-h-screen bg-app px-4 py-12 text-primary">
        <section className="mx-auto max-w-xl rounded-3xl border border-border bg-surface p-6">
          <p className="text-sm font-medium text-secondary">Errore applicazione</p>
          <h1 className="mt-2 text-2xl font-semibold">Primy non è riuscita a completare questa schermata.</h1>
          <p className="mt-3 text-sm text-secondary">Ricarica l’app. Le giocate già salvate sul dispositivo non vengono eliminate.</p>
          <p className="mt-4 rounded-xl bg-muted px-3 py-2 text-xs text-secondary">Codice diagnostico: {this.state.errorId}</p>
          <button type="button" className="mt-5 min-h-11 rounded-xl bg-slate-900 px-4 py-2 font-medium text-white" onClick={() => window.location.reload()}>
            Ricarica Primy
          </button>
        </section>
      </main>
    );
  }
}
