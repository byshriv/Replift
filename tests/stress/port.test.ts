import { expect, it } from 'vitest';
import { IDBFactory } from 'fake-indexeddb';
import { LocalRepository, openDatabase } from '../../src/data/local';
import { fixture } from '../fixtures/local';
import type { Action } from '../../src/domain/port';
import { validSet } from '../../src/domain/workout';
import { materialize } from '../../src/sync/core';
for (const seed of [404, 20261028, 0xfaceb00c])
  it(`domain persistence random actions/restarts, seed ${seed}`, async () => {
    let state = seed >>> 0;
    const random = () => {
      state = (Math.imul(state, 1664525) + 1013904223) >>> 0;
      return state / 2 ** 32;
    };
    const factory = new IDBFactory();
    let repo = new LocalRepository(await openDatabase(factory));
    const initial = fixture();
    initial.draft = null;
    initial.st = { u: 'kg', sets: 3 };
    await repo.initialize(JSON.stringify(initial));
    await repo.syncState();
    const acknowledged = new Map(
      initial.wk.map((w) => [w.id, JSON.stringify(w)]),
    );
    let finished = 0,
      restarts = 0,
      failed = 0,
      measures = 0;
    for (let n = 0; n < 800; n++) {
      const before = await repo.read(),
        d = before.data,
        pick = Math.floor(random() * 10);
      let action: Action;
      if (!d.draft)
        action = { kind: 'start', id: `draft-${seed}-${n}`, routine: 'r' };
      else if (pick < 3)
        action = {
          kind: 'setField',
          item: 0,
          set: 0,
          field: pick === 0 ? 'kg' : 'reps',
          value: random() < 0.15 ? '2.' : String(Math.floor(random() * 60) + 1),
        };
      else if (pick === 3)
        action = { kind: 'set', item: 0, set: 0, op: 'tick', id: `tick-${n}` };
      else if (pick === 4)
        action = {
          kind: 'set',
          item: 0,
          set: 0,
          op: 'duplicate',
          id: `duplicate-${n}`,
        };
      else if (pick === 5 && d.draft.items[0]!.sets.length > 1)
        action = {
          kind: 'set',
          item: 0,
          set: 1,
          op: 'delete',
          id: `delete-${n}`,
        };
      else if (pick === 6) {
        action = {
          kind: 'measure',
          name: 'Waist',
          id: `measure-${n}`,
          time: 10000 + n,
          value: String(50 + Math.floor(random() * 30)),
        };
      } else if (pick === 7)
        action = {
          kind: 'finish',
          now: 10000 + n,
          options: {
            duration: random() < 0.15 ? '' : '30',
            time: 10000 + n,
            title: `Synthetic ${n}`,
            notes: 'retained',
            difficulty: 1,
            update: true,
            allowIncomplete: true,
          },
        };
      else if (pick === 8)
        action = {
          kind: 'preference',
          group: 'pf',
          key: 'fn',
          value: `Synthetic ${n}`,
        };
      else action = { kind: 'draftMeta', key: 'notes', value: `Draft ${n}` };
      let succeeded = false;
      try {
        await repo.commit({ type: 'domain', action });
        succeeded = true;
      } catch {
        failed++;
        expect(await repo.read()).toEqual(before);
      }
      const after = await repo.read();
      if (succeeded) {
        expect(after.revision).toBe(before.revision + 1);
        expect(after.pending).toBe(before.pending + 1);
        if (action.kind === 'measure') measures++;
        if (action.kind === 'finish') {
          finished++;
          const w = after.data.wk.at(-1)!;
          acknowledged.set(w.id, JSON.stringify(w));
          expect(after.data.draft).toBeNull();
        }
      }
      for (const [id, json] of acknowledged) {
        const w = after.data.wk.find((w) => w.id === id);
        expect(w).toBeDefined();
        if (id !== 'w') expect(JSON.stringify(w)).toBe(json);
        else expect(w!.items).toEqual(initial.wk[0]!.items);
      }
      expect(after.data.wk.length).toBe(initial.wk.length + finished);
      expect(after.data.ms?.Waist?.length ?? 0).toBe(measures);
      expect(after.data.ph).toEqual(initial.ph);
      expect(after.data.unknownFutureField).toEqual(initial.unknownFutureField);
      for (const it of after.data.draft?.items ?? [])
        for (const s of it.sets)
          if (s.done) expect(validSet(s, 'kr')).toBe(true);
      expect(materialize((await repo.syncState()).doc, after.data).wk).toEqual(
        after.data.wk,
      );
      if (n % 37 === 0) {
        repo.close();
        repo = new LocalRepository(await openDatabase(factory));
        expect(await repo.read()).toEqual(after);
        restarts++;
      }
    }
    expect(finished).toBeGreaterThan(5);
    expect(restarts).toBe(22);
    expect(failed).toBeGreaterThan(0);
    repo.close();
  }, 120000);
