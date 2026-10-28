import { useEffect, useState } from 'react';
import {
  Check,
  Plus,
  MoreHorizontal,
  Medal,
  Share2,
  ArrowLeft,
} from 'lucide-react';
import { useLocal } from '../state/local';
import { useNavigation } from '../state/navigation';
import { fieldLabels } from '../domain/local';
import {
  exercise,
  num,
  previous,
  validSet,
  recomputeRecords,
  type Workout as WorkoutData,
} from '../domain/workout';
import {
  canonicalValue,
  displayValue,
  summary,
  unitLabel,
  weekStart,
  streak,
} from '../domain/metrics';
import {
  reconstruct,
  defaultContext,
  type Context,
} from '../domain/reconstruct';
import {
  send,
  playCheck,
  uid,
  Sheet,
  Confirm,
  SavedField,
  Field,
  PhotoInput,
  dateInput,
} from './ui';
import { ExercisePicker } from './Library';
import { cardFiles, shareImages, downloadImage } from '../platform/share';
import { optionalLinks } from '../platform/links';
import { draftTarget, type Action } from '../domain/port';

function Estimates({ item, close }: { item: number; close: () => void }) {
  const d = useLocal((s) => s.snapshot!.data),
    it = d.draft?.items[item],
    [context, setContext] = useState<Context>({ ...defaultContext }),
    [set, setSet] = useState(it?.sets.findIndex((s) => !s.done) ?? -1),
    [all, setAll] = useState(false),
    [generated, generate] = useState(false),
    [choices, choose] = useState<Record<number, number>>({}),
    [target] = useState(() => draftTarget(d, item));
  if (!it || draftTarget(d, item).itemId !== target.itemId)
    return (
      <Sheet title="Reconstruct forgotten sets" close={close}>
        <p>The exercise changed. Close and reopen reconstruction.</p>
      </Sheet>
    );
  const indices = all ? it.sets.flatMap((s, n) => (s.done ? [] : [n])) : [set];
  // All-set preview uses the same sequential context as the transactional command.
  const preview = structuredClone(d),
    guesses = indices.map((n) => {
      const guesses = reconstruct(preview, item, n, context),
        g = guesses[choices[n] ?? 0];
      if (g)
        Object.assign(preview.draft!.items[item]!.sets[n]!, {
          kg: g.weight,
          reps: g.reps,
          done: 1,
          est: 1,
        });
      return { n, guesses };
    });
  return (
    <Sheet title="Reconstruct forgotten sets" close={close}>
      <p>
        Estimates are marked and excluded from records and future estimates.
      </p>
      <div className="chips">
        {it.sets.map((s, n) => (
          <button
            disabled={!!s.done}
            className={!all && set === n ? '' : 'quiet'}
            key={n}
            onClick={() => {
              setSet(n);
              setAll(false);
              generate(false);
            }}
          >
            Set {n + 1}
          </button>
        ))}
        <button
          className={all ? '' : 'quiet'}
          onClick={() => {
            setAll(true);
            generate(false);
          }}
        >
          All sets
        </button>
      </div>
      {!generated ? (
        <>
          <Field
            label={`Remembered weight (${unitLabel(d, 'kg')})`}
            value={displayValue(d, context.weight, 'kg')}
            numeric
            change={(v) =>
              setContext({ ...context, weight: canonicalValue(d, v, 'kg') })
            }
          />
          <label>
            Effort / RPE
            <select
              aria-label="Effort / RPE"
              value={context.rpe ?? ''}
              onChange={(e) =>
                setContext({
                  ...context,
                  rpe: e.target.value ? Number(e.target.value) : null,
                })
              }
            >
              <option value="">Not sure</option>
              {[6, 7, 8, 9, 10].map((v) => (
                <option key={v}>{v}</option>
              ))}
            </select>
          </label>
          {(['rest', 'energy', 'sleep', 'soreness', 'stress'] as const).map(
            (k) => (
              <label key={k}>
                {k}
                <select
                  value={context[k]}
                  onChange={(e) =>
                    setContext({ ...context, [k]: Number(e.target.value) })
                  }
                >
                  {{
                    rest: ['Short', 'Normal', 'Long'],
                    energy: ['Low', 'Normal', 'High'],
                    sleep: ['Poor', 'Normal', 'Good'],
                    soreness: ['None', 'Mild', 'High'],
                    stress: ['Low', 'Normal', 'High'],
                  }[k].map((v, n) => (
                    <option key={v} value={n}>
                      {v}
                    </option>
                  ))}
                </select>
              </label>
            ),
          )}
          <button onClick={() => generate(true)}>Estimate</button>
        </>
      ) : (
        <>
          {guesses.map(({ n, guesses }) => (
            <section key={n}>
              <h3>Set {n + 1}</h3>
              {!guesses.length ? (
                <p>Not enough weighted history. Enter the set by hand.</p>
              ) : (
                guesses.map((g, k) => (
                  <button
                    key={k}
                    className={`guess ${(choices[n] ?? 0) === k ? 'selected' : 'quiet'}`}
                    aria-pressed={(choices[n] ?? 0) === k}
                    onClick={() => choose({ ...choices, [n]: k })}
                  >
                    {k === 0 ? 'Best estimate · ' : ''}
                    {displayValue(d, g.weight, 'kg')} {unitLabel(d, 'kg')} ×{' '}
                    {g.reps} · {Math.round(g.probability * 100)}%
                  </button>
                ))
              )}
            </section>
          ))}
          <button
            disabled={guesses.some((g) => !g.guesses.length) || !indices.length}
            onClick={() => {
              send({
                kind: 'estimate',
                ...target,
                setIds: indices.map((n) => draftTarget(d, item, n).setId!),
                item,
                sets: indices,
                choices: indices.map((n) => choices[n] ?? 0),
                context,
                now: Date.now(),
              });
              close();
            }}
          >
            Use {all ? 'these estimates' : 'this estimate'}
          </button>
          <button className="quiet" onClick={() => generate(false)}>
            Back
          </button>
          <button className="quiet" onClick={close}>
            None of these
          </button>
        </>
      )}
    </Sheet>
  );
}

function Finish({
  close,
  saved,
}: {
  close: () => void;
  saved: (id: string) => void;
}) {
  const state = useLocal(),
    d = state.snapshot!.data,
    w = d.draft!,
    [targetDraftId] = useState(String(w.id)),
    [duration, setDuration] = useState(String(w.dur ?? '')),
    [time, setTime] = useState(dateInput(num(w.t) || Date.now())),
    [title, setTitle] = useState(String(w.title ?? 'Workout')),
    [notes, setNotes] = useState(String(w.notes ?? '')),
    [difficulty, setDifficulty] = useState(num(w.diff ?? 1)),
    [update, setUpdate] = useState(d.st?.upd !== 0),
    [photo, setPhoto] = useState(String(w.img ?? '')),
    [allow, setAllow] = useState(false);
  const incomplete = w.items.some((i) => i.sets.some((s) => !s.done)),
    valid =
      /^\d+(\.\d+)?$/.test(duration) &&
      Number.isFinite(Number(duration)) &&
      Number(duration) > 0 &&
      Number.isFinite(+new Date(time)) &&
      w.items.some((i) => i.sets.some((s) => s.done));
  return (
    <Sheet title="Finish workout" close={close}>
      <Field
        label="Workout title"
        value={title}
        change={(v) => {
          setTitle(v);
          send({
            kind: 'draftMeta',
            draftId: targetDraftId,
            key: 'title',
            value: v,
          });
        }}
      />
      <label>
        Workout date and time
        <input
          type="datetime-local"
          value={time}
          onChange={(e) => {
            setTime(e.target.value);
            const t = +new Date(e.target.value);
            if (Number.isFinite(t))
              send({
                kind: 'draftMeta',
                draftId: targetDraftId,
                key: 't',
                value: t,
              });
          }}
        />
      </label>
      <div className={`card ${!valid ? 'error' : ''}`}>
        <Field
          label="Duration (minutes, required)"
          value={duration}
          change={(v) => {
            setDuration(v);
            send({
              kind: 'draftMeta',
              draftId: targetDraftId,
              key: 'dur',
              value: v,
            });
          }}
          numeric
        />
        {!duration && <p>Set your workout duration to save.</p>}
      </div>
      <Field
        label="Workout notes"
        value={notes}
        change={(v) => {
          setNotes(v);
          send({
            kind: 'draftMeta',
            draftId: targetDraftId,
            key: 'notes',
            value: v,
          });
        }}
      />
      <label>
        Difficulty
        <select
          aria-label="Difficulty"
          value={difficulty}
          onChange={(e) => {
            setDifficulty(Number(e.target.value));
            send({
              kind: 'draftMeta',
              draftId: targetDraftId,
              key: 'diff',
              value: Number(e.target.value),
            });
          }}
        >
          {['Easy', 'Moderate', 'Hard', 'Max'].map((v, n) => (
            <option value={n} key={n}>
              {v}
            </option>
          ))}
        </select>
      </label>
      <label className="check-label">
        <input
          type="checkbox"
          checked={update}
          onChange={(e) => setUpdate(e.target.checked)}
        />
        Update routine values (existing weights and reps only)
      </label>
      <PhotoInput
        label="Workout photo (optional)"
        change={(v, source) => {
          send({
            kind: 'draftMeta',
            draftId: targetDraftId,
            key: 'originalImg',
            value: source,
          });
          setPhoto(v);
          send({
            kind: 'draftMeta',
            draftId: targetDraftId,
            key: 'img',
            value: v,
          });
        }}
      />
      {photo && <img className="photo" src={photo} alt="Workout" />}
      {incomplete && (
        <div className="card">
          <h3>Not all sets are completed</h3>
          <label className="check-label">
            <input
              type="checkbox"
              checked={allow}
              onChange={(e) => setAllow(e.target.checked)}
            />
            Continue with incomplete sets
          </label>
        </div>
      )}
      <button
        disabled={
          !valid || (incomplete && !allow) || !!state.queued || state.fatal
        }
        onClick={() => {
          send({
            kind: 'finish',
            draftId: targetDraftId,
            options: {
              duration,
              time: +new Date(time),
              title,
              notes,
              difficulty,
              update,
              allowIncomplete: allow,
              ...(photo ? { photo } : {}),
            },
            now: Date.now(),
          });
          saved(String(w.id));
          close();
        }}
      >
        Save workout
      </button>
    </Sheet>
  );
}

export async function shareCard(title: string, lines: string[]) {
  return shareImages(await cardFiles(title, lines), title);
}
export function WorkoutCards({ id, close }: { id: string; close: () => void }) {
  const d = useLocal((s) => s.snapshot!.data),
    w = d.wk.find((w) => w.id === id),
    [error, setError] = useState(''),
    [busy, setBusy] = useState(false);
  if (!w) return null;
  const s = summary(d, w),
    first = weekStart(w.t, num(d.st?.fd)),
    firstOfWeek = ![...d.wk].some(
      (x) =>
        x.id !== w.id && x.t < w.t && weekStart(x.t, num(d.st?.fd)) === first,
    ),
    prs = w.items.flatMap((i) =>
      i.sets
        .filter((s) => s.pr)
        .map(
          (s) =>
            `${exercise(d, i.ex)?.n ?? 'Removed exercise'} · ${displayValue(d, s.kg, 'kg')} ${unitLabel(d, 'kg')} × ${s.reps}`,
        ),
    );
  const cards = [
    ...(firstOfWeek
      ? [
          {
            title: `${streak(d, w.t)} week streak`,
            lines: ['Keep it going. Log after your sets.'],
          },
        ]
      : []),
    {
      title: String(w.title ?? 'Workout'),
      lines: [
        `${s.calories} kcal · ${displayValue(d, s.volume, 'kg')} ${unitLabel(d, 'kg')} lifted`,
        `${w.dur} minutes · ${s.sets} sets`,
        s.muscles.join(' · '),
      ],
    },
    {
      title: 'Weight lifted',
      lines: [
        `${displayValue(d, s.volume, 'kg')} ${unitLabel(d, 'kg')}`,
        `That’s like lifting ${s.volume <= 100 ? 'a large dog' : s.volume <= 300 ? 'a grand piano' : s.volume <= 600 ? 'a horse' : s.volume <= 1200 ? 'a small car' : s.volume <= 3000 ? 'a rhino' : 'an elephant'}!`,
      ],
    },
    ...(prs.length ? [{ title: 'Personal records', lines: prs }] : []),
  ];
  return (
    <Sheet title="Well done" close={close}>
      <p>
        Share only the cards you choose. Images include the visible workout
        details. Nothing is shared automatically.
      </p>
      <div className="workout-cards">
        {cards.map((card, n) => (
          <article className="card" key={n}>
            {card.title === 'Personal records' && <Medal size={36} />}
            <h2>{card.title}</h2>
            {card.lines.map((line, n) => (
              <p key={n}>{line}</p>
            ))}
            <button
              disabled={busy}
              onClick={async () => {
                setBusy(true);
                setError('');
                try {
                  setError(await shareCard(card.title, card.lines));
                } catch (e) {
                  setError(
                    e instanceof Error
                      ? e.message
                      : 'Sharing failed. Try Download PNG.',
                  );
                } finally {
                  setBusy(false);
                }
              }}
            >
              <Share2 size={18} aria-hidden="true" />
              Share this card
            </button>
            <button
              className="quiet"
              disabled={busy}
              onClick={async () => {
                setBusy(true);
                try {
                  (await cardFiles(card.title, card.lines)).forEach(
                    downloadImage,
                  );
                  setError('PNG downloaded.');
                } catch {
                  setError('Image download failed. Try again.');
                } finally {
                  setBusy(false);
                }
              }}
            >
              Download PNG
            </button>
          </article>
        ))}
      </div>
      <a
        className="whatsapp"
        href={`https://wa.me/?text=${encodeURIComponent(`I logged a workout with Replift. ${s.sets} sets · ${w.dur} minutes.`)}`}
        target="_blank"
        rel="noreferrer"
      >
        Share with friends on WhatsApp
      </a>
      {error && <p role="status">{error}</p>}
      {d.wk.length === 4 && !d.st?.ds && (
        <section className="card" aria-label="Support Replift">
          <h2>Help Replift stay free</h2>
          <p>Replift is free and open source. Donations are optional.</p>
          {optionalLinks.find((x) => x.label === 'Donate')?.url ? (
            <a
              href={optionalLinks.find((x) => x.label === 'Donate')!.url!}
              target="_blank"
              rel="noreferrer"
            >
              Donate
            </a>
          ) : (
            <p>Donation URL not supplied.</p>
          )}
        </section>
      )}
      <button
        onClick={() => {
          if (d.wk.length === 4 && !d.st?.ds)
            send({ kind: 'preference', group: 'st', key: 'ds', value: 1 });
          close();
        }}
      >
        Continue
      </button>
    </Sheet>
  );
}

export default function Workout() {
  const state = useLocal(),
    d = state.snapshot?.data,
    [picker, setPicker] = useState(false),
    [pickerTarget, setPickerTarget] = useState<ReturnType<typeof draftTarget>>(
      {},
    ),
    [replace, setReplace] = useState<number | undefined>(),
    [finish, setFinish] = useState(false),
    [confirm, setConfirm] = useState<Action | null>(null),
    [menu, setMenu] = useState<
      ({ item: number; set: number } & ReturnType<typeof draftTarget>) | null
    >(null),
    [estimate, setEstimate] = useState<number | null>(null),
    [cards, setCards] = useState<string | null>(null),
    [info, setInfo] = useState<number | null>(null),
    [walk, setWalk] = useState(0);
  useEffect(() => {
    if (d?.draft && !d.wt?.done) setWalk(1);
  }, [d?.draft?.id, d?.wt?.done]);
  if (!d) return <p>Open local storage to start a workout.</p>;
  const draft = d.draft,
    disabled = state.fatal || !!state.queued;
  const setAction = (
    item: number,
    set: number,
    op: Extract<Action, { kind: 'set' }>['op'],
    value?: string,
    target?: ReturnType<typeof draftTarget>,
  ) => {
    if (op === 'tick' && !d.draft?.items[item]?.sets[set]?.done)
      playCheck(!!d.st?.snd);
    send({
      kind: 'set',
      item,
      set,
      op,
      id: uid(),
      ...(value === undefined ? {} : { value }),
      ...target,
    });
  };
  const start = (routine?: string) => {
    send({ kind: 'start', id: uid(), ...(routine ? { routine } : {}) });
    if (!d.wt?.done) setWalk(1);
  };
  const preview = structuredClone(d);
  if (draft) {
    const id = String(draft.id ?? 'preview');
    preview.wk = preview.wk.filter((w) => w.id !== id);
    preview.wk.push({
      ...structuredClone(draft),
      id,
      t: num(draft.t) || Date.now(),
      items: structuredClone(draft.items),
    });
    recomputeRecords(preview);
  }
  const previewSets = preview.wk.find(
    (w) => w.id === String(draft?.id ?? 'preview'),
  )?.items;
  return (
    <section aria-label="Workout logger">
      {draft ? (
        <>
          <div className="row">
            <h2>{String(draft.title ?? 'Workout')}</h2>
            <button onClick={() => setFinish(true)} disabled={disabled}>
              Finish workout
            </button>
          </div>
          {draft.items.map((it, i) => {
            const e = exercise(d, it.ex),
              labels = fieldLabels(e?.t ?? 'kr');
            return (
              <article className="card" key={`${i}/${it.ex}`}>
                <div className="row">
                  <h2>{e?.n ?? 'Removed exercise'}</h2>
                  <button
                    aria-label={`Previous and Max ${e?.n ?? 'exercise'}`}
                    className="quiet"
                    onClick={() => setInfo(i)}
                  >
                    Previous / Max
                  </button>
                </div>
                {it.sets.map((s, n) => (
                  <div
                    className={`log-set ${s.done ? 'completed' : ''}`}
                    key={s.id ?? n}
                  >
                    <span>
                      {n + 1}
                      {d.st?.pr !== 0 && previewSets?.[i]?.sets[n]?.pr ? (
                        <Medal size={16} aria-label="Personal record" />
                      ) : null}
                      {s.est ? ' · estimated' : ''}
                      {s.k
                        ? ` · ${{ w: 'warmup', d: 'drop', f: 'failure' }[String(s.k)] ?? s.k}`
                        : ''}
                      {s.rpe ? ` · RPE ${s.rpe}` : ''}
                    </span>
                    <div className="log-fields">
                      {(['kg', 'reps'] as const).map((field, j) =>
                        labels[j] !== null ? (
                          <SavedField
                            key={field}
                            label={`Exercise ${i + 1} set ${n + 1} ${unitLabel(d, labels[j]!)}`}
                            numeric
                            fieldKey={`workout/${i}/${n}/${field}`}
                            value={displayValue(d, s[field], labels[j]!)}
                            action={(v) => ({
                              kind: 'setField',
                              item: i,
                              set: n,
                              field,
                              value: canonicalValue(d, v, labels[j]!),
                            })}
                          />
                        ) : (
                          <span key={field} />
                        ),
                      )}
                      <button
                        className="icon-button quiet"
                        aria-label={`Set ${n + 1} menu`}
                        onClick={() =>
                          setMenu({ item: i, set: n, ...draftTarget(d, i, n) })
                        }
                      >
                        <MoreHorizontal size={19} />
                      </button>
                      <button
                        className="check"
                        aria-label={`Complete exercise ${i + 1} set ${n + 1}`}
                        aria-pressed={!!s.done}
                        disabled={
                          disabled || (!s.done && !validSet(s, e?.t ?? 'kr'))
                        }
                        onClick={() => setAction(i, n, 'tick')}
                      >
                        <Check size={20} />
                      </button>
                    </div>
                  </div>
                ))}
                <div className="sync-actions">
                  <button
                    disabled={disabled}
                    onClick={() => setAction(i, 0, 'add')}
                  >
                    <Plus size={16} />
                    Add workout set
                  </button>
                  <button
                    className="quiet"
                    onClick={() => setEstimate(i)}
                    disabled={it.sets.every((s) => s.done)}
                  >
                    Estimate a set
                  </button>
                  <button
                    className="quiet"
                    onClick={() => {
                      setReplace(i);
                      setPickerTarget(draftTarget(d, i));
                      setPicker(true);
                    }}
                  >
                    Replace exercise
                  </button>
                  <button
                    className="quiet"
                    onClick={() =>
                      setConfirm({
                        kind: 'workoutExercise',
                        ...draftTarget(d, i),
                        id: it.ex,
                        remove: i,
                        ids: [],
                      })
                    }
                  >
                    Remove exercise
                  </button>
                </div>
                <SavedField
                  label={`Pinned note ${e?.n ?? 'exercise'}`}
                  value={d.pin?.[it.ex] ?? ''}
                  fieldKey={`pin/${it.ex}`}
                  action={(value) => ({ kind: 'note', exercise: it.ex, value })}
                />
                <button
                  className="quiet"
                  onClick={() => {
                    if (it.sets.some((s) => !s.done)) {
                      setConfirm(null);
                      window.alert(
                        'Not all sets are completed. You can continue editing or finish with the incomplete-set warning.',
                      );
                    }
                  }}
                >
                  {it.sets.every((s) => s.done) ? 'Done' : 'Continue'}
                </button>
              </article>
            );
          })}
          <button
            disabled={disabled}
            onClick={() => {
              setReplace(undefined);
              setPickerTarget(draftTarget(d));
              setPicker(true);
            }}
          >
            <Plus size={18} />
            Add workout exercise
          </button>
          <button
            className="danger"
            onClick={() => setConfirm({ kind: 'discard', ...draftTarget(d) })}
          >
            Discard workout draft
          </button>
        </>
      ) : (
        <>
          <button disabled={disabled} onClick={() => start()}>
            Start empty workout
          </button>
          {d.prog.flatMap((p) =>
            p.routines.map((r) => (
              <article className="card" key={r.id}>
                <h2>{r.n}</h2>
                <p>
                  {p.n} · {r.ex.length} exercises
                </p>
                <button
                  disabled={disabled}
                  aria-label={`Start ${r.n}`}
                  onClick={() => start(r.id)}
                >
                  Start routine
                </button>
              </article>
            )),
          )}
        </>
      )}
      {picker && (
        <ExercisePicker
          close={() => setPicker(false)}
          choose={(id) =>
            send({
              kind: 'workoutExercise',
              ...pickerTarget,
              id,
              ids: Array.from(
                { length: Math.max(20, previous(d, id, d.draft?.r).length) },
                uid,
              ),
              ...(replace === undefined ? {} : { replace }),
            })
          }
        />
      )}
      {finish && draft && (
        <Finish close={() => setFinish(false)} saved={setCards} />
      )}{' '}
      {cards && !draft && (
        <WorkoutCards
          id={cards}
          close={() => {
            setCards(null);
            if (d.st?.dq)
              send({ kind: 'preference', group: 'st', key: 'dq', value: 0 });
          }}
        />
      )}
      {!cards && d.st?.dq === 1 && (
        <Sheet
          title="Help Replift stay free"
          close={() =>
            send({ kind: 'preference', group: 'st', key: 'dq', value: 0 })
          }
        >
          <p>
            You’ve logged four workouts. Replift is free, open source and
            ad-free.
          </p>
          <p>
            Donation link coming soon. You can star the project or report bugs
            on GitHub.
          </p>
          <a
            href="https://github.com/byshriv/Replift"
            target="_blank"
            rel="noreferrer"
          >
            Replift on GitHub
          </a>
        </Sheet>
      )}
      {confirm && (
        <Confirm
          title="Confirm workout change"
          description={
            confirm.kind === 'discard'
              ? 'Discard this draft? A local recovery point will be retained.'
              : 'Remove this exercise from this draft? History is preserved.'
          }
          close={() => setConfirm(null)}
          confirm={() => send(confirm)}
        />
      )}{' '}
      {menu && draft && (
        <Sheet title="Set options" close={() => setMenu(null)}>
          <div className="sync-actions">
            {(['', 'w', 'd', 'f'] as const).map((k) => (
              <button
                key={k}
                onClick={() => {
                  setAction(menu.item, menu.set, 'kind', k, menu);
                  setMenu(null);
                }}
              >
                {k === ''
                  ? 'Normal'
                  : { w: 'Warmup', d: 'Drop', f: 'Failure' }[k]}
              </button>
            ))}
          </div>
          <label>
            RPE
            <select
              aria-label="RPE"
              value={String(draft.items[menu.item]?.sets[menu.set]?.rpe ?? '')}
              onChange={(e) =>
                setAction(menu.item, menu.set, 'rpe', e.target.value, menu)
              }
            >
              <option value="">Clear RPE</option>
              {Array.from({ length: 9 }, (_, n) => 6 + n * 0.5).map((n) => (
                <option key={n}>{n}</option>
              ))}
            </select>
          </label>
          <button
            onClick={() => {
              setAction(menu.item, menu.set, 'duplicate', undefined, menu);
              setMenu(null);
            }}
          >
            Duplicate set
          </button>
          <button
            className="danger"
            onClick={() => {
              setAction(menu.item, menu.set, 'delete', undefined, menu);
              setMenu(null);
            }}
          >
            Delete set
          </button>
        </Sheet>
      )}
      {estimate !== null && draft && (
        <Estimates item={estimate} close={() => setEstimate(null)} />
      )}{' '}
      {info !== null && draft && (
        <Sheet title="Previous and Max" close={() => setInfo(null)}>
          <h3>Previous</h3>
          {previous(d, draft.items[info]!.ex, draft.r).map((s, n) => (
            <p key={n}>
              Set {n + 1}: {displayValue(d, s.kg, 'kg')} × {s.reps}
            </p>
          ))}
          <h3>Max</h3>
          {(() => {
            const copy = structuredClone(d),
              b = recomputeRecords(copy).get(draft.items[info]!.ex);
            return (
              <p>
                {b?.seen
                  ? `${displayValue(d, b.w, 'kg')} ${unitLabel(d, 'kg')} · estimated 1RM ${displayValue(d, b.e, 'kg')}`
                  : 'No eligible records yet.'}
              </p>
            );
          })()}
        </Sheet>
      )}
      {walk > 0 && (
        <Sheet
          title="Your first workout"
          close={() => {
            send({ kind: 'preference', group: 'wt', key: 'done', value: 1 });
            setWalk(0);
          }}
        >
          <p>
            {
              [
                'Add exercises from the library or start from a routine.',
                'Log after your sets. Fill the fields, then check each completed set.',
                'Use the set menu for warmup, drop, failure, RPE, duplicate or delete.',
                'Forgot a set? Reconstruct it from weighted history. Estimates never earn records.',
                'Finish with duration, notes and an optional photo. Your draft saves as you edit.',
              ][walk - 1]
            }
          </p>
          <button
            onClick={() => {
              if (walk < 5) setWalk(walk + 1);
              else {
                send({
                  kind: 'preference',
                  group: 'wt',
                  key: 'done',
                  value: 1,
                });
                setWalk(0);
              }
            }}
          >
            {walk < 5 ? 'Next' : 'Let’s log'}
          </button>
        </Sheet>
      )}
    </section>
  );
}

export function History() {
  const state = useLocal(),
    d = state.snapshot!.data,
    [selected, select] = useState<WorkoutData | null>(null),
    [remove, setRemove] = useState(false),
    [cards, setCards] = useState(false),
    [filter, setFilter] = useState('');
  return (
    <section>
      <h2>Workout history</h2>
      <Field label="Filter history by date" value={filter} change={setFilter} />
      {[...d.wk]
        .sort((a, b) => b.t - a.t)
        .filter((w) => !filter || dateInput(w.t).startsWith(filter))
        .map((w) => (
          <button className="history-row" key={w.id} onClick={() => select(w)}>
            <span>{String(w.title ?? 'Workout')}</span>
            <span>
              {new Date(w.t).toLocaleDateString()} · {String(w.dur ?? 0)} min
            </span>
          </button>
        ))}
      {!d.wk.length && <p>Your completed workouts appear here.</p>}
      {selected && (
        <Sheet title="Workout details" close={() => select(null)}>
          <h2>{String(selected.title ?? 'Workout')}</h2>
          <p>
            {new Date(selected.t).toLocaleString()} · {String(selected.dur)} min
          </p>
          {selected.items.map((it, n) => (
            <article key={n}>
              <h3>{exercise(d, it.ex)?.n ?? 'Removed exercise'}</h3>
              {it.sets.map((s, n) => (
                <p key={n}>
                  Set {n + 1} · {displayValue(d, s.kg, 'kg')} × {s.reps}{' '}
                  {s.done ? '✓' : 'incomplete'} {s.est ? 'estimated' : ''}{' '}
                  {s.pr ? 'record' : ''}
                </p>
              ))}
            </article>
          ))}
          <p>{String(selected.notes ?? '')}</p>
          {typeof selected.img === 'string' && (
            <img className="photo" src={selected.img} alt="Workout" />
          )}
          <button
            disabled={!!d.draft || !!state.queued}
            onClick={() => {
              send({ kind: 'editWorkout', id: selected.id });
              select(null);
              useNavigation.getState().navigate('Workout');
            }}
          >
            <ArrowLeft size={16} />
            Edit workout
          </button>
          <button onClick={() => setCards(true)}>View and share cards</button>
          <button className="danger" onClick={() => setRemove(true)}>
            Delete workout
          </button>
          {remove && (
            <Confirm
              title="Delete workout"
              description="Remove this workout from history and recompute records? A recovery point is kept."
              close={() => setRemove(false)}
              confirm={() => {
                send({ kind: 'deleteWorkout', id: selected.id });
                select(null);
              }}
            />
          )}
          {cards && (
            <WorkoutCards id={selected.id} close={() => setCards(false)} />
          )}
        </Sheet>
      )}
    </section>
  );
}
