import { StrictMode } from 'react';
import { createRoot } from 'react-dom/client';
import App from './App';
import { ErrorBoundary } from './features/ui';
import './style.css';
import { initializePwa } from './platform/pwa';
import {
  initializeAndroid,
  backController,
  isAndroid,
} from './platform/android';
import { acceptNativeOAuth, useSync } from './state/sync';
import { useLocal } from './state/local';
import { useNavigation } from './state/navigation';
initializePwa();
if (isAndroid()) {
  const back = backController({
    closeSheet: () => {
      const dialog = [
        ...document.querySelectorAll<HTMLDialogElement>('dialog[open]'),
      ].at(-1);
      if (!dialog) return false;
      dialog.close();
      return true;
    },
    home: () => {
      if (useNavigation.getState().tab === 'Home') return false;
      useNavigation.getState().navigate('Home');
      return true;
    },
    unsaved: () => {
      const s = useLocal.getState();
      return !s.snapshot || !!s.queued || !!s.error || s.fatal;
    },
    hint: (message) =>
      window.dispatchEvent(
        new CustomEvent('replift-back-hint', { detail: message }),
      ),
    exit: async () => {
      const { App } = await import('@capacitor/app');
      await App.exitApp();
    },
  });
  void initializeAndroid(acceptNativeOAuth, back).catch(() =>
    useSync.setState({
      error:
        'Android controls could not start. Reopen Replift; saved data is retained.',
    }),
  );
}
createRoot(document.getElementById('root')!).render(
  <StrictMode>
    <ErrorBoundary>
      <App />
    </ErrorBoundary>
  </StrictMode>,
);
