import { useState } from 'react';
import { useLocal } from '../state/local';
import { send, SavedField, Sheet } from './ui';
import { equipment } from './Library';
import { connectDropbox } from '../state/sync';
import { goals, experiences } from '../data/profile';
import SyncPanel from './Sync';
export default function Onboarding() {
  const state = useLocal(),
    d = state.snapshot!.data,
    [localWarning, setLocalWarning] = useState(false),
    [noAccount, setNoAccount] = useState(false),
    step = Number(d.ob?.i ?? -1),
    disabled = !!state.queued || state.fatal;
  const steps = [
      'gender',
      'name',
      'used',
      ...(d.pf?.used === false ? ['help'] : []),
      'goals',
      'exp',
      'push',
      'days',
      'equipment',
      'weight',
      'storage',
    ],
    key = steps[step];
  const next = () =>
    send({ kind: 'preference', group: 'ob', key: 'i', value: step + 1 });
  const choose = (key: string, value: unknown) =>
    send({ kind: 'preference', group: 'pf', key, value });
  const options = (key: string, items: (string | number | boolean)[]) => (
    <div className="choices">
      {items.map((v) => (
        <button
          key={String(v)}
          disabled={disabled}
          aria-pressed={d.pf?.[key] === v}
          className={d.pf?.[key] === v ? 'selected' : 'quiet'}
          onClick={() => choose(key, v)}
        >
          {v === true ? 'Yes' : v === false ? 'No' : String(v)}
        </button>
      ))}
    </div>
  );
  const valid = key !== 'name' || !!String(d.pf?.fn ?? '').trim();
  return (
    <section className="card onboarding" aria-label="Welcome to Replift">
      <p className="eyebrow">REPLIFT</p>
      {step < 0 ? (
        <>
          <h1>
            Log after your sets,
            <br />
            not between them.
          </h1>
          <p>Your training, on your device. No account required.</p>
          <button disabled={disabled} onClick={next}>
            Get started
          </button>
          <button className="quiet" onClick={() => setNoAccount(true)}>
            Already have a profile?
          </button>
          <button
            className="quiet"
            disabled={disabled}
            onClick={() =>
              send({ kind: 'preference', group: 'ob', key: 'done', value: 1 })
            }
          >
            I’ll set up later
          </button>
        </>
      ) : (
        <>
          <small>
            Step {step + 1} of {steps.length}
          </small>
          <h1>
            {{
              gender: 'About you',
              name: 'What’s your name?',
              used: 'Used a workout logger before?',
              help: 'A little guidance',
              goals: 'Your training goal',
              exp: 'Training experience',
              push: 'Beat last time',
              days: 'Days per week',
              equipment: 'Your equipment',
              weight: 'Body weight',
              storage: 'Where to save',
            }[key!] ?? 'Ready to train?'}
          </h1>
          {key === 'gender' &&
            options('g', ['Male', 'Female', 'Other', 'Prefer not to say'])}
          {key === 'name' && (
            <SavedField
              label="Your first name"
              value={d.pf?.fn}
              fieldKey="onboarding/fn"
              action={(value) => ({
                kind: 'preference',
                group: 'pf',
                key: 'fn',
                value,
              })}
            />
          )}{' '}
          {key === 'used' && options('used', [true, false])}
          {key === 'help' && (
            <p>
              Create a routine or start empty. After training, log your sets and
              finish with your workout duration. Replift saves drafts as you
              edit.
            </p>
          )}
          {key === 'goals' && (
            <div className="choices">
              {goals.map((g) => {
                const selected = Array.isArray(d.pf?.goals)
                  ? (d.pf.goals as string[])
                  : [];
                return (
                  <button
                    key={g}
                    disabled={disabled}
                    className={selected.includes(g) ? '' : 'quiet'}
                    aria-pressed={selected.includes(g)}
                    onClick={() =>
                      choose(
                        'goals',
                        selected.includes(g)
                          ? selected.filter((x) => x !== g)
                          : [...selected, g],
                      )
                    }
                  >
                    {g}
                  </button>
                );
              })}
            </div>
          )}
          {key === 'exp' && options('exp', experiences)}
          {key === 'push' && (
            <p>
              Progress comes from one more rep or a little more weight. Replift
              shows Previous and Max. Notification delivery comes in a later
              phase.
            </p>
          )}
          {key === 'days' && options('days', [1, 2, 3, 4, 5, 6, 7])}
          {key === 'equipment' && (
            <div className="chips">
              {equipment.map((e) => (
                <button
                  key={e}
                  className={(d.have ?? equipment).includes(e) ? '' : 'quiet'}
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
          )}
          {key === 'weight' && (
            <SavedField
              label="Body weight (kg, optional)"
              numeric
              value={d.pf?.wt}
              fieldKey="onboarding/weight"
              action={(value) => ({
                kind: 'preference',
                group: 'pf',
                key: 'wt',
                value,
              })}
            />
          )}{' '}
          {key === 'storage' ? (
            <>
              <p>
                Save locally or connect your own Dropbox. No Replift account is
                created.
              </p>
              <SyncPanel />
              <button disabled={disabled} onClick={() => setLocalWarning(true)}>
                Save locally
              </button>
              <button
                className="quiet"
                disabled={disabled}
                onClick={() =>
                  send({
                    kind: 'preference',
                    group: 'ob',
                    key: 'done',
                    value: 1,
                  })
                }
              >
                Let’s go
              </button>
            </>
          ) : (
            <button
              disabled={
                !valid ||
                disabled ||
                (['gender', 'used', 'goals', 'exp', 'days'].includes(
                  key ?? '',
                ) &&
                  d.pf?.[key === 'gender' ? 'g' : key!] == null)
              }
              onClick={next}
            >
              Continue
            </button>
          )}
          <button
            className="quiet"
            disabled={disabled}
            onClick={() =>
              send({
                kind: 'preference',
                group: 'ob',
                key: 'i',
                value: step - 1,
              })
            }
          >
            Back
          </button>
        </>
      )}
      {noAccount && (
        <Sheet title="No account found" close={() => setNoAccount(false)}>
          <p>
            There are no Replift accounts. Connect your own Dropbox, restore a
            complete backup in Settings, or create a local profile.
          </p>
          <button onClick={() => void connectDropbox()}>Connect Dropbox</button>
          <button
            onClick={() => {
              setNoAccount(false);
              next();
            }}
          >
            Create local profile
          </button>
        </Sheet>
      )}
      {localWarning && (
        <Sheet title="Save locally" close={() => setLocalWarning(false)}>
          <p>
            Browser or device cleanup can erase local data. Keep complete
            backups in Settings. You can connect Dropbox later.
          </p>
          <button
            disabled={disabled}
            onClick={() =>
              send({ kind: 'preference', group: 'ob', key: 'done', value: 1 })
            }
          >
            Continue with local storage
          </button>
        </Sheet>
      )}
    </section>
  );
}
