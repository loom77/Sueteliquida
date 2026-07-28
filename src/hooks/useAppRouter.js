import { useCallback, useEffect, useMemo, useState } from 'react';

const ROUTES = {
  dashboard: '/',
  generate: '/crear',
  explore: '/explorar',
  plays: '/archivo',
  settings: '/ajustes',
};
const VIEWS = {
  ...Object.fromEntries(Object.entries(ROUTES).map(([view, path]) => [path, view])),
  '/generar': 'generate',
  '/jugadas': 'plays',
};

function viewFromLocation() {
  const path = window.location.pathname.replace(/\/+$/, '') || '/';
  return VIEWS[path] || 'dashboard';
}

export function useAppRouter() {
  const [view, setView] = useState(() => viewFromLocation());

  useEffect(() => {
    const onPopState = () => setView(viewFromLocation());
    window.addEventListener('popstate', onPopState);
    return () => window.removeEventListener('popstate', onPopState);
  }, []);

  const navigate = useCallback((nextView, { replace = false } = {}) => {
    const normalized = ROUTES[nextView] ? nextView : 'dashboard';
    const path = ROUTES[normalized];
    if (window.location.pathname !== path) window.history[replace ? 'replaceState' : 'pushState']({ view: normalized }, '', path);
    setView(normalized);
    window.scrollTo({ top: 0, behavior: 'auto' });
  }, []);

  return useMemo(() => ({ view, navigate, routes: ROUTES }), [view, navigate]);
}
