import { describe, expect, it, vi, afterEach } from 'vitest';
import { IDBFactory, IDBObjectStore } from 'fake-indexeddb';
import { readFileSync } from 'node:fs';
import vm from 'node:vm';
import { fixture } from '../fixtures/local';
import {
  applyDomain,
  draftTarget,
  templates,
  patterns,
} from '../../src/domain/port';
import {
  autofill,
  finish,
  previous,
  recomputeRecords,
  validSet,
  volume,
} from '../../src/domain/workout';
import {
  calories,
  canonicalValue,
  displayValue,
  recovery,
  streak,
  weekStart,
} from '../../src/domain/metrics';
import { defaultContext, reconstruct } from '../../src/domain/reconstruct';
import { LocalRepository, openDatabase } from '../../src/data/local';
import { catalogue } from '../../src/data/catalogue';
import { materialize, merge, bootstrap } from '../../src/sync/core';
import type { LocalData } from '../../src/domain/local';

export function training(): LocalData {
  const d = fixture();
  d.st = { u: 'kg', sets: 3, fd: 1 };
  d.ex[0]!.m = 'Chest';
  d.wk = [
    {
      id: 'old',
      t: 1000,
      r: 'r',
      dur: 30,
      items: [{ ex: 'bench', sets: [{ kg: 50, reps: 10, done: 1 }] }],
    },
  ];
  d.draft = null;
  return d;
}
afterEach(() => vi.restoreAllMocks());
describe('workout domain contract', () => {
  it('validates all eight types including zero added weight and invalid raw drafts', () => {
    for (const t of ['kr', 'wb', 'wt', 'di', 'as'])
      expect(validSet({ kg: 20, reps: 8 }, t)).toBe(true);
    for (const t of ['br', 'du', 'mn'])
      expect(validSet({ reps: 8 }, t)).toBe(true);
    expect(validSet({ kg: 0, reps: 8 }, 'wb')).toBe(true);
    expect(validSet({ kg: 0, reps: 8 }, 'kr')).toBe(false);
    expect(validSet({ kg: '2.', reps: 8 }, 'kr')).toBe(false);
    expect(validSet({ kg: 2, reps: 1.5 }, 'kr')).toBe(false);
    expect(validSet({ kg: 2, reps: 1.5 }, 'wt')).toBe(true);
    expect(validSet({ kg: 2, reps: 0 }, 'di')).toBe(false);
  });
  it('uses last same-routine session, defaults, then any history without mutating it', () => {
    const d = training();
    expect(previous(d, 'bench', 'r')[0]!.kg).toBe(50);
    expect(previous(d, 'bench', 'other')[0]!.kg).toBe(50);
    d.wk[0]!.r = 'other';
    expect(previous(d, 'bench', 'r')[0]!.kg).toBe(20);
    expect(previous(d, 'missing', 'r')).toEqual([]);
  });
  it('autofills only empty/unchanged later sets and preserves independently entered values', () => {
    const sets = [
      { kg: '20', reps: 8 },
      { kg: '20', reps: 8 },
      { kg: '30', reps: 8 },
      { kg: '', reps: 8 },
      { kg: '20', reps: 8, done: 1 },
    ];
    autofill(sets, 0, 'kg', '25');
    expect(sets.map((s) => s.kg)).toEqual(['25', '25', '30', '25', '20']);
  });
  it('excludes first workout, warmup and estimates; uses a running best and recomputes edited history', () => {
    const d = training();
    d.wk[0]!.items[0]!.sets.push({ kg: 60, reps: 8, done: 1 });
    d.wk.push({
      id: 'new',
      t: 2000,
      items: [
        {
          ex: 'bench',
          sets: [
            { kg: 60, reps: 8, done: 1 },
            { kg: 65, reps: 8, done: 1 },
            { kg: 64, reps: 8, done: 1 },
            { kg: 100, reps: 20, k: 'w', done: 1 },
            { kg: 100, reps: 20, est: 1, done: 1 },
          ],
        },
      ],
    });
    recomputeRecords(d);
    expect(d.wk[0]!.items[0]!.sets.map((s) => s.pr)).toEqual([0, 0]);
    expect(d.wk[1]!.items[0]!.sets.map((s) => s.pr)).toEqual([0, 1, 0, 0, 0]);
    d.wk[0]!.items[0]!.sets[0]!.kg = 90;
    recomputeRecords(d);
    expect(d.wk[1]!.items[0]!.sets[1]!.pr).toBe(0);
  });
  it('requires duration/completed sets, clamps future dates and updates only existing default values', () => {
    const d = training();
    applyDomain(d, { kind: 'start', id: 'draft', routine: 'r' });
    const w = d.draft!;
    w.items[0]!.sets[0] = { kg: 55, reps: 10, done: 1 };
    const opts = {
      duration: '',
      time: 5000,
      title: 'Synthetic',
      notes: 'note',
      difficulty: 1,
      update: true,
      allowIncomplete: true,
    };
    expect(() => finish(d, opts, 3000)).toThrow('duration');
    expect(d.wk).toHaveLength(1);
    finish(d, { ...opts, duration: '30' }, 3000);
    expect(d.wk[1]!.t).toBe(3000);
    expect(d.draft).toBeNull();
    expect(d.prog[0]!.routines[0]!.vals!.bench).toHaveLength(1);
    expect(d.prog[0]!.routines[0]!.vals!.bench![0]).toMatchObject({
      kg: 55,
      reps: 10,
      custom: 'keep',
    });
    expect(d.ph).toEqual(fixture().ph);
  });
  it('warns for incomplete sets and retains raw invalid fields and draft metadata', () => {
    const d = training();
    applyDomain(d, { kind: 'start', id: 'draft' });
    applyDomain(d, {
      kind: 'workoutExercise',
      id: 'bench',
      ids: ['a', 'b', 'c'],
    });
    applyDomain(d, {
      kind: 'setField',
      item: 0,
      set: 0,
      field: 'kg',
      value: '2.',
    });
    applyDomain(d, {
      kind: 'draftMeta',
      key: 'notes',
      value: 'retain on reload',
    });
    expect(d.draft!.items[0]!.sets[0]!.kg).toBe('2.');
    expect(() =>
      applyDomain(d, { kind: 'set', item: 0, set: 0, op: 'tick', id: 'a' }),
    ).toThrow('required');
    expect(d.draft!.notes).toBe('retain on reload');
  });
  it('duplicate resets completion while preserving set metadata; delete preserves neighbours', () => {
    const d = training();
    applyDomain(d, { kind: 'start', id: 'draft', routine: 'r' });
    const original = d.draft!.items[0]!.sets[0]!;
    original.done = 1;
    original.rpe = 8;
    applyDomain(d, {
      kind: 'set',
      item: 0,
      set: 0,
      op: 'duplicate',
      id: 'duplicate',
    });
    expect(d.draft!.items[0]!.sets[1]).toMatchObject({
      done: 0,
      rpe: 8,
      id: 'duplicate',
    });
    applyDomain(d, {
      kind: 'set',
      item: 0,
      set: 0,
      op: 'delete',
      id: 'unused',
    });
    expect(d.draft!.items[0]!.sets[0]!.id).toBe('duplicate');
  });
  it('triggers the donation prompt once after fourth new workout, never history edits', () => {
    const d = training();
    for (let n = 0; n < 3; n++) {
      applyDomain(d, { kind: 'start', id: `w${n}`, routine: 'r' });
      d.draft!.items[0]!.sets[0]!.done = 1;
      finish(
        d,
        {
          duration: '20',
          time: 2000 + n,
          title: 'Workout',
          notes: '',
          difficulty: 1,
          update: false,
          allowIncomplete: true,
        },
        5000,
      );
    }
    expect(d.st).toMatchObject({ dq: 1, ds: 1 });
    d.st!.dq = 0;
    applyDomain(d, { kind: 'editWorkout', id: 'w0' });
    finish(
      d,
      {
        duration: '20',
        time: 2000,
        title: 'Edited',
        notes: '',
        difficulty: 1,
        update: false,
        allowIncomplete: true,
      },
      5000,
    );
    expect(d.st!.dq).toBe(0);
  });
});
describe('derived data and catalogue parity', () => {
  it('keeps canonical units through metric/imperial roundtrips', () => {
    const d = training();
    d.st!.u = 'lb';
    expect(Number(displayValue(d, 10, 'kg'))).toBeCloseTo(22.046, 3);
    expect(Number(canonicalValue(d, '22.046226218', 'kg'))).toBeCloseTo(10, 8);
    expect(Number(displayValue(d, 2.54, 'cm'))).toBe(1);
    expect(canonicalValue(d, '2.', 'kg')).toBe('2.');
  });
  it('uses exact MET coefficients, moderate default, and no cardio double counting', () => {
    const d = training();
    d.ms = { 'Body weight': [{ t: 0, v: 60 }] };
    const w = { id: 'cal', t: 1000, dur: 60, items: [] };
    expect(calories(d, w)).toBe(300);
    expect(calories(d, { ...w, diff: 0 })).toBe(210);
    d.ex.push({ id: 'run2', n: 'Running', t: 'mn' });
    expect(
      calories(d, {
        ...w,
        items: [{ ex: 'run2', sets: [{ reps: 30, done: 1 }] }],
      }),
    ).toBe(444);
  });
  it('clamps recovery using latest chronological session, honours week boundaries and streaks', () => {
    const d = training();
    expect(recovery(d, 'Chest', 1000 + 28 * 36e5)).toBe(100);
    expect(recovery(d, 'Chest', 1000 + 14 * 36e5)).toBe(50);
    expect(recovery(d, 'Chest', 0)).toBe(0);
    const mon = +new Date(2026, 9, 26, 12);
    d.wk[0]!.t = mon;
    expect(new Date(weekStart(mon, 1)).getDay()).toBe(1);
    expect(streak(d, mon + 7 * 864e5)).toBe(1);
    expect(streak(d, mon + 14 * 864e5)).toBe(0);
  });
  it('counts volume only for weighted types and completed non-warmup sets', () => {
    const d = training();
    const w = d.wk[0]!;
    w.items[0]!.sets.push(
      { kg: 100, reps: 10, k: 'w', done: 1 },
      { kg: 10, reps: 10, est: 1, done: 1 },
    );
    w.items.push({ ex: 'run', sets: [{ kg: 20, reps: 30, done: 1 }] });
    expect(volume(d, w)).toBe(600);
  });
  it('ports all 18 source templates with permanent exercise identities and at least two per day count', () => {
    expect(templates).toHaveLength(18);
    for (let n = 1; n <= 7; n++)
      expect(
        templates.filter((t) => t.k.includes(n)).length,
      ).toBeGreaterThanOrEqual(2);
    for (let index = 0; index < templates.length; index++) {
      const d = training();
      d.ex = catalogue.map((e) => ({ id: e.id, n: e.name, t: e.loggingType }));
      let id = 0;
      applyDomain(d, {
        kind: 'template',
        index,
        ids: Array.from({ length: 300 }, () => `id${id++}`),
      });
      const p = d.prog.at(-1)!;
      expect(p.routines.map((r) => r.day)).toEqual(patterns[p.routines.length]);
      expect(
        p.routines.every(
          (r) =>
            r.ex.length && r.ex.every((id) => d.ex.some((e) => e.id === id)),
        ),
      ).toBe(true);
    }
  });
  it('deletes legacy measurement by occurrence without changing other same-time values', () => {
    const d = training();
    d.ms = {
      Weight: [
        { t: 1, v: 10 },
        { t: 1, v: 11 },
      ],
    };
    applyDomain(d, {
      kind: 'measure',
      name: 'Weight',
      remove: 'legacy:1:1',
      id: '',
      time: 0,
      value: '',
    });
    expect(d.ms.Weight).toEqual([{ t: 1, v: 10 }]);
  });
  it('protects bundled exercises and retains history when custom records/programs are removed', () => {
    const d = training(),
      history = structuredClone(d.wk);
    expect(() =>
      applyDomain(d, { kind: 'deleteExercise', id: catalogue[0]!.id }),
    ).toThrow('read-only');
    applyDomain(d, { kind: 'deleteExercise', id: 'bench' });
    applyDomain(d, { kind: 'deleteProgram', id: 'p' });
    expect(d.wk).toEqual(history);
  });
});
describe('reconstruction oracle against sole deployed baseline', () => {
  const source = readFileSync('reference/Replift-PWA/index.html', 'utf8'),
    start = source.indexOf('function recon('),
    end = source.indexOf('\nObject.assign(A,{rec:', start),
    code = source.slice(start, end);
  for (const mode of [0, 1, 2, 3])
    it(`matches source ranking/constants, fixture ${mode}`, () => {
      const d = training();
      d.wk.push({
        id: 'older',
        t: 500,
        items: [{ ex: 'bench', sets: [{ kg: 47.5, reps: 10, done: 1 }] }],
      });
      applyDomain(d, { kind: 'start', id: 'draft', routine: 'r' });
      const context = {
        ...defaultContext,
        energy: mode % 3,
        ...(mode === 1 ? { weight: '50', rpe: 8 } : {}),
        ...(mode === 2 ? { sleep: 0, soreness: 2, rest: 2, stress: 2 } : {}),
      };
      if (mode === 3) {
        d.draft!.items[0]!.sets.push({ kg: 50, reps: 9, done: 1 });
      }
      const expected = vm.runInNewContext(
        code +
          `;recon(0,0,${JSON.stringify({ en: context.energy, sl: context.sleep, so: context.soreness, st: context.stress, rt: context.rest, wt: context.weight, rpe: context.rpe })})`,
        {
          DB: d,
          S: { s: d.draft },
          X: (id: string) => d.ex.find((e) => e.id === id),
          imp: () => false,
          FW: () => 1,
        },
      ) as { c: { w: number; r: number; p: number }[] };
      const actual = reconstruct(d, 0, 0, context);
      expect(actual).toHaveLength(4);
      actual.forEach((g, n) => {
        expect(g.weight).toBe(expected.c[n]!.w);
        expect(g.reps).toBe(expected.c[n]!.r);
        expect(g.probability).toBeCloseTo(expected.c[n]!.p, 12);
      });
    });
  it('abstains without history and excludes estimates and warmups', () => {
    const d = training();
    d.wk[0]!.items[0]!.sets[0]!.est = 1;
    applyDomain(d, { kind: 'start', id: 'draft', routine: 'r' });
    expect(reconstruct(d, 0, 0, defaultContext)).toEqual([]);
  });
});
describe('transactional integration with Phase 2/3', () => {
  it('rejects stale set menus and finish/discard from a different draft without changing saved data', async () => {
    const repo = new LocalRepository(await openDatabase(new IDBFactory()));
    await repo.initialize(JSON.stringify(training()));
    await repo.commit({
      type: 'domain',
      action: { kind: 'start', id: 'draft-a', routine: 'r' },
    });
    await repo.commit({
      type: 'domain',
      action: { kind: 'set', item: 0, set: 0, op: 'duplicate', id: 'second' },
    });
    const target = draftTarget((await repo.read()).data, 0, 0);
    await repo.commit({
      type: 'domain',
      action: {
        kind: 'set',
        item: 0,
        set: 0,
        op: 'delete',
        id: 'unused',
        ...target,
      },
    });
    const before = await repo.read();
    await expect(
      repo.commit({
        type: 'domain',
        action: {
          kind: 'setField',
          item: 0,
          set: 0,
          field: 'kg',
          value: '99',
          ...target,
        },
      }),
    ).rejects.toThrow('set changed');
    expect(await repo.read()).toEqual(before);
    await repo.commit({
      type: 'domain',
      action: { kind: 'discard', draftId: 'draft-a' },
    });
    await repo.commit({
      type: 'domain',
      action: { kind: 'start', id: 'draft-b', routine: 'r' },
    });
    const next = await repo.read();
    await expect(
      repo.commit({
        type: 'domain',
        action: { kind: 'discard', draftId: 'draft-a' },
      }),
    ).rejects.toThrow('active workout changed');
    expect(await repo.read()).toEqual(next);
    repo.close();
  });
  async function setup() {
    const factory = new IDBFactory(),
      repo = new LocalRepository(await openDatabase(factory));
    await repo.initialize(JSON.stringify(training()));
    await repo.syncState();
    return { repo, factory };
  }
  it('saves drafts through restart; finish and pending metadata sync together without modifying legacy or unrelated collections', async () => {
    const { repo, factory } = await setup();
    const before = (await repo.read()).data;
    await repo.commit({
      type: 'domain',
      action: { kind: 'start', id: 'new', routine: 'r' },
    });
    await repo.commit({
      type: 'domain',
      action: { kind: 'setField', item: 0, set: 0, field: 'kg', value: '60' },
    });
    await repo.commit({
      type: 'domain',
      action: { kind: 'set', item: 0, set: 0, op: 'tick', id: 'unused' },
    });
    repo.close();
    const reopened = new LocalRepository(await openDatabase(factory));
    expect((await reopened.read()).data.draft!.items[0]!.sets[0]).toMatchObject(
      { kg: '60', done: 1 },
    );
    await reopened.commit({
      type: 'domain',
      action: {
        kind: 'finish',
        now: 3000,
        options: {
          duration: '25',
          time: 2500,
          title: 'New',
          notes: '',
          difficulty: 1,
          update: true,
          allowIncomplete: true,
        },
      },
    });
    const after = await reopened.read();
    expect(after.data.ph).toEqual(before.ph);
    expect(after.data.ms).toEqual(before.ms);
    expect(after.data.unknownFutureField).toEqual(before.unknownFutureField);
    expect(after.pending).toBeGreaterThan(1);
    expect(
      materialize((await reopened.syncState()).doc, after.data).wk,
    ).toEqual(after.data.wk);
    expect((await reopened.recoveryPoints()).length).toBeGreaterThan(1);
    reopened.close();
  });
  it('aborts the domain mutation when recovery capture fails', async () => {
    const { repo } = await setup();
    const before = await repo.read(),
      put = IDBObjectStore.prototype.put;
    vi.spyOn(IDBObjectStore.prototype, 'put').mockImplementation(function (
      this: IDBObjectStore,
      ...args: Parameters<IDBObjectStore['put']>
    ) {
      if (this.name === 'recovery')
        throw new DOMException('Full', 'QuotaExceededError');
      return put.apply(this, args);
    });
    await expect(
      repo.commit({
        type: 'domain',
        action: { kind: 'deleteWorkout', id: 'old' },
      }),
    ).rejects.toThrow('Full');
    expect(await repo.read()).toEqual(before);
    repo.close();
  });
  it('converges independent finished workout and measurement changes through existing sync', async () => {
    const d = training(),
      base = await bootstrap(d),
      a = structuredClone(d),
      b = structuredClone(d);
    applyDomain(a, {
      kind: 'measure',
      name: 'Waist',
      id: 'm',
      value: '80',
      time: 3000,
    });
    applyDomain(b, { kind: 'start', id: 'new', routine: 'r' });
    b.draft!.items[0]!.sets[0]!.done = 1;
    finish(
      b,
      {
        duration: '20',
        time: 3000,
        title: 'New',
        notes: '',
        difficulty: 1,
        update: false,
        allowIncomplete: true,
      },
      3000,
    );
    const { update } = await import('../../src/sync/core');
    const merged = materialize(
      merge(update(base, a, 'a', d), update(base, b, 'b', d)),
      d,
    );
    expect(merged.wk).toHaveLength(2);
    expect(merged.ms!.Waist![0]!.v).toBe(80);
  });
  it('guards local erasure by revision and never modifies another database', async () => {
    const { repo, factory } = await setup();
    const other = await openDatabase(factory, 'unrelated');
    const second = new LocalRepository(other);
    await second.initialize(JSON.stringify(training()));
    await expect(repo.eraseDevice(-1)).rejects.toThrow('changed');
    expect((await repo.read()).data.wk).toHaveLength(1);
    await repo.eraseDevice((await repo.read()).revision);
    await expect(repo.read()).rejects.toThrow();
    expect((await second.read()).data.wk).toHaveLength(1);
    repo.close();
    second.close();
  });
});
