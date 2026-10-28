import { IDBFactory, IDBObjectStore } from 'fake-indexeddb';
import { expect, it, vi } from 'vitest';
import { LocalRepository, openDatabase } from '../../src/data/local';
import type { Command } from '../../src/domain/local';
import { fixture } from '../fixtures/local';

for (const seed of [42, 20261028, 0xdecafbad]) {
  it(`preserves edits and unrelated data through 400 transactions/restarts/failures; seed=${seed}`, async () => {
    let random = seed >>> 0;
    const next = () =>
      (random = (Math.imul(random, 1664525) + 1013904223) >>> 0);
    const factory = new IDBFactory();
    let repo = new LocalRepository(await openDatabase(factory));
    const raw = JSON.stringify(fixture());
    const first = await repo.initialize(raw);
    const id = first.data.prog[0]!.routines[0]!.vals!.bench![0]!.id!;
    let revision = 0,
      program = 'Synthetic program',
      routine = 'Routine',
      day = 1;
    let weight: string | number = 20,
      reps: string | number = '8',
      run = false;
    for (let step = 0; step < 400; step++) {
      const kind = next() % 10;
      const value = ['', '2.', 'n/a', '50.5', '8'][next() % 5]!;
      let command: Command | undefined;
      if (kind === 0) {
        program = `Program ${step}`;
        command = { type: 'name', program: 'p', value: program };
      }
      if (kind === 1) {
        routine = `Routine ${step}`;
        command = { type: 'name', program: 'p', routine: 'r', value: routine };
      }
      if (kind === 2) {
        day = next() % 7;
        command = { type: 'day', routine: 'r', value: day };
      }
      if (kind === 3) {
        weight = value;
        command = {
          type: 'field',
          routine: 'r',
          exercise: 'bench',
          set: id,
          field: 'kg',
          value,
        };
      }
      if (kind === 4) {
        reps = value;
        command = {
          type: 'field',
          routine: 'r',
          exercise: 'bench',
          set: id,
          field: 'reps',
          value,
        };
      }
      if (kind === 5 && !run) {
        run = true;
        command = {
          type: 'select',
          routine: 'r',
          exercise: 'run',
          ids: [`run-${step}`],
        };
      }
      if (kind === 6 && run) {
        run = false;
        command = { type: 'removeExercise', routine: 'r', exercise: 'run' };
      }
      if (command) {
        await repo.commit(command);
        revision++;
      }
      if (kind === 7 && !run) {
        const entries = await repo.undos();
        if (entries.length) {
          await repo.commit({ type: 'undo', id: entries[0]!.id });
          revision++;
          run = true;
        }
      }
      if (kind === 8) {
        repo.close();
        repo = new LocalRepository(await openDatabase(factory));
        await repo.initialize(raw);
      }
      if (kind === 9) {
        const before = await repo.read();
        const original = IDBObjectStore.prototype.put;
        const spy = vi
          .spyOn(IDBObjectStore.prototype, 'put')
          .mockImplementation(function (
            this: IDBObjectStore,
            ...args: Parameters<typeof original>
          ) {
            if (this.name === 'pending')
              throw new DOMException('Seeded quota', 'QuotaExceededError');
            return original.apply(this, args);
          });
        await expect(
          repo.commit({
            type: 'name',
            program: 'p',
            value: 'must never appear',
          }),
        ).rejects.toThrow();
        spy.mockRestore();
        expect(await repo.read()).toEqual(before);
      }
      const state = await repo.read();
      const p = state.data.prog[0]!,
        r = p.routines[0]!;
      expect(
        {
          program: p.n,
          routine: r.n,
          day: r.day,
          weight: r.vals!.bench![0]!.kg,
          reps: r.vals!.bench![0]!.reps,
          run: r.ex.includes('run'),
        },
        `seed=${seed} step=${step}`,
      ).toEqual({ program, routine, day, weight, reps, run });
      expect(r.ex).toEqual(run ? ['bench', 'run'] : ['bench']);
      expect(state.revision).toBe(revision);
      expect(state.pending).toBe(revision + 1);
      for (const key of [
        'wk',
        'ph',
        'ms',
        'cm',
        'draft',
        'pin',
        'fav',
        'have',
        'st',
        'lay',
        'pf',
        'ob',
        'wt',
        'bk',
        'pl',
        'ex',
        'unknownFutureField',
      ] as const)
        expect(state.data[key], `preserve ${key} at ${step}`).toEqual(
          first.data[key],
        );
    }
    repo.close();
  });
}
