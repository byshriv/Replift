import { z } from 'zod';
import { applyDomain, type Action } from './port';

const scalar = z.union([z.string(), z.number().finite()]);
export const setSchema = z.looseObject({
  id: z.string().min(1).optional(),
  kg: scalar.optional(),
  reps: scalar.optional(),
  done: z.unknown().optional(),
  est: z.unknown().optional(),
  pr: z.unknown().optional(),
  k: z.unknown().optional(),
  rpe: z.unknown().optional(),
});
export const routineSchema = z.looseObject({
  id: z.string().min(1),
  n: z.string(),
  day: z.number().int().min(0).max(6),
  ex: z.array(z.string()),
  vals: z.record(z.string(), z.array(setSchema)).optional(),
});
export const legacySchema = z.looseObject({
  ex: z.array(
    z.looseObject({
      id: z.string().min(1),
      n: z.string(),
      t: z.string().optional(),
      img: z.string().optional(),
    }),
  ),
  prog: z.array(
    z.looseObject({
      id: z.string().min(1),
      n: z.string(),
      routines: z.array(routineSchema),
    }),
  ),
  wk: z.array(
    z.looseObject({
      id: z.string().min(1),
      t: z.number().finite(),
      items: z.array(
        z.looseObject({ ex: z.string(), sets: z.array(setSchema) }),
      ),
    }),
  ),
  draft: z
    .union([
      z.null(),
      z.looseObject({
        items: z.array(
          z.looseObject({ ex: z.string(), sets: z.array(setSchema) }),
        ),
      }),
    ])
    .optional(),
  pin: z.record(z.string(), z.unknown()).optional(),
  fav: z.array(z.string()).optional(),
  have: z.array(z.string()).optional(),
  st: z.record(z.string(), z.unknown()).optional(),
  lay: z.record(z.string(), z.unknown()).optional(),
  ms: z
    .record(
      z.string(),
      z.array(z.looseObject({ t: z.number().finite(), v: scalar })),
    )
    .optional(),
  cm: z.array(z.string()).optional(),
  ph: z
    .array(
      z.looseObject({
        id: z.string().min(1),
        t: z.number().finite(),
        img: z.string(),
      }),
    )
    .optional(),
  pf: z.record(z.string(), z.unknown()).optional(),
  ob: z.record(z.string(), z.unknown()).optional(),
  wt: z.record(z.string(), z.unknown()).optional(),
  bk: z.number().finite().optional(),
  pl: z.array(z.unknown()).optional(),
});
export type LocalData = z.infer<typeof legacySchema>;
export type Routine = z.infer<typeof routineSchema>;
export type RoutineSet = z.infer<typeof setSchema>;

export function validateData(value: unknown): LocalData {
  const data = legacySchema.parse(value);
  if (data.schema !== undefined || data.schemaVersion !== undefined)
    throw new Error(
      'Versioned imports require an explicit supported migration.',
    );
  const unique = (ids: string[]) => new Set(ids).size === ids.length;
  if (
    !unique(data.ex.map((x) => x.id)) ||
    !unique(data.prog.map((x) => x.id)) ||
    !unique(data.prog.flatMap((p) => p.routines.map((r) => r.id))) ||
    !unique(data.wk.map((x) => x.id)) ||
    !unique((data.ph ?? []).map((x) => x.id)) ||
    data.prog.some((p) =>
      p.routines.some(
        (r) =>
          !unique(r.ex) ||
          Object.values(r.vals ?? {}).some((sets) => {
            const ids = sets.flatMap((s) => (s.id ? [s.id] : []));
            return !unique(ids);
          }),
      ),
    )
  )
    throw new Error(
      'Duplicate identities require recovery; original data is retained.',
    );
  return data;
}

export type Command =
  | { type: 'domain'; action: Action }
  | { type: 'program'; id: string }
  | { type: 'routine'; program: string; id: string }
  | { type: 'name'; program: string; value: string; routine?: string }
  | { type: 'day'; routine: string; value: number }
  | { type: 'select'; routine: string; exercise: string; ids: string[] }
  | { type: 'addSet'; routine: string; exercise: string; id: string }
  | {
      type: 'field';
      routine: string;
      exercise: string;
      set: string;
      field: 'kg' | 'reps';
      value: string;
    }
  | { type: 'removeExercise'; routine: string; exercise: string }
  | { type: 'removeSet'; routine: string; exercise: string; set: string };
export type Removed = {
  routine: string;
  exercise: string;
  index: number;
  sets: RoutineSet[];
  set?: string;
};

export function findRoutine(data: LocalData, id: string): Routine {
  const r = data.prog.flatMap((p) => p.routines).find((r) => r.id === id);
  if (!r)
    throw new Error('Routine changed in another tab. Reopen it and try again.');
  return r;
}
export function applyCommand(data: LocalData, c: Command): Removed | undefined {
  if (c.type === 'domain') {
    applyDomain(data, c.action);
    return;
  }
  if (c.type === 'program') {
    if (data.prog.some((p) => p.id === c.id))
      throw new Error('Program already exists.');
    data.prog.push({ id: c.id, n: 'My program', routines: [] });
    return;
  }
  if (c.type === 'routine' || c.type === 'name') {
    const p = data.prog.find((p) => p.id === c.program);
    if (!p) throw new Error('Program is unavailable.');
    if (c.type === 'routine') {
      if (data.prog.some((p) => p.routines.some((r) => r.id === c.id)))
        throw new Error('Routine already exists.');
      p.routines.push({ id: c.id, n: 'New routine', day: 1, ex: [], vals: {} });
    } else if (c.routine) findRoutine(data, c.routine).n = c.value;
    else p.n = c.value;
    return;
  }
  const r = findRoutine(data, c.routine);
  if (c.type === 'day') {
    r.day = c.value;
    return;
  }
  const vals = (r.vals ??= {});
  if (c.type === 'select') {
    if (!data.ex.some((e) => e.id === c.exercise))
      throw new Error('Exercise is unavailable.');
    if (!r.ex.includes(c.exercise)) {
      r.ex.push(c.exercise);
      // Retain any existing defaults rather than replacing orphaned values.
      vals[c.exercise] ??= c.ids.map((id) => ({ id, kg: '', reps: '' }));
    }
    return;
  }
  if (!r.ex.includes(c.exercise))
    throw new Error('Exercise was removed. Undo or reopen the routine.');
  const sets = (vals[c.exercise] ??= []);
  if (c.type === 'addSet') {
    sets.push({ id: c.id, kg: '', reps: '' });
    return;
  }
  if (c.type === 'removeExercise') {
    const removed = {
      routine: r.id,
      exercise: c.exercise,
      index: r.ex.indexOf(c.exercise),
      sets: structuredClone(sets),
    };
    r.ex.splice(removed.index, 1);
    delete vals[c.exercise];
    return removed;
  }
  const index = sets.findIndex((s) => s.id === c.set);
  if (index < 0) throw new Error('Set was removed. Reopen the routine.');
  if (c.type === 'removeSet') {
    return {
      routine: r.id,
      exercise: c.exercise,
      index,
      sets: sets.splice(index, 1),
      set: c.set,
    };
  }
  const set = sets[index]!;
  set[c.field] = c.value; // Raw strings are durable drafts, including incomplete/invalid input.
  delete set.done;
  delete set.pr;
}

export function restoreRemoved(data: LocalData, removed: Removed) {
  const r = findRoutine(data, removed.routine);
  const vals = (r.vals ??= {});
  if (removed.set) {
    if (!r.ex.includes(removed.exercise))
      throw new Error('Restore the exercise before this set.');
    const sets = (vals[removed.exercise] ??= []);
    if (sets.some((s) => s.id === removed.set))
      throw new Error('Set already restored.');
    sets.splice(Math.min(removed.index, sets.length), 0, ...removed.sets);
  } else {
    if (r.ex.includes(removed.exercise))
      throw new Error(
        'Exercise was added again; its current values are preserved.',
      );
    r.ex.splice(Math.min(removed.index, r.ex.length), 0, removed.exercise);
    vals[removed.exercise] = removed.sets;
  }
}

export function fieldLabels(type: string): [string | null, string] {
  if (type === 'br') return [null, 'reps'];
  if (type === 'du') return [null, 'seconds'];
  if (type === 'mn') return [null, 'minutes'];
  if (type === 'di') return ['km', 'minutes'];
  if (type === 'wt') return ['kg', 'seconds'];
  return ['kg', 'reps'];
}
export function validValue(value: unknown, integer = false): boolean {
  const s = String(value ?? '');
  return (
    (integer ? /^\d+$/ : /^\d+(\.\d+)?$/).test(s) &&
    Number.isFinite(Number(s)) &&
    Number(s) >= 0
  );
}
