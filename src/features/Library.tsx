import { useState } from 'react';
import { Star, Plus, Trash2, Dumbbell } from 'lucide-react';
import { catalogue } from '../data/catalogue';
import { useLocal } from '../state/local';
import { useNavigation } from '../state/navigation';
import { loggingType } from '../domain/exercise';
import { muscles } from '../domain/metrics';
import { send, Sheet, Field, PhotoInput, uid, Confirm } from './ui';
import type { LocalData } from '../domain/local';
export const emptyFilters = {
  muscle: '',
  equipment: '',
  favourites: false,
  mine: false,
};
export function pickerMatch(
  e: LocalData['ex'][number],
  d: LocalData | undefined,
  f: typeof emptyFilters,
) {
  return (
    (!f.muscle || e.m === f.muscle || String(e.s ?? '').includes(f.muscle)) &&
    (!f.equipment || e.e === f.equipment) &&
    (!f.favourites || !!d?.fav?.includes(e.id)) &&
    (!f.mine || (d?.have ?? equipment).includes(String(e.e)))
  );
}
export function PickerFilters({
  filters,
  change,
}: {
  filters: typeof emptyFilters;
  change: (f: typeof emptyFilters) => void;
}) {
  return (
    <>
      <div className="filter-grid">
        <label>
          Muscle
          <select
            aria-label="Picker muscle"
            value={filters.muscle}
            onChange={(e) => change({ ...filters, muscle: e.target.value })}
          >
            <option value="">All muscles</option>
            {[...muscles, 'Neck', 'Cardio'].map((m) => (
              <option key={m}>{m}</option>
            ))}
          </select>
        </label>
        <label>
          Equipment
          <select
            aria-label="Picker equipment"
            value={filters.equipment}
            onChange={(e) => change({ ...filters, equipment: e.target.value })}
          >
            <option value="">All equipment</option>
            {equipment.map((e) => (
              <option key={e}>{e}</option>
            ))}
          </select>
        </label>
      </div>
      <label className="check-label">
        <input
          type="checkbox"
          checked={filters.favourites}
          onChange={(e) => change({ ...filters, favourites: e.target.checked })}
        />
        Picker favourites only
      </label>
      <label className="check-label">
        <input
          type="checkbox"
          checked={filters.mine}
          onChange={(e) => change({ ...filters, mine: e.target.checked })}
        />
        Picker my equipment only
      </label>
      <button className="quiet" onClick={() => change({ ...emptyFilters })}>
        Clear picker filters
      </button>
    </>
  );
}
export const equipment = [
  'Barbell',
  'Dumbbell',
  'Bodyweight',
  'Kettlebell',
  'EZ bar',
  'Trap bar',
  'Cable',
  'Machine',
  'Smith machine',
  'Weighted',
  'Resistance band',
  'Suspension',
  'Cardio machine',
  'Outdoors',
  'Other',
];
export function ExercisePicker({
  choose,
  close,
}: {
  choose: (id: string) => void;
  close: () => void;
}) {
  const d = useLocal((s) => s.snapshot?.data);
  const [q, query] = useState('');
  const [filters, setFilters] = useState({ ...emptyFilters });
  return (
    <Sheet title="Add workout exercise" close={close}>
      <Field label="Find workout exercise" value={q} change={query} />
      <PickerFilters filters={filters} change={setFilters} />
      <ul className="picker-list">
        {d?.ex
          .filter(
            (e) =>
              e.n.toLowerCase().includes(q.toLowerCase()) &&
              pickerMatch(e, d, filters),
          )
          .map((e) => (
            <li key={e.id}>
              <span>{e.n}</span>
              <button
                aria-label={`Log ${e.n}`}
                onClick={() => {
                  choose(e.id);
                  close();
                }}
              >
                <Plus size={18} />
              </button>
            </li>
          ))}
      </ul>
    </Sheet>
  );
}
export default function Library() {
  const { snapshot, queued, fatal } = useLocal(),
    { query, search } = useNavigation();
  const [muscle, setMuscle] = useState(''),
    [equip, setEquip] = useState(''),
    [only, setOnly] = useState('all'),
    [selected, select] = useState<string | null>(null),
    [name, setName] = useState(''),
    [m, setM] = useState('Chest'),
    [e, setE] = useState('Other'),
    [t, setT] = useState('kr'),
    [img, setImg] = useState(''),
    [original, setOriginal] = useState(''),
    [remove, setRemove] = useState(false);
  const d = snapshot?.data,
    all =
      d?.ex ??
      catalogue.map((e) => ({
        id: e.id,
        n: e.name,
        m: e.muscle,
        e: e.equipment,
        t: e.loggingType,
        img: '',
      }));
  const results = all.filter(
    (e) =>
      e.n.toLowerCase().includes(query.toLowerCase()) &&
      (!muscle ||
        e.m === muscle ||
        String('s' in e ? e.s : '').includes(muscle)) &&
      (!equip || e.e === equip) &&
      (only !== 'favourites' || d?.fav?.includes(e.id)) &&
      (only !== 'mine' || (d?.have ?? equipment).includes(String(e.e))) &&
      (only !== 'custom' || !catalogue.some((c) => c.id === e.id)),
  );
  const bundled = catalogue.some((e) => e.id === selected);
  const open = (id: string) => {
    const x = all.find((e) => e.id === id);
    select(id);
    setName(x?.n ?? '');
    setM(String(x?.m ?? 'Chest'));
    setE(String(x?.e ?? 'Other'));
    setT(x?.t ?? 'kr');
    setImg(String(x?.img ?? ''));
    setOriginal(String(x && 'originalImg' in x ? (x.originalImg ?? '') : ''));
  };
  return (
    <section aria-label="Exercise library">
      <button disabled={!d || fatal} onClick={() => open(uid())}>
        <Plus size={18} />
        New exercise
      </button>
      <Field label="Search exercises" value={query} change={search} />
      <div className="filter-grid">
        <label>
          Muscle
          <select
            aria-label="Muscle"
            value={muscle}
            onChange={(e) => setMuscle(e.target.value)}
          >
            <option value="">All muscles</option>
            {[...muscles, 'Neck', 'Cardio'].map((m) => (
              <option key={m}>{m}</option>
            ))}
          </select>
        </label>
        <label>
          Equipment
          <select
            aria-label="Equipment"
            value={equip}
            onChange={(e) => setEquip(e.target.value)}
          >
            <option value="">All equipment</option>
            {equipment.map((e) => (
              <option key={e}>{e}</option>
            ))}
          </select>
        </label>
        <label>
          Show
          <select
            aria-label="Show"
            value={only}
            onChange={(e) => setOnly(e.target.value)}
          >
            <option value="all">All exercises</option>
            <option value="favourites">Favourites</option>
            <option value="mine">My equipment</option>
            <option value="custom">Custom exercises</option>
          </select>
        </label>
      </div>
      <button
        className="quiet"
        onClick={() => {
          search('');
          setMuscle('');
          setEquip('');
          setOnly('all');
        }}
      >
        Clear filters
      </button>
      <p role="status">{results.length} exercises</p>
      <ul className="exercises">
        {results.map((x) => (
          <li key={x.id}>
            <span className="serial">
              {catalogue.find((c) => c.id === x.id)?.serial ?? 'Custom'}
            </span>
            <button className="exercise-title" onClick={() => open(x.id)}>
              {x.img ? (
                <img className="thumbnail" src={String(x.img)} alt="" />
              ) : (
                <Dumbbell size={25} />
              )}
              <span>
                <h2>{x.n}</h2>
                <small>
                  {String(x.m)} · {String(x.e)}
                </small>
              </span>
            </button>
            <button
              className="icon-button quiet"
              aria-label={`Favourite ${x.n}`}
              aria-pressed={d?.fav?.includes(x.id) ?? false}
              disabled={!d || !!queued || fatal}
              onClick={() => send({ kind: 'favourite', id: x.id })}
            >
              <Star
                size={19}
                fill={d?.fav?.includes(x.id) ? 'currentColor' : 'none'}
              />
            </button>
          </li>
        ))}
      </ul>
      {!results.length && <p>No exercises match your search.</p>}
      {selected && (
        <Sheet
          title={bundled ? 'Exercise details' : 'Custom exercise'}
          close={() => select(null)}
        >
          {bundled ? (
            <>
              <h2>{name}</h2>
              <p>
                {m} · {e} · {t}
              </p>
              <p>
                Bundled exercise · permanent serial{' '}
                {catalogue.find((c) => c.id === selected)?.serial}. Read-only.
              </p>
              {img && <img className="photo" src={img} alt={name} />}
            </>
          ) : (
            <>
              <Field label="Exercise name" value={name} change={setName} />
              <label>
                Primary muscle
                <select
                  aria-label="Primary muscle"
                  value={m}
                  onChange={(e) => setM(e.target.value)}
                >
                  {[...muscles, 'Neck', 'Cardio'].map((x) => (
                    <option key={x}>{x}</option>
                  ))}
                </select>
              </label>
              <label>
                Exercise equipment
                <select
                  aria-label="Exercise equipment"
                  value={e}
                  onChange={(e) => setE(e.target.value)}
                >
                  {equipment.map((x) => (
                    <option key={x}>{x}</option>
                  ))}
                </select>
              </label>
              <label>
                Logging type
                <select
                  aria-label="Logging type"
                  value={t}
                  onChange={(e) => setT(e.target.value)}
                >
                  {loggingType.options.map((x) => (
                    <option key={x}>{x}</option>
                  ))}
                </select>
              </label>
              <PhotoInput
                label="Exercise image"
                change={(image, source) => {
                  setImg(image);
                  setOriginal(source);
                }}
              />
              {img && (
                <img className="photo" src={img} alt="Exercise preview" />
              )}
              <button
                disabled={!name.trim() || !!queued || fatal}
                onClick={() => {
                  send({
                    kind: 'exercise',
                    value: {
                      id: selected,
                      n: name.trim(),
                      m,
                      e,
                      t,
                      img,
                      originalImg: original,
                    },
                  });
                  select(null);
                }}
              >
                Save exercise
              </button>
              {d?.ex.some((e) => e.id === selected) && (
                <button className="danger" onClick={() => setRemove(true)}>
                  <Trash2 size={18} />
                  Delete custom exercise
                </button>
              )}
            </>
          )}
          {remove && (
            <Confirm
              title="Delete custom exercise"
              description="History and existing routine references stay recoverable. The library record will be removed."
              close={() => setRemove(false)}
              confirm={() => {
                send({ kind: 'deleteExercise', id: selected });
                select(null);
              }}
            />
          )}
        </Sheet>
      )}
    </section>
  );
}
