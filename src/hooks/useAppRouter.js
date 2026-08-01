import { useCallback, useEffect, useMemo, useState } from 'react';

const ROUTES = {
  dashboard: '/',
  generate: '/crear',
  explore: '/juegos',
  plays: '/archivo',
  settings: '/ajustes',
};
const VIEWS = {
  ...Object.fromEntries(Object.entries(ROUTES).map(([view, path]) => [path, view])),
  '/explorar': 'explore',
  '/generar': 'generate',
  '/jugadas': 'plays',
};

function viewFromLocation() {
  const path = window.location.pathname.replace(/\/+$/, '') || '/';
  return VIEWS[path] || 'dashboard';
}

function prefersReducedMotion() {
  return window.matchMedia?.('(prefers-reduced-motion: reduce)').matches;
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
    if (normalized === view && window.location.pathname === ROUTES[normalized]) return;

    const commit = () => {
      const path = ROUTES[normalized];
      if (window.location.pathname !== path) window.history[replace ? 'replaceState' : 'pushState']({ view: normalized }, '', path);
      setView(normalized);
      window.scrollTo({ top: 0, behavior: 'auto' });
    };

    if (document.startViewTransition && !prefersReducedMotion()) {
      document.startViewTransition(commit);
    } else {
      commit();
    }
  }, [view]);

  return useMemo(() => ({ view, navigate, routes: ROUTES }), [view, navigate]);
}
