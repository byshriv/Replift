import { useRef, useState } from 'react';
import { Plus, Minus, ArrowLeft, ArrowRight, Flame } from 'lucide-react';
import { useLocal } from '../state/local';
import { useNavigation } from '../state/navigation';
import {
  calories,
  dayStart,
  displayValue,
  muscleSets,
  muscles,
  recovery,
  streak,
  unitLabel,
  weekStart,
  canonicalValue,
} from '../domain/metrics';
import { exercise, num, recomputeRecords, volume } from '../domain/workout';
import anatomy from '../data/anatomy.json';
import { send, Field, Sheet, PhotoInput, dateInput, uid, Confirm } from './ui';
import { History } from './Workout';
import type { LocalData } from '../domain/local';
export const defaultLayouts = {
  home: ['today', 'wk', 'vol', 'weight', 'reps', 'cal', 'notes'],
  stats: [
    'streak',
    'tot',
    'muscles',
    'month',
    'weight',
    'reps',
    'burn',
    'intake',
    'volbars',
    'radar',
    'recov',
    'prs',
  ],
};
const titles: Record<string, string> = {
  today: 'Today',
  wk: 'Workouts · 7 days',
  vol: 'Volume · 7 days',
  weight: 'Body weight',
  reps: 'Reps this week',
  cal: 'Last 30 days',
  notes: 'Pinned notes',
  streak: 'Week streak',
  tot: 'All time',
  muscles: 'Muscles trained',
  month: 'Month calendar',
  burn: 'Calories burned',
  intake: 'Calories eaten',
  volbars: 'Eight-week volume',
  radar: 'Muscle balance',
  recov: 'Recovery',
  prs: 'Personal records',
};
export function Chart({
  values,
  labels,
  line = false,
}: {
  values: number[];
  labels: string[];
  line?: boolean;
}) {
  const max = Math.max(1, ...values),
    count = values.length;
  return (
    <>
      <svg
        className="chart"
        role="img"
        aria-label={labels
          .map((l, n) => `${l}: ${Math.round(values[n] ?? 0)}`)
          .join(', ')}
        viewBox="0 0 320 120"
      >
        {line ? (
          <polyline
            fill="none"
            stroke="#62d391"
            strokeWidth="3"
            points={values
              .map(
                (n, i) =>
                  `${count <= 1 ? 160 : 10 + (i * 300) / (count - 1)},${110 - (n / max) * 90}`,
              )
              .join(' ')}
          />
        ) : (
          values.map((v, n) => (
            <rect
              key={n}
              x={(n * 320) / Math.max(1, count) + 3}
              y={110 - (v / max) * 95}
              width={Math.max(1, 320 / Math.max(1, count) - 6)}
              height={Math.max(2, (v / max) * 95)}
              rx="4"
              fill="#c4bca8"
            />
          ))
        )}
        {line &&
          values.map((v, n) => (
            <circle
              key={n}
              cx={count <= 1 ? 160 : 10 + (n * 300) / (count - 1)}
              cy={110 - (v / max) * 90}
              r="4"
              fill="#62d391"
            />
          ))}
      </svg>
      <p className="chart-caption">
        {labels
          .map((l, n) => `${l}: ${Math.round(values[n] ?? 0)}`)
          .join(' · ')}
      </p>
    </>
  );
}
function Calendar({ d }: { d: LocalData }) {
  const [offset, setOffset] = useState(0),
    [day, setDay] = useState<number | null>(null),
    now = new Date(),
    month = new Date(now.getFullYear(), now.getMonth() + offset, 1),
    fd = num(d.st?.fd),
    prefix = (month.getDay() - fd + 7) % 7,
    count = new Date(month.getFullYear(), month.getMonth() + 1, 0).getDate();
  return (
    <>
      <div className="row">
        <button
          aria-label="Previous month"
          className="icon-button quiet"
          onClick={() => setOffset(offset - 1)}
        >
          <ArrowLeft size={18} />
        </button>
        <h3>
          {month.toLocaleDateString(undefined, {
            month: 'long',
            year: 'numeric',
          })}
        </h3>
        <button
          aria-label="Next month"
          className="icon-button quiet"
          onClick={() => setOffset(offset + 1)}
        >
          <ArrowRight size={18} />
        </button>
      </div>
      <div className="calendar">
        {Array.from({ length: 7 }, (_, n) => (
          <small key={n}>
            {['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'][(n + fd) % 7]}
          </small>
        ))}
        {Array.from({ length: prefix }, (_, n) => (
          <span key={`blank${n}`} />
        ))}
        {Array.from({ length: count }, (_, n) => {
          const t = +new Date(month.getFullYear(), month.getMonth(), n + 1),
            on = d.wk.some((w) => dayStart(w.t) === t);
          return (
            <button
              key={n}
              className={on ? '' : 'quiet'}
              aria-label={`History ${new Date(t).toLocaleDateString()}`}
              onClick={() => setDay(t)}
            >
              {n + 1}
            </button>
          );
        })}
      </div>
      {day !== null && (
        <Sheet title="Day history" close={() => setDay(null)}>
          <h3>{new Date(day).toLocaleDateString()}</h3>
          {d.wk
            .filter((w) => dayStart(w.t) === day)
            .map((w) => (
              <p key={w.id}>
                {String(w.title ?? 'Workout')} · {String(w.dur)} min
              </p>
            ))}
          <p>Open Workout history below to inspect or edit a session.</p>
        </Sheet>
      )}
    </>
  );
}
function Anatomy({ d }: { d: LocalData }) {
  const [selected, select] = useState(''),
    counts = muscleSets(d, Date.now() - 6048e5);
  return (
    <>
      <svg
        className="anatomy"
        viewBox="0 0 420 456"
        role="group"
        aria-label="Front and back muscles"
      >
        {(['front', 'back'] as const).map((side, n) => (
          <g key={side} transform={`translate(${n * 220} 0)`}>
            <g dangerouslySetInnerHTML={{ __html: anatomy.sil }} />
            {Object.entries(anatomy.body[side]).map(([m, shape]) => {
              const s = shape as { L?: string[]; C?: string[] },
                left = (s.L ?? []).join(''),
                html =
                  left +
                  (left
                    ? `<g transform="translate(200 0) scale(-1 1)">${left}</g>`
                    : '') +
                  (s.C ?? []).join('');
              return (
                <g
                  key={m}
                  role="button"
                  aria-label={`${m} recovery`}
                  tabIndex={0}
                  onKeyDown={(e) => {
                    if (e.key === 'Enter' || e.key === ' ') select(m);
                  }}
                  onClick={() => select(m)}
                  fill={
                    selected === m
                      ? '#62d391'
                      : counts[m]
                        ? '#c4bca8'
                        : '#423c3a'
                  }
                  dangerouslySetInnerHTML={{ __html: html }}
                />
              );
            })}
          </g>
        ))}
      </svg>
      <p>
        {selected
          ? `${selected} · ${counts[selected] ?? 0} sets · ${recovery(d, selected, Date.now())}% recovered`
          : 'Tap a muscle to see its name and recovery.'}
      </p>
      <div className="chips">
        {muscles.map((m) => (
          <button className="quiet" key={m} onClick={() => select(m)}>
            {m}
          </button>
        ))}
      </div>
    </>
  );
}
function Radar({ d }: { d: LocalData }) {
  const counts = muscleSets(d, Date.now() - 6048e5),
    max = Math.max(1, ...Object.values(counts)),
    point = (i: number, r: number) =>
      `${150 + Math.sin((i / muscles.length) * 2 * Math.PI) * r},${150 - Math.cos((i / muscles.length) * 2 * Math.PI) * r}`;
  return (
    <>
      <svg
        className="radar"
        viewBox="0 0 300 300"
        role="img"
        aria-label="Muscle balance radar"
      >
        {[35, 70, 100].map((r) => (
          <polygon
            key={r}
            fill="none"
            stroke="#423c3a"
            points={muscles.map((_, n) => point(n, r)).join(' ')}
          />
        ))}
        <polygon
          fill="#c4bca866"
          stroke="#c4bca8"
          points={muscles
            .map((m, n) => point(n, ((counts[m] ?? 0) / max) * 100))
            .join(' ')}
        />
        {muscles.map((m, n) => {
          const [x, y] = point(n, 125).split(',');
          return (
            <text
              x={x}
              y={y}
              key={m}
              fill="#f7f5e4"
              fontSize="10"
              textAnchor="middle"
            >
              {m}
            </text>
          );
        })}
      </svg>
      <p className="chart-caption">
        {muscles.map((m) => `${m}: ${counts[m] ?? 0}`).join(' · ')}
      </p>
    </>
  );
}
function Block({ id, d }: { id: string; d: LocalData }) {
  const now = Date.now(),
    recent = d.wk.filter((w) => w.t >= now - 6048e5),
    navigate = useNavigation((s) => s.navigate),
    start = (routine?: string) => {
      if (!d.draft)
        send({ kind: 'start', id: uid(), ...(routine ? { routine } : {}) });
      navigate('Workout');
    };
  if (id === 'today') {
    const r = d.prog
      .flatMap((p) => p.routines)
      .find((r) => r.day === new Date().getDay() && r.ex.length);
    return (
      <>
        <h3>
          {d.draft
            ? String(d.draft.title ?? 'Workout')
            : (r?.n ?? (d.prog.length ? 'Rest day' : 'No routine yet'))}
        </h3>
        <button onClick={() => start(r?.id)}>
          {d.draft
            ? 'Resume workout'
            : r
              ? 'Start workout'
              : 'Start empty workout'}
        </button>
      </>
    );
  }
  if (id === 'wk')
    return <strong className="stat-number">{recent.length}</strong>;
  if (id === 'vol')
    return (
      <p>
        <strong className="stat-number">
          {displayValue(
            d,
            recent.reduce((a, w) => a + volume(d, w), 0),
            'kg',
          )}
        </strong>{' '}
        {unitLabel(d, 'kg')} lifted
      </p>
    );
  if (id === 'tot')
    return (
      <p>
        <strong className="stat-number">{d.wk.length}</strong> workouts ·{' '}
        {displayValue(
          d,
          d.wk.reduce((a, w) => a + volume(d, w), 0),
          'kg',
        )}{' '}
        {unitLabel(d, 'kg')}
      </p>
    );
  if (id === 'streak')
    return (
      <p>
        <Flame size={32} />
        <strong className="stat-number">{streak(d, now)}</strong> weeks
      </p>
    );
  if (id === 'month') return <Calendar d={d} />;
  if (id === 'muscles') return <Anatomy d={d} />;
  if (id === 'radar') return <Radar d={d} />;
  if (id === 'recov')
    return (
      <>
        {muscles.map((m) => (
          <div key={m}>
            <div className="row">
              <span>{m}</span>
              <span>{recovery(d, m, now)}%</span>
            </div>
            <progress max="100" value={recovery(d, m, now)} />
          </div>
        ))}
      </>
    );
  if (id === 'weight') {
    const ms = d.ms?.['Body weight'] ?? [];
    return ms.length ? (
      <Chart
        line
        values={ms.map((v) => Number(displayValue(d, v.v, 'kg')))}
        labels={ms.map((v) => new Date(v.t).toLocaleDateString())}
      />
    ) : (
      <p>Add your first weigh-in in Measures.</p>
    );
  }
  if (id === 'notes')
    return (
      <>
        {Object.entries(d.pin ?? {})
          .filter(([, v]) => !!v)
          .map(([id, v]) => (
            <p key={id}>
              <b>{exercise(d, id)?.n ?? 'Removed exercise'}</b>
              <br />
              {String(v)}
            </p>
          ))}
        {d.wk
          .filter((w) => w.notes)
          .slice(-4)
          .map((w) => (
            <p key={w.id}>{String(w.notes)}</p>
          ))}
        {!Object.values(d.pin ?? {}).some(Boolean) && (
          <p>Pin exercise notes in the logger.</p>
        )}
      </>
    );
  if (id === 'intake')
    return (
      <>
        <p>Connect Healthify · coming later.</p>
        <button disabled>Connect Healthify</button>
      </>
    );
  if (id === 'prs') {
    const copy = structuredClone(d),
      best = recomputeRecords(copy);
    return (
      <>
        {[...best]
          .filter(([, v]) => v.seen)
          .map(([id, b]) => (
            <p key={id}>
              <b>{exercise(d, id)?.n ?? 'Removed exercise'}</b>
              <br />
              {displayValue(d, b.w, 'kg')} {unitLabel(d, 'kg')} · Epley 1RM{' '}
              {displayValue(d, b.e, 'kg')}
            </p>
          ))}
        {!best.size && (
          <p>Eligible weighted records appear here after training.</p>
        )}
      </>
    );
  }
  if (id === 'cal') {
    const days = Array.from({ length: 30 }, (_, n) => {
      const date = new Date(dayStart(now));
      date.setDate(date.getDate() - 29 + n);
      return +date;
    });
    return (
      <div className="activity-dots">
        {days.map((t) => (
          <span
            className={d.wk.some((w) => dayStart(w.t) === t) ? 'active' : ''}
            key={t}
            title={new Date(t).toLocaleDateString()}
          />
        ))}
      </div>
    );
  }
  if (id === 'reps') {
    const first = weekStart(now, num(d.st?.fd)),
      days = Array.from({ length: 7 }, (_, n) => {
        const date = new Date(first);
        date.setDate(date.getDate() + n);
        return +date;
      });
    return (
      <Chart
        values={days.map((t) =>
          d.wk
            .filter((w) => dayStart(w.t) === t)
            .reduce(
              (a, w) =>
                a +
                w.items
                  .filter((i) =>
                    ['kr', 'wb', 'as', 'br'].includes(
                      exercise(d, i.ex)?.t ?? '',
                    ),
                  )
                  .reduce(
                    (a, i) =>
                      a +
                      i.sets
                        .filter((s) => s.done)
                        .reduce((a, s) => a + num(s.reps), 0),
                    0,
                  ),
              0,
            ),
        )}
        labels={days.map((t) =>
          new Date(t).toLocaleDateString(undefined, { weekday: 'short' }),
        )}
      />
    );
  }
  const weeks = Array.from({ length: 8 }, (_, n) => {
    const date = new Date(weekStart(now, num(d.st?.fd)));
    date.setDate(date.getDate() - (7 - n) * 7);
    return +date;
  });
  return (
    <>
      <Chart
        values={weeks.map((t, n) =>
          d.wk
            .filter((w) => w.t >= t && (n === 7 || w.t < weeks[n + 1]!))
            .reduce(
              (a, w) => a + (id === 'burn' ? calories(d, w) : volume(d, w)),
              0,
            ),
        )}
        labels={weeks.map((t) => new Date(t).toLocaleDateString())}
      />
      {id === 'burn' && (
        <details>
          <summary>How calories are estimated</summary>
          <p>
            Calories = MET × body weight (kg) × hours. Strength MET: 3.5 / 5 / 6
            / 6.5; default moderate. Cardio: run 9.8, walk 3.8, bike 7.5, row 7,
            swim 6, elliptical 5, jump rope 11, fallback 6. Cardio minutes are
            subtracted from strength duration. Latest weigh-in or profile
            weight; fallback 70 kg. These are estimates.
          </p>
        </details>
      )}
    </>
  );
}
export function Dashboard({ tab }: { tab: 'home' | 'stats' }) {
  const state = useLocal(),
    d = state.snapshot?.data,
    [editing, setEditing] = useState(false),
    [drag, setDrag] = useState<string | null>(null),
    hold = useRef<ReturnType<typeof setTimeout> | null>(null),
    origin = useRef<{ x: number; y: number } | null>(null);
  if (!d) return <p>Opening your data…</p>;
  const layout = Array.isArray(d.lay?.[tab])
      ? (d.lay![tab] as string[])
      : defaultLayouts[tab],
    blocks = layout.filter((id) => titles[id]);
  const save = (blocks: string[]) => send({ kind: 'layout', tab, blocks });
  return (
    <>
      <div className="row">
        <h2>{tab === 'home' ? 'Your training' : 'Overview'}</h2>
        <button onClick={() => setEditing(!editing)}>
          {editing ? (
            'Done'
          ) : (
            <>
              <Plus size={18} />
              Edit blocks
            </>
          )}
        </button>
      </div>
      <div className="block-grid">
        {blocks.map((id, index) => (
          <article
            className={`card block ${drag === id ? 'dragging' : ''} ${['today', 'cal', 'month', 'muscles', 'radar', 'recov', 'prs', 'volbars', 'burn'].includes(id) ? 'wide' : ''}`}
            data-block={id}
            key={id}
            onPointerDown={(e) => {
              if (!editing || (e.target as HTMLElement).closest('button'))
                return;
              origin.current = { x: e.clientX, y: e.clientY };
              hold.current = setTimeout(() => setDrag(id), 380);
            }}
            onPointerMove={(e) => {
              if (
                !drag &&
                origin.current &&
                Math.hypot(
                  e.clientX - origin.current.x,
                  e.clientY - origin.current.y,
                ) > 8 &&
                hold.current
              )
                clearTimeout(hold.current);
            }}
            onPointerUp={(e) => {
              if (hold.current) clearTimeout(hold.current);
              if (drag) {
                const el = document
                  .elementFromPoint(e.clientX, e.clientY)
                  ?.closest('[data-block]');
                const target = el?.getAttribute('data-block');
                if (target && target !== drag) {
                  const reordered = [...layout];
                  reordered.splice(reordered.indexOf(drag), 1);
                  reordered.splice(reordered.indexOf(target), 0, drag);
                  save(reordered);
                }
                setDrag(null);
              }
            }}
            onPointerCancel={() => {
              if (hold.current) clearTimeout(hold.current);
              setDrag(null);
            }}
          >
            <div className="row">
              <h3>{titles[id]}</h3>
              {editing && (
                <button
                  className="icon-button quiet"
                  aria-label={`Remove block ${titles[id]}`}
                  onClick={() => save(layout.filter((b) => b !== id))}
                >
                  <Minus size={18} />
                </button>
              )}
            </div>
            {editing ? (
              <>
                <p>Hold to move, or use the arrows.</p>
                <button
                  aria-label={`Move ${titles[id]} earlier`}
                  disabled={!index || !!state.queued}
                  onClick={() => {
                    const next = [...layout],
                      pos = next.indexOf(id);
                    [next[pos - 1], next[pos]] = [next[pos]!, next[pos - 1]!];
                    save(next);
                  }}
                >
                  <ArrowLeft size={16} />
                </button>
                <button
                  aria-label={`Move ${titles[id]} later`}
                  disabled={index === blocks.length - 1 || !!state.queued}
                  onClick={() => {
                    const next = [...layout],
                      pos = next.indexOf(id);
                    [next[pos + 1], next[pos]] = [next[pos]!, next[pos + 1]!];
                    save(next);
                  }}
                >
                  <ArrowRight size={16} />
                </button>
              </>
            ) : (
              <Block id={id} d={d} />
            )}
          </article>
        ))}
      </div>
      {editing && (
        <section className="card">
          <h3>Not added</h3>
          <div className="chips">
            {Object.keys(titles)
              .filter((id) => !layout.includes(id))
              .map((id) => (
                <button
                  key={id}
                  disabled={!!state.queued}
                  onClick={() => save([...layout, id])}
                >
                  <Plus size={15} />
                  {titles[id]}
                </button>
              ))}
          </div>
        </section>
      )}
      <button className="quiet" onClick={() => setEditing(true)}>
        <Plus size={18} />
        Add block
      </button>
      {tab === 'home' && (!d.bk || Date.now() - d.bk > 7 * 864e5) && (
        <p className="badge">
          Keep a complete backup. Export and recovery are in Settings.
        </p>
      )}
      {tab === 'home' && !d.st?.wad && (
        <section className="card">
          <h3>Train with friends</h3>
          <p>
            Community links are coming later. You can share individual workout
            cards after finishing.
          </p>
          <button
            className="quiet"
            onClick={() =>
              send({ kind: 'preference', group: 'st', key: 'wad', value: 1 })
            }
          >
            Dismiss community reminder
          </button>
        </section>
      )}
    </>
  );
}
const measures = [
  'Body weight',
  'Body fat',
  'Neck',
  'Shoulders',
  'Chest',
  'Left bicep',
  'Right bicep',
  'Left forearm',
  'Right forearm',
  'Waist',
  'Hips',
  'Left thigh',
  'Right thigh',
  'Left calf',
  'Right calf',
];
export function Measures() {
  const state = useLocal(),
    d = state.snapshot!.data,
    [name, setName] = useState('Body weight'),
    [value, setValue] = useState(''),
    [time, setTime] = useState(dateInput(Date.now())),
    [custom, setCustom] = useState('');
  const unit =
      name === 'Body weight' || name === 'Fat-free mass'
        ? 'kg'
        : name === 'Body fat'
          ? '%'
          : name === 'Caloric intake'
            ? 'kcal'
            : 'cm',
    values = d.ms?.[name] ?? [];
  return (
    <section>
      <h2>Measures</h2>
      <label>
        Measure
        <select
          aria-label="Measure"
          value={name}
          onChange={(e) => setName(e.target.value)}
        >
          {[
            ...new Set([
              ...measures,
              'Height',
              'Fat-free mass',
              ...(d.cm ?? []),
            ]),
          ].map((n) => (
            <option key={n}>{n}</option>
          ))}
        </select>
      </label>
      <Chart
        line
        values={values.map((v) => Number(displayValue(d, v.v, unit)))}
        labels={values.map((v) => new Date(v.t).toLocaleDateString())}
      />
      <label>
        Measurement date
        <input
          type="datetime-local"
          value={time}
          onChange={(e) => setTime(e.target.value)}
        />
      </label>
      <Field
        label={`Measurement (${unitLabel(d, unit)})`}
        value={value}
        numeric
        change={setValue}
      />
      <button
        disabled={
          !!state.queued ||
          state.fatal ||
          !/^\d+(\.\d+)?$/.test(value) ||
          Number(value) <= 0 ||
          !Number.isFinite(+new Date(time))
        }
        onClick={() => {
          send({
            kind: 'measure',
            name,
            value: canonicalValue(d, value, unit),
            time: +new Date(time),
            id: uid(),
          });
          setValue('');
        }}
      >
        Save measurement
      </button>
      {values.map((v, n) => (
        <div className="row" key={String(v.id ?? n)}>
          <p>
            {new Date(v.t).toLocaleDateString()} · {displayValue(d, v.v, unit)}{' '}
            {unitLabel(d, unit)}
          </p>
          <button
            disabled={!!state.queued}
            className="quiet"
            onClick={() =>
              send({
                kind: 'measure',
                name,
                value: '',
                time: v.t,
                id: '',
                remove: String(
                  v.id ??
                    `legacy:${v.t}:${values.slice(0, n).filter((x) => x.t === v.t).length}`,
                ),
              })
            }
          >
            Delete measurement
          </button>
        </div>
      ))}
      <Field label="Custom measure name" value={custom} change={setCustom} />
      <button
        disabled={!custom.trim() || !!state.queued}
        onClick={() => {
          send({ kind: 'customMeasure', name: custom });
          setName(custom.trim());
          setCustom('');
        }}
      >
        Add custom measure
      </button>
    </section>
  );
}
export function Photos() {
  const state = useLocal(),
    d = state.snapshot!.data,
    [image, setImage] = useState(''),
    [original, setOriginal] = useState(''),
    [time, setTime] = useState(dateInput(Date.now())),
    [selected, select] = useState<string[]>([]),
    [remove, setRemove] = useState<string | null>(null),
    [comparing, setComparing] = useState(false);
  return (
    <section>
      <h2>Progress photos</h2>
      <PhotoInput
        label="Progress photo"
        change={(image, source) => {
          setImage(image);
          setOriginal(source);
        }}
      />
      <label>
        Photo date
        <input
          type="datetime-local"
          value={time}
          onChange={(e) => setTime(e.target.value)}
        />
      </label>
      {image && (
        <img className="photo" src={image} alt="New progress preview" />
      )}
      <button
        disabled={
          !image ||
          !Number.isFinite(+new Date(time)) ||
          !!state.queued ||
          state.fatal
        }
        onClick={() => {
          send({
            kind: 'photo',
            image,
            original,
            time: +new Date(time),
            id: uid(),
          });
          setImage('');
        }}
      >
        Save progress photo
      </button>
      <div className="photo-grid">
        {(d.ph ?? []).map((p) => (
          <article key={p.id}>
            <button
              className="photo-button quiet"
              aria-pressed={selected.includes(p.id)}
              onClick={() =>
                select(
                  selected.includes(p.id)
                    ? selected.filter((id) => id !== p.id)
                    : [...selected.slice(-1), p.id],
                )
              }
            >
              <img
                src={p.img}
                alt={`Progress ${new Date(p.t).toLocaleDateString()}`}
              />
            </button>
            <small>{new Date(p.t).toLocaleDateString()}</small>
            <button className="quiet" onClick={() => setRemove(p.id)}>
              Delete photo
            </button>
          </article>
        ))}
      </div>
      {selected.length > 0 && (
        <button onClick={() => setComparing(true)}>
          Compare selected photos ({selected.length})
        </button>
      )}
      {comparing && selected.length > 0 && (
        <Sheet
          title="Compare progress photos"
          close={() => setComparing(false)}
        >
          <div className="photo-grid">
            {selected.map((id) => {
              const p = d.ph?.find((p) => p.id === id);
              return (
                p && (
                  <figure key={id}>
                    <img
                      className="photo"
                      src={p.img}
                      alt="Selected progress"
                    />
                    <figcaption>
                      {new Date(p.t).toLocaleDateString()}
                    </figcaption>
                  </figure>
                )
              );
            })}
          </div>
          <p>Close and select a second photo to compare dates.</p>
        </Sheet>
      )}
      {remove && (
        <Confirm
          title="Delete progress photo"
          description="Remove this photo? A local recovery point is retained."
          close={() => setRemove(null)}
          confirm={() =>
            send({
              kind: 'photo',
              id: remove,
              time: 0,
              image: '',
              remove: true,
            })
          }
        />
      )}
    </section>
  );
}
export default function Stats() {
  const [tab, setTab] = useState('Overview');
  return (
    <>
      <div className="chips">
        {['Overview', 'Measures', 'Photos', 'History'].map((t) => (
          <button
            className={tab === t ? '' : 'quiet'}
            key={t}
            onClick={() => setTab(t)}
          >
            {t}
          </button>
        ))}
      </div>
      {tab === 'Overview' ? (
        <Dashboard tab="stats" />
      ) : tab === 'Measures' ? (
        <Measures />
      ) : tab === 'Photos' ? (
        <Photos />
      ) : (
        <History />
      )}
    </>
  );
}
