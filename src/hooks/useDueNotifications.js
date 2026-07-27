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
        body: `${dueCount} ${dueCount === 1 ? 'giocata è pronta' : 'giocate sono pronte'} per la verifica.`,
        icon: '/icon-192x192.png',
      });
      localStorage.setItem(NOTIFIED_KEY, marker);
    } catch {
      // Le notifiche sono una funzione facoltativa.
    }
  }, [enabled, dueCount]);
}
