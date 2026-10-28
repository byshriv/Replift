import type { LocalData } from './local';
import {
  autofill,
  exercise,
  finish,
  previous,
  recomputeRecords,
  seed,
  validSet,
} from './workout';
import { catalogue } from '../data/catalogue';
import templates from '../data/templates.json';
import { reconstruct, type Context } from './reconstruct';
type DomainAction =
  | { kind: 'backupDownloaded'; time: number }
  | {
      kind: 'draftMeta';
      key: 'dur' | 't' | 'title' | 'notes' | 'diff' | 'img' | 'originalImg';
      value: string | number;
    }
  | { kind: 'start'; id: string; routine?: string }
  | { kind: 'discard' }
  | { kind: 'editWorkout'; id: string }
  | { kind: 'deleteWorkout'; id: string }
  | {
      kind: 'workoutExercise';
      id: string;
      replace?: number;
      remove?: number;
      ids: string[];
    }
  | {
      kind: 'setField';
      item: number;
      set: number;
      field: 'kg' | 'reps';
      value: string;
    }
  | {
      kind: 'set';
      item: number;
      set: number;
      op: 'tick' | 'duplicate' | 'delete' | 'add' | 'kind' | 'rpe';
      value?: string;
      id: string;
    }
  | { kind: 'finish'; options: Parameters<typeof finish>[1]; now: number }
  | {
      kind: 'estimate';
      item: number;
      sets: number[];
      choices: number[];
      context: Context;
      now: number;
    }
  | { kind: 'note'; exercise: string; value: string }
  | {
      kind: 'preference';
      group: 'pf' | 'st' | 'ob' | 'wt';
      key: string;
      value: unknown;
    }
  | { kind: 'favourite'; id: string }
  | { kind: 'equipment'; value: string[] }
  | { kind: 'exercise'; value: LocalData['ex'][number] }
  | { kind: 'deleteExercise'; id: string }
  | { kind: 'template'; index: number; ids: string[] }
  | { kind: 'deleteProgram'; id: string }
  | { kind: 'deleteRoutine'; id: string }
  | { kind: 'layout'; tab: 'home' | 'stats'; blocks: string[] }
  | {
      kind: 'measure';
      name: string;
      value: string;
      time: number;
      id: string;
      remove?: string;
    }
  | { kind: 'customMeasure'; name: string }
  | {
      kind: 'photo';
      id: string;
      time: number;
      image: string;
      original?: string;
      remove?: boolean;
    };
export type Action = DomainAction & {
  draftId?: string;
  itemId?: string;
  setId?: string;
  setIds?: string[];
};
export function draftTarget(
  d: LocalData,
  item?: number,
  set?: number,
): Pick<Action, 'draftId' | 'itemId' | 'setId'> {
  const draft = d.draft;
  if (!draft) return {};
  const draftId = String(draft.id ?? '');
  return {
    draftId,
    ...(item === undefined
      ? {}
      : { itemId: String(draft.items[item]?.id ?? `${draftId}:item:${item}`) }),
    ...(set === undefined
      ? {}
      : {
          setId: String(
            draft.items[item!]?.sets[set]?.id ??
              `${draftId}:item:${item}:set:${set}`,
          ),
        }),
  };
}
export const patterns: Record<number, number[]> = {
  1: [1],
  2: [1, 4],
  3: [1, 3, 5],
  4: [1, 2, 4, 5],
  5: [1, 2, 4, 5, 6],
  6: [1, 2, 3, 4, 5, 6],
  7: [0, 1, 2, 3, 4, 5, 6],
};
// Commands are interpreted inside the existing IndexedDB transaction against its
// latest snapshot. UI callbacks never replace a stale whole application copy.
export function applyDomain(d: LocalData, a: Action) {
  if (a.draftId !== undefined && a.draftId !== d.draft?.id)
    throw new Error('The active workout changed. Reopen it before continuing.');
  if (
    d.draft &&
    [
      'setField',
      'set',
      'estimate',
      'workoutExercise',
      'draftMeta',
      'finish',
    ].includes(a.kind)
  ) {
    d.draft.items.forEach((it, i) => {
      it.id ??= `${String(d.draft!.id)}:item:${i}`;
      it.sets.forEach(
        (s, n) => (s.id ??= `${String(d.draft!.id)}:item:${i}:set:${n}`),
      );
    });
  }
  if (
    'item' in a &&
    a.itemId !== undefined &&
    d.draft?.items[a.item]?.id !== a.itemId
  )
    throw new Error('The exercise changed in another tab. Reopen it.');
  if (
    'set' in a &&
    a.setId !== undefined &&
    d.draft?.items[a.item]?.sets[a.set]?.id !== a.setId
  )
    throw new Error('The set changed in another tab. Reopen it.');
  if (a.kind === 'workoutExercise' && a.itemId !== undefined) {
    const index = a.replace ?? a.remove;
    if (index !== undefined && d.draft?.items[index]?.id !== a.itemId)
      throw new Error('The exercise changed in another tab. Reopen it.');
  }
  if (
    a.kind === 'estimate' &&
    a.setIds &&
    a.sets.some((n, i) => d.draft?.items[a.item]?.sets[n]?.id !== a.setIds![i])
  )
    throw new Error('The sets changed in another tab. Reopen reconstruction.');
  if (a.kind === 'backupDownloaded') {
    d.bk = a.time;
    return;
  }
  if (a.kind === 'draftMeta') {
    if (!d.draft) throw new Error('No active workout.');
    d.draft[a.key] = a.value;
    return;
  }
  if (a.kind === 'start') {
    if (d.draft) throw new Error('Resume or discard your current draft first.');
    const r = d.prog.flatMap((p) => p.routines).find((r) => r.id === a.routine);
    if (a.routine && !r) throw new Error('Routine unavailable.');
    let n = 0;
    const uid = () => `${a.id}:set:${n++}`;
    d.draft = {
      id: a.id,
      r: a.routine ?? null,
      title: r?.n ?? 'Workout',
      items: (r?.ex ?? [])
        .filter((id) => exercise(d, id))
        .map((id) => ({ ex: id, sets: seed(d, id, a.routine, uid) })),
    };
    return;
  }
  if (a.kind === 'discard') {
    d.draft = null;
    return;
  }
  if (a.kind === 'editWorkout') {
    if (d.draft)
      throw new Error('Resume or discard your draft before editing history.');
    const w = d.wk.find((w) => w.id === a.id);
    if (!w) throw new Error('Workout unavailable.');
    d.draft = structuredClone(w);
    return;
  }
  if (a.kind === 'deleteWorkout') {
    d.wk = d.wk.filter((w) => w.id !== a.id);
    recomputeRecords(d);
    return;
  }
  if (a.kind === 'finish') {
    finish(d, a.options, a.now);
    return;
  }
  if (a.kind === 'workoutExercise') {
    if (!d.draft) throw new Error('No active workout.');
    if (a.remove !== undefined) {
      d.draft.items.splice(a.remove, 1);
      return;
    }
    if (!exercise(d, a.id)) throw new Error('Exercise unavailable.');
    let n = 0;
    const sets = seed(d, a.id, d.draft.r, () => a.ids[n++]!);
    if (sets.some((s) => !s.id)) throw new Error('Set identities unavailable.');
    const it = { id: `${a.ids[0]}:item`, ex: a.id, sets };
    if (a.replace === undefined) d.draft.items.push(it);
    else d.draft.items.splice(a.replace, 1, it);
    return;
  }
  if (a.kind === 'setField' || a.kind === 'set') {
    const item = d.draft?.items[a.item];
    if (!item) throw new Error('Workout exercise unavailable.');
    const sets = item.sets,
      s = sets[a.set];
    if (a.kind === 'setField') {
      autofill(sets, a.set, a.field, a.value);
      return;
    }
    if (a.op === 'add') {
      const last = sets.at(-1);
      sets.push({
        id: a.id,
        kg: last?.kg ?? '',
        reps: last?.reps ?? '',
        done: 0,
      });
      return;
    }
    if (!s) throw new Error('Set unavailable.');
    if (a.op === 'tick') {
      if (!s.done && !validSet(s, exercise(d, item.ex)?.t ?? 'kr'))
        throw new Error(
          'Fill the required fields with valid positive values before checking the set.',
        );
      s.done = s.done ? 0 : 1;
    }
    if (a.op === 'duplicate')
      sets.splice(a.set + 1, 0, {
        ...structuredClone(s),
        id: a.id,
        done: 0,
        pr: 0,
      });
    if (a.op === 'delete') sets.splice(a.set, 1);
    if (a.op === 'kind') {
      s.k = a.value ?? '';
      s.pr = 0;
    }
    if (a.op === 'rpe') {
      if (
        a.value !== '' &&
        (!Number.isFinite(Number(a.value)) ||
          Number(a.value) < 6 ||
          Number(a.value) > 10 ||
          (Number(a.value) * 2) % 1)
      )
        throw new Error('RPE must be 6–10 in half steps.');
      s.rpe = a.value === '' ? null : Number(a.value);
    }
    return;
  }
  if (a.kind === 'estimate') {
    const item = d.draft?.items[a.item];
    if (!item) throw new Error('Workout unavailable.');
    a.sets.forEach((n, j) => {
      if (item.sets[n]?.done)
        throw new Error('Completed sets cannot be estimated.');
      const guesses = reconstruct(d, a.item, n, a.context),
        choice = guesses[a.choices[j] ?? 0];
      if (!choice) throw new Error('Not enough weighted history to estimate.');
      Object.assign(item.sets[n]!, {
        kg: choice.weight,
        reps: choice.reps,
        est: 1,
        done: 1,
        pr: 0,
      });
      (d.pl ??= []).push({
        t: a.now,
        ex: item.ex,
        s: n,
        c: guesses.map((g) => [g.weight, g.reps, g.probability]),
        k: a.choices[j] ?? 0,
      });
    });
    d.pl = d.pl?.slice(-200);
    return;
  }
  if (a.kind === 'note') {
    (d.pin ??= {})[a.exercise] = a.value;
    return;
  }
  if (a.kind === 'preference') {
    if (a.group === 'st' && /^dbx|^ls$/i.test(a.key))
      throw new Error('Connection metadata uses private storage.');
    (d[a.group] ??= {})[a.key] = a.value;
    return;
  }
  if (a.kind === 'equipment') {
    d.have = [...new Set(a.value)];
    return;
  }
  if (a.kind === 'favourite') {
    const f = (d.fav ??= []);
    d.fav = f.includes(a.id) ? f.filter((x) => x !== a.id) : [...f, a.id];
    return;
  }
  if (a.kind === 'exercise') {
    if (catalogue.some((e) => e.id === a.value.id))
      throw new Error('Bundled exercises are read-only.');
    if (!a.value.n.trim()) throw new Error('Exercise name required.');
    const i = d.ex.findIndex((e) => e.id === a.value.id);
    if (i < 0) d.ex.push(a.value);
    else d.ex[i] = { ...d.ex[i], ...a.value };
    return;
  }
  if (a.kind === 'deleteExercise') {
    if (catalogue.some((e) => e.id === a.id))
      throw new Error('Bundled exercises are read-only.');
    d.ex = d.ex.filter((e) => e.id !== a.id);
    return;
  }
  if (a.kind === 'deleteProgram') {
    d.prog = d.prog.filter((p) => p.id !== a.id);
    return;
  }
  if (a.kind === 'deleteRoutine') {
    for (const p of d.prog)
      p.routines = p.routines.filter((r) => r.id !== a.id);
    return;
  }
  if (a.kind === 'template') {
    const t = templates[a.index];
    if (!t) throw new Error('Template unavailable.');
    let next = 0;
    const id = () => {
      const id = a.ids[next++];
      if (!id) throw new Error('Template identities unavailable.');
      return id;
    };
    d.prog.push({
      id: id(),
      n: t.n,
      routines: t.r.map(([name, list], i) => {
        const rid = id(),
          ex = list!
            .split(',')
            .map((name) => d.ex.find((e) => e.n === name)?.id);
        if (ex.some((e) => !e))
          throw new Error(
            'Template exercise unavailable. Original data retained.',
          );
        return {
          id: rid,
          n: name!,
          day: patterns[t.r.length]![i]!,
          ex: ex as string[],
          vals: Object.fromEntries(
            (ex as string[]).map((e) => [e, seed(d, e, null, id)]),
          ),
        };
      }),
    });
    return;
  }
  if (a.kind === 'layout') {
    (d.lay ??= {})[a.tab] = [...new Set(a.blocks)];
    return;
  }
  if (a.kind === 'customMeasure') {
    const name = a.name.trim();
    if (!name || ['__proto__', 'constructor', 'prototype'].includes(name))
      throw new Error('Choose a measure name.');
    d.cm = [...new Set([...(d.cm ?? []), name])];
    return;
  }
  if (a.kind === 'measure') {
    if (['__proto__', 'constructor', 'prototype'].includes(a.name))
      throw new Error('Invalid measure name.');
    const values = ((d.ms ??= {})[a.name] ??= []);
    if (a.remove) {
      const occurrences = new Map<number, number>();
      d.ms![a.name] = values.filter((v) => {
        const n = occurrences.get(v.t) ?? 0;
        occurrences.set(v.t, n + 1);
        return (v.id ?? `legacy:${v.t}:${n}`) !== a.remove;
      });
    } else {
      if (
        !/^\d+(\.\d+)?$/.test(a.value) ||
        !Number.isFinite(Number(a.value)) ||
        Number(a.value) <= 0 ||
        !Number.isFinite(a.time)
      )
        throw new Error('Choose a valid date and positive measurement.');
      values.push({ id: a.id, t: a.time, v: Number(a.value) });
      values.sort((a, b) => a.t - b.t);
    }
    return;
  }
  if (a.kind === 'photo') {
    if (a.remove) d.ph = (d.ph ?? []).filter((p) => p.id !== a.id);
    else {
      if (
        !/^data:image\/(jpeg|png|webp);base64,/.test(a.image) ||
        !Number.isFinite(a.time)
      )
        throw new Error('Choose a valid photo and date.');
      (d.ph ??= []).push({
        id: a.id,
        t: a.time,
        img: a.image,
        ...(a.original ? { originalImg: a.original } : {}),
      });
    }
    return;
  }
}
export { templates, previous };
