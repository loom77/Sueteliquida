import React from 'react';
import { PrimyMascotGraphic } from './BrandVisuals.jsx';

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
      message: error?.message || 'Error de interfaz desconocido',
      stack: error?.stack || '',
      componentStack: info?.componentStack || '',
      at: new Date().toISOString(),
    }));
  }

  render() {
    if (!this.state.error) return this.props.children;
    return (
      <main className="min-h-screen bg-app px-4 py-12 text-primary">
        <section className="mx-auto grid max-w-3xl items-center gap-5 rounded-3xl border border-default bg-surface p-6 sm:grid-cols-[1fr_240px]">
          <div><p className="text-sm font-medium text-secondary">Error de la aplicación</p>
          <h1 className="mt-2 text-2xl font-semibold">Primy no ha podido completar esta pantalla.</h1>
          <p className="mt-3 text-sm text-secondary">Vuelve a cargar la aplicación. Las jugadas guardadas en el dispositivo no se eliminarán.</p>
          <p className="mt-4 rounded-xl bg-muted px-3 py-2 text-xs text-secondary">Código de diagnóstico: {this.state.errorId}</p>
          <button type="button" className="mt-5 min-h-11 rounded-xl bg-primy-700 px-4 py-2 font-medium text-white" onClick={() => window.location.reload()}>Volver a cargar Primy</button></div><PrimyMascotGraphic variant="responsible" size="dashboard" compact showCaption={false} className="mx-auto w-full max-w-[240px]"/>
        </section>
      </main>
    );
  }
}
