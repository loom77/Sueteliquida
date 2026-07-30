import { useEffect } from 'react';

const NOTIFIED_KEY = 'primy_due_notification_v1';

export function useDueNotifications({ enabled, dueCount }) {
  useEffect(() => {
    if (!enabled || !dueCount || !('Notification' in window) || Notification.permission !== 'granted') return;
    const day = new Date().toISOString().slice(0, 10);
    const marker = `${day}:${dueCount}`;
    try {
      if (localStorage.getItem(NOTIFIED_KEY) === marker) return;
      new Notification('Primy', {
        body: `${dueCount} ${dueCount === 1 ? 'jugada está lista' : 'jugadas están listas'} para comprobar.`,
        icon: '/icon-192x192-v15.png',
      });
      localStorage.setItem(NOTIFIED_KEY, marker);
    } catch {
      // Las notificaciones son una función opcional.
    }
  }, [enabled, dueCount]);
}
