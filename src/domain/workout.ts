import type { LocalData, RoutineSet } from './local';

export type Set = RoutineSet;
export type Workout = LocalData['wk'][number];
export type Item = Workout['items'][number];
export const num = (v: unknown) => Number(v) || 0;
export const exercise = (d: LocalData, id: string) =>
  d.ex.find((e) => e.id === id);
export const weighted = (d: LocalData, id: string) =>
  ['kr', 'wb'].includes(exercise(d, id)?.t ?? 'kr');
export const epley = (s: Set) => num(s.kg) * (1 + num(s.reps) / 30);
export const eligible = (s: Set) => !!s.done && s.k !== 'w' && !s.est;
export function validSet(s: Set, type: string): boolean {
  const valid = (v: unknown, positive: boolean, integer = false) =>
    /^\d+(\.\d+)?$/.test(String(v ?? '')) &&
    Number.isFinite(Number(v)) &&
    (positive ? Number(v) > 0 : Number(v) >= 0) &&
    (!integer || Number.isInteger(Number(v)));
  return (
    valid(s.reps, true, ['kr', 'wb', 'as', 'br'].includes(type)) &&
    (['br', 'du', 'mn'].includes(type) ||
      valid(s.kg, type === 'kr' || type === 'di' || type === 'wt'))
  );
}
export function previous(d: LocalData, id: string, routine: unknown): Set[] {
  const history = [...d.wk].sort((a, b) => b.t - a.t);
  const find = (same: boolean) =>
    history
      .filter((w) => !same || w.r === routine)
      .map((w) => w.items.find((i) => i.ex === id)?.sets)
      .find((s) => s?.length);
  return structuredClone(
    (routine ? find(true) : undefined) ??
      d.prog.flatMap((p) => p.routines).find((r) => r.id === routine)?.vals?.[
        id
      ] ??
      find(false) ??
      [],
  );
}
export function seed(
  d: LocalData,
  id: string,
  routine: unknown,
  uid: () => string,
): Set[] {
  const p = previous(d, id, routine);
  return (
    p.length
      ? p
      : Array.from(
          { length: Math.min(20, Math.max(1, num(d.st?.sets) || 3)) },
          () => ({ kg: '', reps: '' }),
        )
  ).map((s) => ({ id: uid(), kg: s.kg ?? '', reps: s.reps ?? '', done: 0 }));
}
export function volume(d: LocalData, w: Workout) {
  return w.items.reduce(
    (a, i) =>
      a +
      (weighted(d, i.ex)
        ? i.sets
            .filter((s) => s.done && s.k !== 'w')
            .reduce((b, s) => b + num(s.kg) * num(s.reps), 0)
        : 0),
    0,
  );
}
export function recomputeRecords(d: LocalData) {
  const best = new Map<
    string,
    { w: number; e: number; v: number; seen: boolean }
  >();
  for (const w of [...d.wk].sort(
    (a, b) => a.t - b.t || a.id.localeCompare(b.id),
  )) {
    const seenBeforeWorkout = new Map([...best].map(([id, b]) => [id, b.seen]));
    for (const i of w.items) {
      const b = best.get(i.ex) ?? { w: 0, e: 0, v: 0, seen: false };
      const prior = seenBeforeWorkout.get(i.ex) ?? false;
      for (const s of i.sets) {
        s.pr = 0;
        if (
          !weighted(d, i.ex) ||
          !eligible(s) ||
          !validSet(s, exercise(d, i.ex)?.t ?? 'kr')
        )
          continue;
        const v = num(s.kg) * num(s.reps),
          e = epley(s),
          weight = num(s.kg);
        s.pr = prior && (weight > b.w || e > b.e || v > b.v) ? 1 : 0;
        b.w = Math.max(b.w, weight);
        b.e = Math.max(b.e, e);
        b.v = Math.max(b.v, v);
        b.seen = true;
      }
      best.set(i.ex, b);
    }
  }
  return best;
}
export function autofill(
  sets: Set[],
  index: number,
  field: 'kg' | 'reps',
  value: string,
) {
  const s = sets[index];
  if (!s) throw new Error('Set unavailable. Reopen the workout.');
  const before = s[field];
  s[field] = value;
  s.done = 0;
  s.pr = 0;
  delete s.est;
  if (index === 0)
    for (const later of sets.slice(1))
      if (
        !later.done &&
        (later[field] === '' ||
          later[field] === undefined ||
          String(later[field]) === String(before))
      ) {
        later[field] = value;
        later.pr = 0;
        delete later.est;
      }
}
export function finish(
  d: LocalData,
  options: {
    duration: string;
    time: number;
    title: string;
    notes: string;
    difficulty: number;
    update: boolean;
    allowIncomplete: boolean;
    photo?: string;
  },
  now: number,
) {
  const draft = d.draft;
  if (!draft) throw new Error('No active workout.');
  if (
    !/^\d+(\.\d+)?$/.test(options.duration) ||
    !Number.isFinite(Number(options.duration)) ||
    Number(options.duration) <= 0
  )
    throw new Error('Set a positive duration before saving.');
  if (!Number.isFinite(options.time) || options.time <= 0)
    throw new Error('Choose a valid workout date.');
  if (!draft.items.some((i) => i.sets.some((s) => s.done)))
    throw new Error('Complete at least one set.');
  if (
    !options.allowIncomplete &&
    draft.items.some((i) => i.sets.some((s) => !s.done))
  )
    throw new Error('Not all sets are completed');
  for (const i of draft.items)
    for (const s of i.sets)
      if (s.done && !validSet(s, exercise(d, i.ex)?.t ?? 'kr'))
        throw new Error('Completed sets need valid values.');
  const id = typeof draft.id === 'string' ? draft.id : '';
  if (!id)
    throw new Error('Workout identity missing. Original draft retained.');
  const w: Workout = {
    ...structuredClone(draft),
    id,
    t: Math.min(options.time, now),
    dur: Number(options.duration),
    title: options.title,
    notes: options.notes,
    diff: options.difficulty,
    items: structuredClone(draft.items),
  };
  if (options.photo) {
    w.img = options.photo;
    const prior = d.wk.find((old) => old.id === id);
    if (!prior || prior.img !== options.photo)
      (d.ph ??= []).push({
        id: `${id}:photo:${now}`,
        t: w.t,
        img: options.photo,
        ...(typeof w.originalImg === 'string'
          ? { originalImg: w.originalImg }
          : {}),
      });
  }
  const index = d.wk.findIndex((w) => w.id === id);
  if (index >= 0) d.wk[index] = w;
  else d.wk.push(w);
  if (options.update) {
    const r = d.prog.flatMap((p) => p.routines).find((r) => r.id === w.r);
    if (r)
      for (const i of w.items)
        if (r.ex.includes(i.ex))
          (r.vals?.[i.ex] ?? []).forEach((s, n) => {
            const v = i.sets[n];
            if (v?.done) {
              s.kg = v.kg ?? '';
              s.reps = v.reps ?? '';
            }
          });
  }
  d.draft = null;
  recomputeRecords(d);
  if (index < 0 && d.wk.length === 4 && !d.st?.ds) {
    d.st ??= {};
    d.st.dq = 1;
    d.st.ds = 1;
  }
  return w;
}
