import { create } from 'zustand';
import { isAndroid } from './android';

type InstallEvent = Event & {
  prompt: () => Promise<void>;
  userChoice: Promise<{ outcome: string }>;
};
type State = {
  offline: boolean;
  ready: boolean;
  waiting: boolean;
  installed: boolean;
  install: InstallEvent | null;
  error: string;
};
export const usePwa = create<State>(() => ({
  offline: !navigator.onLine,
  ready: false,
  waiting: false,
  installed: matchMedia('(display-mode: standalone)').matches,
  install: null,
  error: '',
}));
let registration: ServiceWorkerRegistration | undefined;
let started = false;
export function initializePwa() {
  if (started) return;
  started = true;
  window.addEventListener('online', () => usePwa.setState({ offline: false }));
  window.addEventListener('offline', () => usePwa.setState({ offline: true }));
  if (isAndroid()) return; // Bundled assets; a worker can obstruct the native bridge.
  window.addEventListener('beforeinstallprompt', (e) => {
    e.preventDefault();
    usePwa.setState({ install: e as InstallEvent });
  });
  window.addEventListener('appinstalled', () =>
    usePwa.setState({ installed: true, install: null }),
  );
  if (!import.meta.env.PROD || !('serviceWorker' in navigator)) return;
  void navigator.serviceWorker
    .register('/sw.js', { updateViaCache: 'none' })
    .then((r) => {
      registration = r;
      const refresh = () =>
        usePwa.setState({ ready: !!r.active, waiting: !!r.waiting });
      const watch = () => {
        r.installing?.addEventListener('statechange', refresh);
        refresh();
      };
      watch();
      r.addEventListener('updatefound', watch);
      void navigator.serviceWorker.ready.then(refresh);
      window.addEventListener('focus', () => {
        void checkForUpdate();
      });
    })
    .catch(() =>
      usePwa.setState({
        error: 'Offline setup failed. Reconnect and reopen Replift to retry.',
      }),
    );
}
export async function checkForUpdate() {
  if (!registration) {
    usePwa.setState({
      error:
        'Update checks are unavailable until offline setup succeeds in a supported browser.',
    });
    return;
  }
  try {
    await registration.update();
    usePwa.setState({
      error:
        'Update check requested. An available update will appear when ready.',
    });
  } catch {
    usePwa.setState({
      error:
        'Could not check for updates. Your current version remains available.',
    });
  }
}
export async function installApp() {
  const event = usePwa.getState().install;
  if (!event) return;
  usePwa.setState({ install: null });
  try {
    await event.prompt();
    await event.userChoice;
  } catch {
    usePwa.setState({ error: 'Use your browser menu to install Replift.' });
  }
}
