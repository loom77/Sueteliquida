import { useCallback, useEffect, useMemo, useRef, useState } from 'react';

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

export function useAppRouter({ shouldBlockNavigation, onBlockedNavigation } = {}) {
  const [view, setView] = useState(() => viewFromLocation());
  const viewRef = useRef(view);
  const shouldBlockRef = useRef(shouldBlockNavigation);
  const onBlockedRef = useRef(onBlockedNavigation);

  useEffect(() => { viewRef.current = view; }, [view]);
  useEffect(() => { shouldBlockRef.current = shouldBlockNavigation; }, [shouldBlockNavigation]);
  useEffect(() => { onBlockedRef.current = onBlockedNavigation; }, [onBlockedNavigation]);

  useEffect(() => {
    const onPopState = () => {
      const nextView = viewFromLocation();
      const currentView = viewRef.current;
      if (nextView !== currentView && shouldBlockRef.current?.(nextView)) {
        const currentPath = ROUTES[currentView] || ROUTES.dashboard;
        window.history.pushState({ view: currentView }, '', currentPath);
        onBlockedRef.current?.(nextView, { source: 'history' });
        return;
      }
      setView(nextView);
    };
    window.addEventListener('popstate', onPopState);
    return () => window.removeEventListener('popstate', onPopState);
  }, []);

  const navigate = useCallback((nextView, { replace = false, force = false } = {}) => {
    const normalized = ROUTES[nextView] ? nextView : 'dashboard';
    const currentView = viewRef.current;
    if (normalized === currentView && window.location.pathname === ROUTES[normalized]) return true;

    if (!force && normalized !== currentView && shouldBlockRef.current?.(normalized)) {
      onBlockedRef.current?.(normalized, { source: 'app' });
      return false;
    }

    const commit = () => {
      const path = ROUTES[normalized];
      if (window.location.pathname !== path) window.history[replace ? 'replaceState' : 'pushState']({ view: normalized }, '', path);
      viewRef.current = normalized;
      setView(normalized);
      window.scrollTo({ top: 0, behavior: 'auto' });
    };

    if (document.startViewTransition && !prefersReducedMotion()) {
      document.startViewTransition(commit);
    } else {
      commit();
    }
    return true;
  }, []);

  return useMemo(() => ({ view, navigate, routes: ROUTES }), [view, navigate]);
}
