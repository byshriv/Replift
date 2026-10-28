import { useState } from 'react';
import { useLocal, getRepository } from '../state/local';
import { disconnectDropbox, requestSync } from '../state/sync';
import { send, Sheet, SavedField, Field } from './ui';
import { equipment } from './Library';
import SyncPanel from './Sync';
import { defaultLayouts } from './Dashboard';
import { goals, experiences } from '../data/profile';
const reasons = [
  'I no longer train',
  'Too complicated',
  'Missing a feature I need',
  'Found another app',
  'Bugs or crashes',
  'Dropbox sync problems',
  'I don’t use it enough',
  'Other',
];
export function DeleteDevice({
  logout,
  close,
}: {
  logout: boolean;
  close: () => void;
}) {
  const state = useLocal(),
    [reason, setReason] = useState(''),
    [note, setNote] = useState(''),
    [typed, setTyped] = useState(''),
    [busy, setBusy] = useState(false),
    [error, setError] = useState('');
  const valid =
    typed.trim().toLowerCase() === 'delete' &&
    (logout || (!!reason && (reason !== 'Other' || !!note.trim())));
  return (
    <Sheet
      title={logout ? 'Log out of this device' : 'Delete local profile'}
      close={close}
    >
      <p>
        Workouts, routines, measures, photos, drafts, local backups and the
        original legacy copy on this origin will be erased. Dropbox files remain
        in your Dropbox. This cannot be undone here.
      </p>
      <p>
        {state.snapshot?.pending ?? 0} local changes pending acknowledgement. A
        Dropbox connection does not prove they reached the cloud. Export a
        complete backup before continuing.
      </p>
      {!logout && (
        <>
          <label>
            Why are you leaving?
            <select
              aria-label="Why are you leaving?"
              value={reason}
              onChange={(e) => {
                setReason(e.target.value);
                setNote('');
              }}
            >
              <option value="">Choose a reason</option>
              {reasons.map((r) => (
                <option key={r}>{r}</option>
              ))}
            </select>
          </label>
          {['Other', 'Missing a feature I need', 'Bugs or crashes'].includes(
            reason,
          ) && (
            <Field
              label={
                reason === 'Other'
                  ? 'Tell us why (required)'
                  : 'Feedback (optional)'
              }
              value={note}
              change={setNote}
            />
          )}{' '}
          {reason === 'Dropbox sync problems' && (
            <p>
              Dropbox help video coming soon. Connection details and retry
              controls are in Settings.
            </p>
          )}
          <a
            href="https://github.com/byshriv/Replift/issues/new/choose"
            target="_blank"
            rel="noreferrer"
          >
            Share feedback on GitHub (optional, public)
          </a>
          <p>
            Your answer stays here unless you choose to submit it on GitHub.
            Feedback is not required to delete local data.
          </p>
        </>
      )}
      <Field label="Type delete to confirm" value={typed} change={setTyped} />
      {error && <p role="alert">{error}</p>}
      <button
        className="danger"
        disabled={!valid || busy || !!state.queued || state.fatal}
        onClick={async () => {
          setBusy(true);
          try {
            await disconnectDropbox();
            const current = useLocal.getState();
            if (current.queued || current.error || current.fatal)
              throw new Error('Resolve unsaved edits before deletion.');
            await getRepository().eraseDevice(state.snapshot!.revision);
            for (const key of [
              'replift.v1',
              'replift.dbx.base.v1',
              'replift.dbx.oauth',
            ])
              localStorage.removeItem(key);
            location.reload();
          } catch (e) {
            setError(e instanceof Error ? e.message : 'Deletion failed.');
            setBusy(false);
          }
        }}
      >
        {busy
          ? 'Erasing…'
          : logout
            ? 'Erase local data and log out'
            : 'Delete everything on this device'}
      </button>
    </Sheet>
  );
}
export default function Settings() {
  const state = useLocal(),
    d = state.snapshot?.data,
    [deleting, setDeleting] = useState<'delete' | 'logout' | null>(null),
    [about, setAbout] = useState(false);
  if (!d)
    return (
      <>
        <SyncPanel />
        <a
          href="https://github.com/byshriv/Replift/issues/new/choose"
          target="_blank"
          rel="noreferrer"
        >
          Report an issue on GitHub
        </a>
        <p>Issues are public. Exclude private data.</p>
        <a href="mailto:support@shriv.work">support@shriv.work</a>
      </>
    );
  const disabled = !!state.queued || state.fatal;
  return (
    <>
      <section className="card">
        <h2>Local profile</h2>
        <h3>Goals</h3>
        <div className="chips">
          {goals.map((g) => {
            const selected = Array.isArray(d.pf?.goals)
              ? (d.pf.goals as string[])
              : typeof d.pf?.goals === 'string'
                ? [d.pf.goals]
                : [];
            return (
              <button
                key={g}
                className={selected.includes(g) ? '' : 'quiet'}
                aria-pressed={selected.includes(g)}
                disabled={disabled}
                onClick={() =>
                  send({
                    kind: 'preference',
                    group: 'pf',
                    key: 'goals',
                    value: selected.includes(g)
                      ? selected.filter((x) => x !== g)
                      : [...selected, g],
                  })
                }
              >
                {g}
              </button>
            );
          })}
        </div>
        <label>
          Experience
          <select
            aria-label="Experience"
            value={String(d.pf?.exp ?? '')}
            disabled={disabled}
            onChange={(e) =>
              send({
                kind: 'preference',
                group: 'pf',
                key: 'exp',
                value: e.target.value,
              })
            }
          >
            <option value="">Choose experience</option>
            {experiences.map((x) => (
              <option key={x}>{x}</option>
            ))}
          </select>
        </label>
        <SavedField
          label="Profile weight (kg)"
          numeric
          value={d.pf?.wt ?? ''}
          fieldKey="pf/wt"
          action={(value) => ({
            kind: 'preference',
            group: 'pf',
            key: 'wt',
            value,
          })}
        />
        {(['fn', 'ln'] as const).map((key, n) => (
          <SavedField
            key={key}
            label={n ? 'Last name' : 'First name'}
            value={d.pf?.[key]}
            fieldKey={`pf/${key}`}
            action={(value) => ({
              kind: 'preference',
              group: 'pf',
              key,
              value,
            })}
          />
        ))}
        <label>
          Gender
          <select
            aria-label="Gender"
            value={String(d.pf?.g ?? '')}
            disabled={disabled}
            onChange={(e) =>
              send({
                kind: 'preference',
                group: 'pf',
                key: 'g',
                value: e.target.value,
              })
            }
          >
            {['', 'Male', 'Female', 'Other', 'Prefer not to say'].map((v) => (
              <option key={v} value={v}>
                {v || 'Choose'}
              </option>
            ))}
          </select>
        </label>
        <label>
          Training days per week
          <select
            aria-label="Training days per week"
            value={String(d.pf?.days ?? 3)}
            disabled={disabled}
            onChange={(e) =>
              send({
                kind: 'preference',
                group: 'pf',
                key: 'days',
                value: Number(e.target.value),
              })
            }
          >
            {Array.from({ length: 7 }, (_, n) => (
              <option key={n} value={n + 1}>
                {n + 1}
              </option>
            ))}
          </select>
        </label>
      </section>
      <section className="card">
        <h2>Preferences</h2>
        <label>
          Units
          <select
            aria-label="Units"
            value={String(d.st?.u ?? 'kg')}
            disabled={disabled}
            onChange={(e) =>
              send({
                kind: 'preference',
                group: 'st',
                key: 'u',
                value: e.target.value,
              })
            }
          >
            <option value="kg">Metric · kg / km / cm</option>
            <option value="lb">Imperial · lb / mi / in</option>
          </select>
        </label>
        <label>
          First weekday
          <select
            aria-label="First weekday"
            value={String(d.st?.fd ?? 0)}
            disabled={disabled}
            onChange={(e) =>
              send({
                kind: 'preference',
                group: 'st',
                key: 'fd',
                value: Number(e.target.value),
              })
            }
          >
            {[
              'Sunday',
              'Monday',
              'Tuesday',
              'Wednesday',
              'Thursday',
              'Friday',
              'Saturday',
            ].map((day, n) => (
              <option key={n} value={n}>
                {day}
              </option>
            ))}
          </select>
        </label>
        <label>
          Default sets
          <select
            aria-label="Default sets"
            value={String(d.st?.sets ?? 3)}
            disabled={disabled}
            onChange={(e) =>
              send({
                kind: 'preference',
                group: 'st',
                key: 'sets',
                value: Number(e.target.value),
              })
            }
          >
            {Array.from({ length: 20 }, (_, n) => (
              <option key={n}>{n + 1}</option>
            ))}
          </select>
        </label>
        {[
          ['pr', 'Show personal records'],
          ['warm', 'Include warmups in muscle stats'],
          ['upd', 'Update routine values by default'],
          ['snd', 'Sound'],
        ].map(([key, label]) => (
          <label className="check-label" key={key}>
            <input
              type="checkbox"
              checked={
                !!(d.st?.[key!] ?? (key === 'pr' || key === 'upd' ? 1 : 0))
              }
              disabled={disabled}
              onChange={(e) =>
                send({
                  kind: 'preference',
                  group: 'st',
                  key: key!,
                  value: e.target.checked ? 1 : 0,
                })
              }
            />
            {label}
          </label>
        ))}
        <p>
          Haptics are available in the Android phase. Notification delivery is
          not enabled in this preview.
        </p>
        <button
          disabled={disabled}
          onClick={() => {
            send({ kind: 'layout', tab: 'home', blocks: defaultLayouts.home });
            send({
              kind: 'layout',
              tab: 'stats',
              blocks: defaultLayouts.stats,
            });
          }}
        >
          Reset layouts
        </button>
        <button
          disabled={disabled}
          onClick={() =>
            send({ kind: 'preference', group: 'wt', key: 'done', value: 0 })
          }
        >
          Replay first logger walkthrough
        </button>
      </section>
      <section className="card">
        <h2>My equipment</h2>
        <div className="chips">
          {equipment.map((e) => (
            <button
              className={(d.have ?? equipment).includes(e) ? '' : 'quiet'}
              key={e}
              aria-pressed={(d.have ?? equipment).includes(e)}
              disabled={disabled}
              onClick={() =>
                send({
                  kind: 'equipment',
                  value: (d.have ?? equipment).includes(e)
                    ? (d.have ?? equipment).filter((x) => x !== e)
                    : [...(d.have ?? equipment), e],
                })
              }
            >
              {e}
            </button>
          ))}
        </div>
      </section>
      <SyncPanel />
      <button disabled={disabled} onClick={() => requestSync()}>
        Done · request sync
      </button>
      <section className="card">
        <h2>Replift</h2>
        <a
          href="https://github.com/byshriv/Replift/issues/new/choose"
          target="_blank"
          rel="noreferrer"
        >
          Report an issue on GitHub
        </a>
        <p>
          Issues are public. Share only reproduction steps; exclude workouts,
          backups and connection details.
        </p>
        <a href="mailto:support@shriv.work">support@shriv.work</a>
        <p>
          <a href="https://shriv.work/privacy" target="_blank" rel="noreferrer">
            Privacy
          </a>
        </p>
        <button className="quiet" onClick={() => setAbout(true)}>
          About, Terms and Privacy
        </button>
        <p>
          Social links, exercise illustrations, donations and Dropbox help video
          will arrive later.
        </p>
      </section>
      <button
        className="quiet"
        disabled={disabled}
        onClick={() => setDeleting('logout')}
      >
        Log out
      </button>
      <button
        className="danger"
        disabled={disabled}
        onClick={() => setDeleting('delete')}
      >
        Delete local profile
      </button>
      {deleting && (
        <DeleteDevice
          logout={deleting === 'logout'}
          close={() => setDeleting(null)}
        />
      )}{' '}
      {about && (
        <Sheet title="About Replift" close={() => setAbout(false)}>
          <h2>Replift · Shriv</h2>
          <p>
            Free, open-source, local-first workout logging. Log after your sets,
            not between them.
          </p>
          <p>
            Phase 4 preview. MIT licence. No Replift backend, accounts, tracking
            or analytics. Dropbox is optional and user-owned.
          </p>
          <h3>Terms</h3>
          <p>
            Replift is provided as is, without warranty. Training involves risk,
            so use your own judgment and speak to a professional about health
            concerns.
          </p>
          <h3>Privacy</h3>
          <p>
            Your workouts stay on this device unless you connect Dropbox or
            explicitly export or share them. Dropbox receives synced files when
            connected. GitHub receives only what you choose to submit there.
          </p>
          <a href="https://shriv.work/privacy" target="_blank" rel="noreferrer">
            Shriv Privacy Policy
          </a>
        </Sheet>
      )}
    </>
  );
}
