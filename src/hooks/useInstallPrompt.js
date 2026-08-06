import { useEffect, useState } from 'react';

export function useInstallPrompt() {
  const [event, setEvent] = useState(null);
  const [installed, setInstalled] = useState(() => window.matchMedia?.('(display-mode: standalone)').matches || Boolean(window.navigator.standalone));

  useEffect(() => {
    const beforeInstall = installEvent => {
      installEvent.preventDefault();
      setEvent(installEvent);
    };
    const onInstalled = () => {
      setInstalled(true);
      setEvent(null);
    };
    window.addEventListener('beforeinstallprompt', beforeInstall);
    window.addEventListener('appinstalled', onInstalled);
    return () => {
      window.removeEventListener('beforeinstallprompt', beforeInstall);
      window.removeEventListener('appinstalled', onInstalled);
    };
  }, []);

  const install = async () => {
    if (!event) return false;
    await event.prompt();
    const choice = await event.userChoice;
    if (choice?.outcome === 'accepted') setEvent(null);
    return choice?.outcome === 'accepted';
  };

  return { canInstall: Boolean(event), installed, install };
}
