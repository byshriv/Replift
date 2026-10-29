import { Download, WifiOff, RefreshCw } from 'lucide-react';
import { usePwa, checkForUpdate, installApp } from '../platform/pwa';
import { useLocal } from '../state/local';
import { isAndroid } from '../platform/android';

export function PwaStatus() {
  const pwa = usePwa(),
    local = useLocal();
  return (
    <>
      {pwa.offline && (
        <p className="badge" role="status">
          <WifiOff size={16} aria-hidden="true" /> Offline · saved edits stay on
          this device. Dropbox retries when online.
        </p>
      )}
      {pwa.waiting && (
        <section className="card" aria-label="Update ready">
          <h2>
            <RefreshCw size={20} aria-hidden="true" /> Update ready
          </h2>
          <p>
            Finish editing, wait for “Saved on this device”, then close every
            Replift tab and installed window and reopen. The update waits until
            all are closed. No automatic reload.
          </p>
          {!!local.queued || !!local.error || local.fatal ? (
            <p role="alert">
              Keep this tab open: resolve unsaved changes before closing.
            </p>
          ) : (
            <p>Your saved workout draft will resume after reopening.</p>
          )}
        </section>
      )}
    </>
  );
}
export default function PwaSettings() {
  const pwa = usePwa();
  if (isAndroid())
    return (
      <section className="card" aria-label="Android installation and updates">
        <h2>Android installation and updates</h2>
        <p>
          Replift’s screens are bundled for offline use. Dropbox needs a
          connection.
        </p>
        <p>
          Install updates over this app using the same signing key. Do not
          uninstall or clear app storage: that removes this app’s local data.
          Keep a complete backup outside Replift.
        </p>
        <p>
          The browser/PWA and APK have separate data. Use Dropbox with the same
          account and review conflicts, or transfer a complete backup below.
        </p>
      </section>
    );
  return (
    <section className="card" aria-label="Install and offline">
      <h2>Install and offline</h2>
      <p>
        {pwa.ready
          ? 'Offline shell ready. Reopen once online to let this browser control the app, then it can open offline.'
          : 'Offline setup is pending or unavailable in this browser. First open requires a connection.'}{' '}
        Browser storage may still be evicted; keep complete backups.
      </p>
      {pwa.installed ? (
        <p>Replift is running as an installed app.</p>
      ) : pwa.install ? (
        <button onClick={() => void installApp()}>
          <Download size={18} aria-hidden="true" />
          Install Replift
        </button>
      ) : (
        <p>
          Android/desktop: use the browser menu → Install app. iPhone/iPad:
          Safari → Share → Add to Home Screen. Availability depends on your
          browser.
        </p>
      )}
      <button className="quiet" onClick={() => void checkForUpdate()}>
        Check for updates
      </button>
      <p>
        Updates wait for every Replift window to close. Saved data and drafts
        stay in existing local storage. Updates never clear workout data.
      </p>
      {pwa.error && <p role="status">{pwa.error}</p>}
    </section>
  );
}
