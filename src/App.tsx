import { Suspense, lazy, useEffect, useState } from 'react';
import {
  Activity,
  BookOpen,
  Dumbbell,
  House,
  Settings,
  UserRound,
  HardDrive,
} from 'lucide-react';
import { tabs, useNavigation } from './state/navigation';
import { useLocal } from './state/local';
const Routines = lazy(() => import('./features/Routines'));
import Workout from './features/Workout';
import Library from './features/Library';
import Stats, { Dashboard } from './features/Dashboard';
const SettingsPanel = lazy(() => import('./features/Settings'));
import { PwaStatus } from './features/Pwa';
import Onboarding from './features/Onboarding';
import SyncPanel from './features/Sync';
import { initializeSync, useSync } from './state/sync';
const icons = {
  Home: House,
  Stats: Activity,
  Workout: Dumbbell,
  Library: BookOpen,
  Settings,
};

export default function App() {
  const { tab, navigate } = useNavigation();
  const local = useLocal();
  const sync = useSync();
  const [details, showDetails] = useState(false);
  const [backHint, setBackHint] = useState(false);
  const [touchStart, setTouchStart] = useState<{ x: number; y: number } | null>(
    null,
  );
  const [now, setNow] = useState(() => new Date());
  useEffect(() => {
    window.scrollTo({ top: 0, behavior: 'instant' });
  }, [tab]);
  useEffect(() => {
    void useLocal.getState().load();
    let active = true,
      exitArmed = 0;
    void initializeSync().finally(() => {
      if (active && !history.state?.repliftGuard)
        history.pushState({ repliftGuard: true }, '');
    });
    const back = () => {
      if (document.querySelector('dialog[open]')) {
        history.pushState({ repliftGuard: true }, '');
        return;
      }
      if (useNavigation.getState().tab !== 'Home') {
        useNavigation.getState().navigate('Home');
        history.pushState({ repliftGuard: true }, '');
        return;
      }
      if (Date.now() - exitArmed < 2000) {
        history.back();
        return;
      }
      exitArmed = Date.now();
      setBackHint(true);
      history.pushState({ repliftGuard: true }, '');
    };
    window.addEventListener('popstate', back);
    const timer = setInterval(() => setNow(new Date()), 60_000);
    return () => {
      active = false;
      clearInterval(timer);
      window.removeEventListener('popstate', back);
    };
  }, []);

  const status = local.fatal
    ? 'Storage unavailable'
    : local.error
      ? 'Not saved'
      : local.queued
        ? 'Saving locally…'
        : local.snapshot
          ? 'Saved on this device'
          : 'Opening storage…';
  return (
    <div
      className="shell"
      onClickCapture={(e) => {
        // Safari does not focus tapped buttons; dialogs need a reliable opener.
        (e.target as HTMLElement)
          .closest<HTMLButtonElement>('button')
          ?.focus({ preventScroll: true });
      }}
      onTouchStart={(e) => {
        if (
          !(e.target as HTMLElement).closest(
            'input,textarea,select,button,a,dialog,.chart,.workout-cards',
          )
        )
          setTouchStart({ x: e.touches[0]!.clientX, y: e.touches[0]!.clientY });
      }}
      onTouchEnd={(e) => {
        if (touchStart) {
          const dx = e.changedTouches[0]!.clientX - touchStart.x,
            dy = e.changedTouches[0]!.clientY - touchStart.y;
          if (Math.abs(dx) > 90 && Math.abs(dy) < 60) {
            const next = tabs[tabs.indexOf(tab) + (dx < 0 ? 1 : -1)];
            if (next) navigate(next);
          }
          setTouchStart(null);
        }
      }}
    >
      <a className="skip" href="#main">
        Skip to content
      </a>
      <header className="topbar">
        <time dateTime={now.toLocaleDateString('en-CA')}>
          {now.toLocaleDateString(undefined, {
            weekday: 'short',
            month: 'short',
            day: 'numeric',
          })}
        </time>
        <div className="top-actions">
          <button
            className="local-status"
            onClick={() => showDetails(!details)}
            aria-expanded={details}
          >
            <HardDrive size={17} aria-hidden="true" />
            {status}
            {sync.connected && (
              <span>
                {' '}
                ·{' '}
                {sync.busy
                  ? 'Syncing…'
                  : sync.error
                    ? 'Sync needs attention'
                    : Object.values(sync.doc?.records ?? {}).some(
                          (v) => v.length > 1,
                        )
                      ? 'Review conflicts'
                      : local.snapshot?.pending
                        ? 'Sync pending'
                        : 'Dropbox acknowledged'}
              </span>
            )}
          </button>
          <button
            className="icon-button"
            aria-label="Open profile"
            onClick={() => navigate('Settings')}
          >
            <UserRound size={21} />
          </button>
        </div>
      </header>
      {details && (
        <section className="card" aria-label="Storage and sync status">
          <h2>Local storage</h2>
          <p>{status}</p>
          <p>{sync.status}</p>
          <p>{local.snapshot?.pending ?? 0} local changes pending sync.</p>
          {tab !== 'Settings' && <SyncPanel />}
          <p>
            Local browser storage can be cleared by the browser or device. Keep
            the original legacy copy until a complete backup and restore has
            been verified.
          </p>
        </section>
      )}
      <p className="badge">
        Phase 5 development preview · production unchanged
      </p>
      <PwaStatus />
      {backHint && (
        <p role="status" className="badge">
          Press Back again to exit.
        </p>
      )}
      {local.error && (
        <section role="alert" className="card error">
          <h2>
            {local.fatal
              ? 'Local storage needs attention'
              : 'Changes are not saved'}
          </h2>
          <p>{local.error}</p>
          <p>
            Keep this tab open while unsaved edits remain. Original data has not
            been erased.
          </p>
          <button onClick={local.retry}>
            {local.fatal ? 'Retry storage' : 'Retry saving'}
          </button>
          {!local.fatal && (
            <button
              onClick={() => {
                if (
                  window.confirm(
                    'Discard only the unsaved edits in this tab? Saved data and recovery points will be retained.',
                  )
                )
                  local.discard();
              }}
            >
              Discard unsaved edits
            </button>
          )}
        </section>
      )}
      <p className="save-status" aria-live="polite">
        {status}
      </p>
      <main id="main" tabIndex={-1}>
        <p className="eyebrow">LOG AFTER YOUR SETS, NOT BETWEEN THEM.</p>
        <h1>
          {tab === 'Home' ? (
            <>
              {now.getHours() < 12
                ? 'Good morning'
                : now.getHours() < 17
                  ? 'Good afternoon'
                  : 'Good evening'}
              <br />
              {String(local.snapshot?.data.pf?.fn || 'Let’s lift.')}
            </>
          ) : (
            tab
          )}
        </h1>
        <Suspense fallback={<p role="status">Opening screen...</p>}>
          {tab === 'Home' ? (
            <>
              {local.snapshot &&
                !local.fatal &&
                !local.snapshot.data.ob?.done &&
                !local.snapshot.data.wk.length &&
                !local.snapshot.data.prog.length && <Onboarding />}
              <Dashboard tab="home" />
              <div className="sync-actions">
                <button onClick={() => navigate('Workout')}>
                  Edit routines <Dumbbell size={18} />
                </button>
                <button onClick={() => navigate('Library')}>
                  Explore the library <BookOpen size={18} />
                </button>
              </div>
            </>
          ) : tab === 'Workout' ? (
            <>
              <Workout />
              <details className="card" open>
                <summary>Edit programs and routines</summary>
                <Suspense fallback={<p>Opening programs...</p>}>
                  <Routines />
                </Suspense>
              </details>
            </>
          ) : tab === 'Library' ? (
            <>
              <Library />
              <details className="card">
                <summary>Programs and templates</summary>
                <Suspense fallback={<p>Opening programs...</p>}>
                  <Routines />
                </Suspense>
              </details>
            </>
          ) : tab === 'Settings' ? (
            <SettingsPanel />
          ) : local.snapshot ? (
            <Stats />
          ) : (
            <p>Opening your stats…</p>
          )}
        </Suspense>
      </main>
      {local.snapshot?.data.draft && tab !== 'Workout' && (
        <button className="draft-bar" onClick={() => navigate('Workout')}>
          Resume {String(local.snapshot.data.draft.title ?? 'workout')} ·{' '}
          {status}
        </button>
      )}
      <nav aria-label="Main navigation">
        {tabs.map((name) => {
          const Icon = icons[name];
          return (
            <button
              key={name}
              aria-current={tab === name ? 'page' : undefined}
              onClick={() => navigate(name)}
            >
              <Icon size={21} aria-hidden="true" />
              <span>{name}</span>
            </button>
          );
        })}
      </nav>
    </div>
  );
}
