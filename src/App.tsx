import {
  Activity,
  BookOpen,
  Dumbbell,
  House,
  Settings,
  ShieldCheck,
} from 'lucide-react';
import { catalogue } from './data/catalogue';
import { filterExercises } from './domain/exercise';
import { tabs, useNavigation } from './state/navigation';
const icons = {
  Home: House,
  Stats: Activity,
  Workout: Dumbbell,
  Library: BookOpen,
  Settings,
};
const pending = {
  Stats:
    'Your charts, measurements and progress photos will return with the feature port.',
  Workout:
    'Workout logging and draft recovery will return after the local storage engine is rebuilt.',
  Settings:
    'Profiles, units and optional Dropbox sync will return in later phases.',
};
export default function App() {
  const { tab, query, navigate, search } = useNavigation();
  const results = filterExercises(catalogue, query);
  return (
    <div className="shell">
      <a className="skip" href="#main">
        Skip to content
      </a>
      <header>
        <span className="brand">
          <Dumbbell aria-hidden="true" /> Replift
        </span>
        <span className="badge">Phase 1 preview</span>
      </header>
      <main id="main" tabIndex={-1}>
        <p className="eyebrow">LOG AFTER YOUR SETS, NOT BETWEEN THEM.</p>
        <h1>{tab === 'Home' ? 'A stronger foundation.' : tab}</h1>
        {tab === 'Home' ? (
          <>
            <p className="lead">
              The next chapter of your quiet workout logger.
            </p>
            <section className="card">
              <ShieldCheck aria-hidden="true" />
              <h2>Built around your data</h2>
              <p>
                This is a development preview. Workout logging, local saving and
                Dropbox sync are not available yet.
              </p>
              <p>Your existing workouts are not loaded or changed here.</p>
            </section>
            <section className="card">
              <h2>420 exercises, preserved</h2>
              <p>
                The original exercise identities and order are carried forward
                from the deployed baseline.
              </p>
              <button onClick={() => navigate('Library')}>
                Explore the library <BookOpen size={18} aria-hidden="true" />
              </button>
            </section>
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
        ) : (
          <section className="card">
            <h2>Coming in a later phase</h2>
            <p>{pending[tab]}</p>
            <p>This preview does not access workout storage.</p>
            {tab === 'Settings' && (
              <>
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
              </>
            )}
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
