import React from 'react';
import { createId } from '../utils/createId.js';

export default class ViewErrorBoundary extends React.Component {
  constructor(props) {
    super(props);
    this.state = { error: null, errorId: '' };
  }

  static getDerivedStateFromError(error) {
    return { error, errorId: createId('view-error') };
  }

  componentDidUpdate(previousProps) {
    if (previousProps.resetKey !== this.props.resetKey && this.state.error) {
      this.setState({ error: null, errorId: '' });
    }
  }

  componentDidCatch(error, info) {
    console.error(JSON.stringify({
      level: 'error',
      event: 'view_error_boundary',
      errorId: this.state.errorId,
      view: this.props.resetKey,
      message: error?.message || 'Error de vista desconocido',
      stack: error?.stack || '',
      componentStack: info?.componentStack || '',
      at: new Date().toISOString(),
    }));
  }

  render() {
    if (!this.state.error) return this.props.children;
    return (
      <section role="alert" className="mx-auto my-8 max-w-2xl rounded-3xl border border-rose-200 bg-surface p-6 text-primary">
        <p className="text-sm font-semibold text-rose-700">Esta pantalla no se ha podido abrir</p>
        <h1 className="mt-2 text-2xl font-semibold">Tus datos siguen guardados.</h1>
        <p className="mt-3 text-sm leading-6 text-secondary">Puedes volver al inicio o reintentar esta vista. El resto de Primy continúa disponible.</p>
        <p className="mt-4 rounded-xl bg-muted px-3 py-2 text-xs text-secondary">Código de diagnóstico: {this.state.errorId}</p>
        <div className="mt-5 flex flex-wrap gap-2">
          <button type="button" onClick={() => this.setState({ error: null, errorId: '' })} className="min-h-11 rounded-xl bg-primy-700 px-4 text-sm font-semibold text-white">Reintentar</button>
          <button type="button" onClick={this.props.onGoHome} className="min-h-11 rounded-xl border border-default px-4 text-sm font-semibold text-primary">Volver al inicio</button>
        </div>
      </section>
    );
  }
}
