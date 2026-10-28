import { useEffect, useState } from 'react';
import {
  Activity,
  BookOpen,
  Dumbbell,
  House,
  Settings,
  UserRound,
  HardDrive,
} from 'lucide-react';
import { catalogue } from './data/catalogue';
import { filterExercises } from './domain/exercise';
import { tabs, useNavigation } from './state/navigation';
import { useLocal } from './state/local';
import Routines from './features/Routines';
const icons = {
  Home: House,
  Stats: Activity,
  Workout: Dumbbell,
  Library: BookOpen,
  Settings,
};

export default function App() {
  const { tab, query, navigate, search } = useNavigation();
  const local = useLocal();
  const [details, showDetails] = useState(false);
  const [now, setNow] = useState(() => new Date());
  useEffect(() => {
    void useLocal.getState().load();
    const timer = setInterval(() => setNow(new Date()), 60_000);
    return () => clearInterval(timer);
  }, []);
  const results = filterExercises(catalogue, query);
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
    <div className="shell">
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
          <p>
            Dropbox is not connected in this preview. Transport arrives in Phase
            3.
          </p>
          <p>
            {local.snapshot?.pending ?? 0} local changes pending future sync. No
            cloud acknowledgement has occurred.
          </p>
          <p>
            Local browser storage can be cleared by the browser or device. Keep
            the original legacy copy until a complete backup and restore has
            been verified.
          </p>
        </section>
      )}
      <p className="badge">
        Phase 2 development preview · production unchanged
      </p>
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
        <h1>{tab === 'Home' ? 'Your routines, saved here.' : tab}</h1>
        {tab === 'Home' ? (
          <>
            <section className="card">
              <h2>Built around your data</h2>
              <p>
                Routines save locally as you edit. Legacy history, measurements,
                photos and other collections are retained; their full screens
                return in later phases.
              </p>
              {local.snapshot && (
                <p>
                  {local.snapshot.data.wk.length} workouts ·{' '}
                  {local.snapshot.data.ph?.length ?? 0} photos retained
                </p>
              )}
              <button onClick={() => navigate('Workout')}>
                Edit routines <Dumbbell size={18} />
              </button>
            </section>
            <section className="card">
              <h2>420 exercises, preserved</h2>
              <button onClick={() => navigate('Library')}>
                Explore the library <BookOpen size={18} />
              </button>
            </section>
          </>
        ) : tab === 'Workout' ? (
          <>
            <p className="lead">Programs and routine defaults</p>
            <Routines />
            <p>Workout logging returns in Phase 4.</p>
          </>
        ) : tab === 'Library' ? (
          <>
            <p className="lead">
              Read-only catalogue from the preserved baseline.
            </p>
            <label htmlFor="search">Search exercises</label>
            <input
              id="search"
              type="search"
              value={query}
              onChange={(event) => search(event.target.value)}
              placeholder="Try bench press"
            />
            <p role="status">{results.length} exercises</p>
            <ul className="exercises">
              {results.map((exercise) => (
                <li key={exercise.id}>
                  <span className="serial">{exercise.serial}</span>
                  <div>
                    <h2>{exercise.name}</h2>
                    <p>
                      {exercise.muscle} · {exercise.equipment}
                    </p>
                  </div>
                </li>
              ))}
            </ul>
            {!results.length && <p>No exercises match your search.</p>}
          </>
        ) : tab === 'Settings' ? (
          <section className="card">
            <h2>Local profile</h2>
            <p>
              {[local.snapshot?.data.pf?.fn, local.snapshot?.data.pf?.ln]
                .filter((x) => typeof x === 'string')
                .join(' ') || 'No profile name saved'}
            </p>
            <p>
              Profile editing and other settings return with the feature port.
            </p>
            <p>Dropbox is not connected in this preview.</p>
            <a
              href="https://github.com/byshriv/Replift/issues/new/choose"
              target="_blank"
              rel="noreferrer"
            >
              Report an issue on GitHub
            </a>
            <p>
              Issues are public. Include only reproduction steps; exclude
              workouts, backups and connection details.
            </p>
            <a href="mailto:support@shriv.work">support@shriv.work</a>
          </section>
        ) : (
          <section className="card">
            <h2>Coming in a later phase</h2>
            <p>
              Charts, measurements and progress photo screens return with the
              feature port. Existing data is retained in local storage.
            </p>
          </section>
        )}
      </main>
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
