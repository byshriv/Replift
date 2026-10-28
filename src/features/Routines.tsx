import { useEffect, useId, useRef, useState } from 'react';
import { ArrowLeft, Plus, Trash2, Undo2, X } from 'lucide-react';
import { useLocal } from '../state/local';
import { fieldLabels, validValue } from '../domain/local';
import type { Command, LocalData, Routine, RoutineSet } from '../domain/local';

const days = [
  'Sunday',
  'Monday',
  'Tuesday',
  'Wednesday',
  'Thursday',
  'Friday',
  'Saturday',
];
function Field({
  label,
  value,
  edit,
  fieldKey,
  numeric = false,
  integer = false,
}: {
  label: string;
  value: unknown;
  edit: (value: string) => Command;
  fieldKey: string;
  numeric?: boolean;
  integer?: boolean;
}) {
  const state = useLocal();
  const hint = useId();
  const text = state.drafts[fieldKey] ?? String(value ?? '');
  const invalid = numeric && !validValue(text, integer);
  return (
    <label className="field">
      {label}
      <input
        value={text}
        aria-label={label}
        aria-describedby={invalid ? hint : undefined}
        inputMode={numeric ? (integer ? 'numeric' : 'decimal') : 'text'}
        aria-invalid={invalid || undefined}
        disabled={state.fatal}
        onFocus={(event) => event.target.select()}
        onChange={(event) =>
          state.edit(edit(event.target.value), fieldKey, event.target.value)
        }
      />
      {invalid && <small id={hint}>Incomplete value · draft</small>}
    </label>
  );
}

function Picker({
  routine,
  data,
  close,
}: {
  routine: Routine;
  data: LocalData;
  close: () => void;
}) {
  const ref = useRef<HTMLDialogElement>(null);
  const [query, search] = useState('');
  const { edit, queued, fatal } = useLocal();
  useEffect(() => {
    ref.current?.showModal();
  }, []);
  const results = data.ex.filter((e) =>
    e.n.toLowerCase().includes(query.trim().toLowerCase()),
  );
  return (
    <dialog ref={ref} onClose={close} aria-labelledby="picker-title">
      <div className="row">
        <h2 id="picker-title">Choose exercises</h2>
        <button
          aria-label="Close exercise picker"
          onClick={() => ref.current?.close()}
        >
          <X size={18} />
        </button>
      </div>
      <p>Each selection saves immediately. Done closes this picker.</p>
      <label>
        Find exercise
        <input
          type="search"
          value={query}
          onChange={(event) => search(event.target.value)}
        />
      </label>
      <ul className="picker-list">
        {results.map((e) => (
          <li key={e.id}>
            <span>{e.n}</span>
            <button
              disabled={!!queued || fatal || routine.ex.includes(e.id)}
              aria-label={`Add ${e.n}`}
              onClick={() =>
                edit({
                  type: 'select',
                  routine: routine.id,
                  exercise: e.id,
                  ids: Array.from({ length: defaultSets(data) }, () =>
                    crypto.randomUUID(),
                  ),
                })
              }
            >
              {routine.ex.includes(e.id) ? 'Added' : <Plus size={18} />}
            </button>
          </li>
        ))}
      </ul>
      {!results.length && <p>No exercises match.</p>}
      <button className="picker-done" onClick={() => ref.current?.close()}>
        Done
      </button>
    </dialog>
  );
}
function defaultSets(data: LocalData) {
  const n = data.st?.sets;
  return typeof n === 'number' && Number.isInteger(n) && n >= 1 && n <= 20
    ? n
    : 3;
}
function SetRow({
  set,
  routine,
  exercise,
  index,
  type,
}: {
  set: RoutineSet;
  routine: string;
  exercise: string;
  index: number;
  type: string;
}) {
  const { edit, queued, fatal } = useLocal();
  const [first, second] = fieldLabels(type);
  const id = set.id!;
  return (
    <div className="set-row">
      <span>{index + 1}</span>
      {(['kg', 'reps'] as const).map((field, n) => {
        const label = n === 0 ? first : second;
        if (label === null) return <span key={field} />;
        return (
          <Field
            key={field}
            label={`Set ${index + 1} ${label}`}
            value={set[field]}
            numeric
            integer={label === 'reps'}
            fieldKey={`${routine}/${exercise}/${id}/${field}`}
            edit={(value) => ({
              type: 'field',
              routine,
              exercise,
              set: id,
              field,
              value,
            })}
          />
        );
      })}
      <button
        className="icon-button"
        aria-label={`Remove set ${index + 1}`}
        disabled={!!queued || fatal}
        onClick={() => edit({ type: 'removeSet', routine, exercise, set: id })}
      >
        <Trash2 size={18} />
      </button>
    </div>
  );
}

export default function Routines() {
  const { snapshot, edit, queued, fatal, undos } = useLocal();
  const [selected, select] = useState<string | null>(null);
  const [picker, showPicker] = useState(false);
  if (!snapshot) return <p>Open local storage to edit routines.</p>;
  const data = snapshot.data;
  const program = data.prog.find((p) =>
    p.routines.some((r) => r.id === selected),
  );
  const routine = program?.routines.find((r) => r.id === selected);
  return (
    <section aria-label="Programs and routines">
      <p>
        Names, weekdays and set values save as you edit. Weights use kg and
        distances use km.
      </p>
      {routine && program ? (
        <>
          <button
            onClick={() => {
              select(null);
              showPicker(false);
            }}
          >
            <ArrowLeft size={18} />
            Back to programs
          </button>
          <div className="card">
            <Field
              label="Routine name"
              value={routine.n}
              fieldKey={`routine/${routine.id}/name`}
              edit={(value) => ({
                type: 'name',
                program: program.id,
                routine: routine.id,
                value,
              })}
            />
            <label>
              Weekday
              <select
                value={routine.day}
                disabled={fatal || !!queued}
                onChange={(event) =>
                  edit({
                    type: 'day',
                    routine: routine.id,
                    value: Number(event.target.value),
                  })
                }
              >
                {days.map((day, i) => (
                  <option key={day} value={i}>
                    {day}
                  </option>
                ))}
              </select>
            </label>
          </div>
          {routine.ex.map((id) => {
            const exercise = data.ex.find((e) => e.id === id);
            const sets = routine.vals?.[id] ?? [];
            return (
              <article
                className="card"
                key={id}
                aria-label={exercise?.n ?? 'Unavailable exercise'}
              >
                <div className="row">
                  <h2>
                    {exercise?.n ??
                      'Unavailable exercise (original reference retained)'}
                  </h2>
                  <button
                    aria-label={`Remove ${exercise?.n ?? id}`}
                    className="icon-button"
                    disabled={fatal || !!queued}
                    onClick={() =>
                      edit({
                        type: 'removeExercise',
                        routine: routine.id,
                        exercise: id,
                      })
                    }
                  >
                    <Trash2 size={18} />
                  </button>
                </div>
                {sets.map((set, index) => (
                  <SetRow
                    key={set.id}
                    set={set}
                    index={index}
                    routine={routine.id}
                    exercise={id}
                    type={exercise?.t ?? 'kr'}
                  />
                ))}
                <button
                  disabled={fatal || !!queued}
                  onClick={() =>
                    edit({
                      type: 'addSet',
                      routine: routine.id,
                      exercise: id,
                      id: crypto.randomUUID(),
                    })
                  }
                >
                  <Plus size={18} />
                  Add set
                </button>
              </article>
            );
          })}
          <button disabled={fatal} onClick={() => showPicker(true)}>
            <Plus size={18} />
            Choose exercises
          </button>
          {picker && (
            <Picker
              routine={routine}
              data={data}
              close={() => showPicker(false)}
            />
          )}
        </>
      ) : (
        <>
          {data.prog.map((p) => (
            <section className="card" key={p.id}>
              <Field
                label="Program name"
                value={p.n}
                fieldKey={`program/${p.id}/name`}
                edit={(value) => ({ type: 'name', program: p.id, value })}
              />
              <div className="routine-list">
                {p.routines.map((r) => (
                  <button key={r.id} onClick={() => select(r.id)}>
                    {r.n || 'Untitled routine'} · {days[r.day]}
                  </button>
                ))}
              </div>
              <button
                disabled={fatal || !!queued}
                onClick={() => {
                  const id = crypto.randomUUID();
                  edit({ type: 'routine', program: p.id, id });
                  select(id);
                }}
              >
                <Plus size={18} />
                Add routine
              </button>
            </section>
          ))}
          <button
            disabled={fatal || !!queued}
            onClick={() => edit({ type: 'program', id: crypto.randomUUID() })}
          >
            <Plus size={18} />
            New program
          </button>
        </>
      )}
      {!!undos.length && (
        <section className="card" aria-label="Removed items">
          <h2>Removal Undo</h2>
          <p>Removed values stay recoverable after closing or reloading.</p>
          {[...undos]
            .sort((a, b) => b.revision - a.revision)
            .map((entry) => (
              <div className="row" key={entry.id}>
                <span>
                  {data.ex.find((e) => e.id === entry.removed.exercise)?.n ??
                    'Exercise'}
                  {entry.removed.set ? ' · set' : ''}
                </span>
                <button
                  disabled={fatal || !!queued}
                  onClick={() => edit({ type: 'undo', id: entry.id })}
                >
                  <Undo2 size={18} />
                  Undo removal
                </button>
              </div>
            ))}
        </section>
      )}
    </section>
  );
}
