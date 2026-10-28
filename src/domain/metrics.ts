import type { LocalData } from './local';
import { exercise, num, type Workout, volume } from './workout';
export const muscles = [
  'Chest',
  'Back',
  'Shoulders',
  'Biceps',
  'Triceps',
  'Forearms',
  'Abs',
  'Quads',
  'Hamstrings',
  'Glutes',
  'Calves',
];
export function dayStart(t: number) {
  const d = new Date(t);
  d.setHours(0, 0, 0, 0);
  return +d;
}
export function weekStart(t: number, first = 0) {
  const d = new Date(dayStart(t));
  d.setDate(d.getDate() - ((d.getDay() - first + 7) % 7));
  return +d;
}
export function streak(d: LocalData, now: number) {
  const first = num(d.st?.fd),
    weeks = new Set(d.wk.map((w) => weekStart(w.t, first)));
  let t = weekStart(now, first),
    n = 0;
  if (!weeks.has(t)) {
    const date = new Date(t);
    date.setDate(date.getDate() - 7);
    t = +date;
  }
  while (weeks.has(t)) {
    n++;
    const date = new Date(t);
    date.setDate(date.getDate() - 7);
    t = +date;
  }
  return n;
}
export function muscleSets(d: LocalData, since: number) {
  const counts: Record<string, number> = {};
  for (const w of d.wk)
    if (w.t >= since)
      for (const i of w.items) {
        const m = String(exercise(d, i.ex)?.m ?? '');
        counts[m] =
          (counts[m] ?? 0) +
          i.sets.filter((s) => s.done && (s.k !== 'w' || d.st?.warm)).length;
      }
  return counts;
}
export function recovery(d: LocalData, muscle: string, now: number) {
  const latest = [...d.wk]
    .sort((a, b) => b.t - a.t)
    .find((w) =>
      w.items.some(
        (i) => exercise(d, i.ex)?.m === muscle && i.sets.some((s) => s.done),
      ),
    );
  if (!latest) return 100;
  const sets = latest.items
    .filter((i) => exercise(d, i.ex)?.m === muscle)
    .reduce(
      (a, i) =>
        a + i.sets.filter((s) => s.done && (s.k !== 'w' || d.st?.warm)).length,
      0,
    );
  return Math.max(
    0,
    Math.min(
      100,
      Math.round(
        ((now - latest.t) / 36e5 / (24 + 4 * Math.min(sets, 12))) * 100,
      ),
    ),
  );
}
export function cardioMET(name: string) {
  return /run|sprint|shuttle/i.test(name)
    ? 9.8
    : /walk|march|step touch/i.test(name)
      ? 3.8
      : /bike|cycl/i.test(name)
        ? 7.5
        : /row|ski/i.test(name)
          ? 7
          : /swim/i.test(name)
            ? 6
            : /elliptical/i.test(name)
              ? 5
              : /jump rope/i.test(name)
                ? 11
                : 6;
}
export function calories(d: LocalData, w: Workout) {
  const mass = [...(d.ms?.['Body weight'] ?? [])]
    .filter((v) => v.t <= w.t)
    .sort((a, b) => b.t - a.t)[0];
  const bw = num(mass?.v) || num(d.pf?.wt) || 70;
  let minutes = 0,
    kcal = 0;
  for (const i of w.items) {
    const e = exercise(d, i.ex);
    if (['mn', 'di'].includes(e?.t ?? '')) {
      const m = i.sets
        .filter((s) => s.done)
        .reduce((a, s) => a + num(s.reps), 0);
      minutes += m;
      kcal += (cardioMET(e?.n ?? '') * bw * m) / 60;
    }
  }
  return Math.round(
    kcal +
      (([3.5, 5, 6, 6.5][w.diff === undefined ? 1 : num(w.diff)] ?? 5) *
        bw *
        Math.max(0, num(w.dur) - minutes)) /
        60,
  );
}
export const weightFactor = (d: LocalData) =>
  d.st?.u === 'lb' ? 2.2046226218 : 1;
export const lengthFactor = (d: LocalData) => (d.st?.u === 'lb' ? 1 / 2.54 : 1);
export const distanceFactor = (d: LocalData) =>
  d.st?.u === 'lb' ? 0.6213711922 : 1;
export function displayValue(d: LocalData, value: unknown, unit: string) {
  if (typeof value === 'string' && !/^\d+(\.\d+)?$/.test(value)) return value;
  const factor =
    unit === 'kg'
      ? weightFactor(d)
      : unit === 'cm'
        ? lengthFactor(d)
        : unit === 'km'
          ? distanceFactor(d)
          : 1;
  return value === '' || value === undefined
    ? ''
    : String(Math.round(num(value) * factor * 1000) / 1000);
}
export function canonicalValue(d: LocalData, value: string, unit: string) {
  if (!/^\d+(\.\d+)?$/.test(value)) return value;
  const factor =
    unit === 'kg'
      ? weightFactor(d)
      : unit === 'cm'
        ? lengthFactor(d)
        : unit === 'km'
          ? distanceFactor(d)
          : 1;
  return String(Number(value) / factor);
}
export function unitLabel(d: LocalData, u: string) {
  return d.st?.u === 'lb' ? ({ kg: 'lb', cm: 'in', km: 'mi' }[u] ?? u) : u;
}
export function summary(d: LocalData, w: Workout) {
  return {
    volume: volume(d, w),
    calories: calories(d, w),
    sets: w.items.reduce((a, i) => a + i.sets.filter((s) => s.done).length, 0),
    muscles: [
      ...new Set(
        w.items.map((i) => String(exercise(d, i.ex)?.m ?? 'Removed exercise')),
      ),
    ],
  };
}
