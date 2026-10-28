import { IDBFactory, IDBObjectStore } from 'fake-indexeddb';
import { afterEach, describe, expect, it, vi } from 'vitest';
import { LocalRepository, openDatabase } from '../../src/data/local';
import {
  applyCommand,
  fieldLabels,
  validValue,
  validateData,
} from '../../src/domain/local';
import { fixture } from '../fixtures/local';

afterEach(() => vi.restoreAllMocks());
async function setup(raw: string | null = JSON.stringify(fixture())) {
  const factory = new IDBFactory();
  const db = await openDatabase(factory);
  const repo = new LocalRepository(db);
  const snapshot = await repo.initialize(raw);
  return { factory, db, repo, snapshot };
}
function read(db: IDBDatabase, store: string, key: IDBValidKey) {
  return new Promise<unknown>((resolve, reject) => {
    const r = db.transaction(store).objectStore(store).get(key);
    r.onsuccess = () => resolve(r.result);
    r.onerror = () => reject(r.error);
  });
}
describe('non-destructive legacy migration', () => {
  it('initializes absent routine defaults without replacing explicit empty sets or history', async () => {
    const data = fixture();
    data.prog[0]!.routines[0]!.ex.push('run');
    const { snapshot } = await setup(JSON.stringify(data));
    expect(snapshot.data.prog[0]!.routines[0]!.vals!.run).toHaveLength(3);
    expect(snapshot.data.wk).toEqual(data.wk);
    data.prog[0]!.routines[0]!.vals!.run = [];
    expect(
      (await setup(JSON.stringify(data))).snapshot.data.prog[0]!.routines[0]!
        .vals!.run,
    ).toEqual([]);
  });
  it('preserves every collection, photo bytes and unknown field; assigns only routine set IDs', async () => {
    const original = fixture();
    const raw = JSON.stringify(original);
    const { repo, db, snapshot, factory } = await setup(raw);
    const normalized = structuredClone(snapshot.data);
    for (const p of normalized.prog)
      for (const r of p.routines)
        for (const sets of Object.values(r.vals ?? {}))
          for (const s of sets) delete s.id;
    expect(normalized).toEqual(original);
    expect(await read(db, 'recovery', 'legacy-original')).toMatchObject({
      raw,
      data: original,
    });
    expect(snapshot.pending).toBe(1);
    expect(await read(db, 'pending', 'migration')).toMatchObject({
      counter: 0,
      kind: 'migration',
    });
    repo.close();
    const reopened = new LocalRepository(await openDatabase(factory));
    expect(await reopened.initialize(raw)).toEqual(snapshot);
    reopened.close();
  });
  it('isolates legacy connection metadata from editable data, retaining its private original', async () => {
    const data = fixture();
    data.st!.dbxDirty = true;
    data.st!.dbxRev = 'synthetic-revision';
    const { snapshot, db } = await setup(JSON.stringify(data));
    expect(snapshot.data.st).toEqual(fixture().st);
    expect(await read(db, 'private', 'legacy-connection')).toEqual({
      dbxDirty: true,
      dbxRev: 'synthetic-revision',
    });
    expect(await read(db, 'recovery', 'legacy-original')).toMatchObject({
      data,
    });
  });
  for (const raw of [
    '{',
    'null',
    '{}',
    JSON.stringify({ ...fixture(), ph: [{ id: 'bad', t: 1 }] }),
    JSON.stringify({ ...fixture(), schema: 999 }),
    JSON.stringify({ ...fixture(), ms: [] }),
  ]) {
    it(`blocks and retains malformed/unsupported original (${raw.slice(0, 24)})`, async () => {
      const db = await openDatabase(new IDBFactory());
      const repo = new LocalRepository(db);
      await expect(repo.initialize(raw)).rejects.toThrow('Legacy data');
      expect(await read(db, 'state', 'current')).toBeUndefined();
      expect(await read(db, 'recovery', 'legacy-invalid')).toMatchObject({
        raw,
      });
      db.close();
    });
  }
  it('refuses duplicate identities instead of collapsing records', () => {
    const data = fixture();
    data.ex.push(data.ex[0]!);
    expect(() => validateData(data)).toThrow('Duplicate');
  });
  it('refuses changed legacy data after initial migration; both copies survive', async () => {
    const { repo, snapshot } = await setup();
    const changed = fixture();
    changed.ph!.push({ id: 'later', t: 124, img: 'new-photo-bytes' });
    await expect(repo.initialize(JSON.stringify(changed))).rejects.toThrow(
      'Legacy storage changed',
    );
    expect(await repo.read()).toEqual(snapshot);
  });
  it('does not reinterpret missing historical references or overwrite custom exercises', async () => {
    const data = fixture();
    data.wk[0]!.items[0]!.ex = 'historically-deleted';
    const { snapshot } = await setup(JSON.stringify(data));
    expect(snapshot.data.wk).toEqual(data.wk);
    expect(snapshot.data.ex).toEqual(data.ex);
  });
});
describe('atomic local changes and recovery', () => {
  it('retains the prior committed snapshot after an asynchronous transaction abort', async () => {
    const { repo, snapshot } = await setup();
    const put = IDBObjectStore.prototype.put;
    vi.spyOn(IDBObjectStore.prototype, 'put').mockImplementation(function (
      this: IDBObjectStore,
      ...args: Parameters<typeof put>
    ) {
      const result = put.apply(this, args);
      if (this.name === 'pending')
        queueMicrotask(() => this.transaction.abort());
      return result;
    });
    await expect(
      repo.commit({ type: 'removeExercise', routine: 'r', exercise: 'bench' }),
    ).rejects.toThrow();
    expect(await repo.read()).toEqual(snapshot);
    expect(await repo.undos()).toEqual([]);
  });
  it('saves incomplete raw input without marking it complete and leaves unrelated history intact', async () => {
    const { repo, snapshot } = await setup();
    const set = snapshot.data.prog[0]!.routines[0]!.vals!.bench![0]!;
    for (const value of ['', '2.', 'invalid', '-2', '20.25']) {
      const next = await repo.commit({
        type: 'field',
        routine: 'r',
        exercise: 'bench',
        set: set.id!,
        field: 'kg',
        value,
      });
      expect(next.data.prog[0]!.routines[0]!.vals!.bench![0]).toMatchObject({
        kg: value,
        custom: 'keep',
      });
      expect(next.data.wk).toEqual(snapshot.data.wk);
      expect(next.data.ph).toEqual(snapshot.data.ph);
      expect(next.data.draft).toEqual(snapshot.data.draft);
    }
    expect((await repo.read()).pending).toBe(6);
  });
  it('persists removal, tombstone, exact Undo payload and recovery across reopen', async () => {
    const { repo, db, snapshot, factory } = await setup();
    const removed = await repo.commit({
      type: 'removeExercise',
      routine: 'r',
      exercise: 'bench',
    });
    const [undo] = await repo.undos();
    expect(removed.data.prog[0]!.routines[0]!.ex).toEqual([]);
    expect(Object.keys(removed.tombstones)).toEqual([undo!.id]);
    expect(await read(db, 'recovery', undo!.id)).toMatchObject({
      data: snapshot.data,
    });
    repo.close();
    const reopened = new LocalRepository(await openDatabase(factory));
    await reopened.initialize(JSON.stringify(fixture()));
    const restored = await reopened.commit({ type: 'undo', id: undo!.id });
    expect(restored.data).toEqual(snapshot.data);
    expect(await reopened.undos()).toEqual([]);
    await expect(
      reopened.commit({ type: 'undo', id: undo!.id }),
    ).rejects.toThrow('already undone');
  });
  it('Undo refuses to replace newly added values', async () => {
    const { repo } = await setup();
    await repo.commit({
      type: 'removeExercise',
      routine: 'r',
      exercise: 'bench',
    });
    const [undo] = await repo.undos();
    const added = await repo.commit({
      type: 'select',
      routine: 'r',
      exercise: 'bench',
      ids: ['new-set'],
    });
    await expect(repo.commit({ type: 'undo', id: undo!.id })).rejects.toThrow(
      'added again',
    );
    expect(await repo.read()).toEqual(added);
    expect(await repo.undos()).toHaveLength(1);
  });
  it('removes and restores a set by identity, preserving values and metadata', async () => {
    const { repo, snapshot } = await setup();
    const set = snapshot.data.prog[0]!.routines[0]!.vals!.bench![0]!;
    await repo.commit({
      type: 'removeSet',
      routine: 'r',
      exercise: 'bench',
      set: set.id!,
    });
    await repo.commit({
      type: 'addSet',
      routine: 'r',
      exercise: 'bench',
      id: 'new',
    });
    const [undo] = await repo.undos();
    const next = await repo.commit({ type: 'undo', id: undo!.id });
    expect(next.data.prog[0]!.routines[0]!.vals!.bench).toEqual([
      set,
      { id: 'new', kg: '', reps: '' },
    ]);
  });
  for (const store of ['state', 'pending', 'recovery', 'undo']) {
    it(`aborts all writes when ${store} fails (simulated quota)`, async () => {
      const { repo, snapshot, db } = await setup();
      const put = IDBObjectStore.prototype.put;
      vi.spyOn(IDBObjectStore.prototype, 'put').mockImplementation(function (
        this: IDBObjectStore,
        ...args: Parameters<typeof put>
      ) {
        if (this.name === store)
          throw new DOMException(
            'Simulated full storage',
            'QuotaExceededError',
          );
        return put.apply(this, args);
      });
      await expect(
        repo.commit({
          type: 'removeExercise',
          routine: 'r',
          exercise: 'bench',
        }),
      ).rejects.toThrow();
      expect(await repo.read()).toEqual(snapshot);
      expect(await repo.undos()).toEqual([]);
      expect(await read(db, 'pending', `${snapshot.device}:1`)).toBeUndefined();
      expect(
        await read(db, 'recovery', `${snapshot.device}:1`),
      ).toBeUndefined();
    });
  }
  it('migration failure leaves no partial state and succeeds on retry', async () => {
    const db = await openDatabase(new IDBFactory());
    const repo = new LocalRepository(db);
    const put = IDBObjectStore.prototype.put;
    const spy = vi
      .spyOn(IDBObjectStore.prototype, 'put')
      .mockImplementation(function (
        this: IDBObjectStore,
        ...args: Parameters<typeof put>
      ) {
        if (this.name === 'state')
          throw new DOMException('Simulated quota', 'QuotaExceededError');
        return put.apply(this, args);
      });
    await expect(repo.initialize(JSON.stringify(fixture()))).rejects.toThrow();
    expect(await read(db, 'recovery', 'legacy-original')).toBeUndefined();
    expect(await read(db, 'state', 'current')).toBeUndefined();
    spy.mockRestore();
    expect((await repo.initialize(JSON.stringify(fixture()))).data.wk).toEqual(
      fixture().wk,
    );
  });
  it('serializes concurrent tab writes against fresh state without losing either edit', async () => {
    const { repo, factory } = await setup();
    const other = new LocalRepository(await openDatabase(factory));
    await Promise.all([
      repo.commit({ type: 'name', program: 'p', value: 'Changed' }),
      other.commit({ type: 'day', routine: 'r', value: 5 }),
    ]);
    const next = await repo.read();
    expect(next.data.prog[0]!.n).toBe('Changed');
    expect(next.data.prog[0]!.routines[0]!.day).toBe(5);
    expect(next.revision).toBe(2);
    expect(next.pending).toBe(3);
  });
  it('blocks unknown stored schema without erasing it', async () => {
    const { repo, db, snapshot } = await setup();
    await new Promise<void>((resolve) => {
      const tx = db.transaction('state', 'readwrite');
      tx.objectStore('state').put({ ...snapshot, schema: 999 }, 'current');
      tx.oncomplete = () => resolve();
    });
    await expect(repo.read()).rejects.toThrow('Unsupported');
    expect(await read(db, 'state', 'current')).toMatchObject({ schema: 999 });
  });
  it('blocks damaged version maps or missing set identities without mutation', async () => {
    for (const corrupt of ['clock', 'set']) {
      const { repo, db, snapshot } = await setup();
      if (corrupt === 'clock') snapshot.versions.r = -1;
      else delete snapshot.data.prog[0]!.routines[0]!.vals!.bench![0]!.id;
      await new Promise<void>((resolve) => {
        const tx = db.transaction('state', 'readwrite');
        tx.objectStore('state').put(snapshot, 'current');
        tx.oncomplete = () => resolve();
      });
      await expect(
        repo.commit({ type: 'name', program: 'p', value: 'must not save' }),
      ).rejects.toThrow();
      expect(await read(db, 'state', 'current')).toEqual(snapshot);
    }
  });
});
it('maps all eight logging types and validates incomplete values conservatively', () => {
  expect(
    ['kr', 'br', 'du', 'mn', 'di', 'wb', 'wt', 'as'].map(fieldLabels),
  ).toEqual([
    ['kg', 'reps'],
    [null, 'reps'],
    [null, 'seconds'],
    [null, 'minutes'],
    ['km', 'minutes'],
    ['kg', 'reps'],
    ['kg', 'seconds'],
    ['kg', 'reps'],
  ]);
  for (const value of ['', '2.', '.', '-1', '1e3', 'NaN', 'Infinity'])
    expect(validValue(value)).toBe(false);
  expect(validValue('20.5')).toBe(true);
  expect(validValue('20.5', true)).toBe(false);
  const data = fixture();
  expect(() =>
    applyCommand(data, { type: 'day', routine: 'missing', value: 1 }),
  ).toThrow();
});
