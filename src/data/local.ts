import { applyCommand, restoreRemoved, validateData } from '../domain/local';
import type { Command, LocalData, Removed } from '../domain/local';
import { catalogue } from './catalogue';

function emptyData(): LocalData {
  return {
    ex: catalogue.map((e) => ({
      id: e.id,
      n: e.name,
      t: e.loggingType,
      m: e.muscle,
      s: e.secondary,
      e: e.equipment,
    })),
    prog: [],
    wk: [],
    ph: [],
    ms: {},
    pf: {},
    st: { sets: 3, u: 'kg' },
  };
}

export const DATABASE = 'replift.local.v2';
const stores = ['state', 'recovery', 'pending', 'undo', 'private'] as const;
export type Snapshot = {
  schema: 2;
  data: LocalData;
  revision: number;
  device: string;
  pending: number;
  versions: Record<string, number>;
  tombstones: Record<string, number>;
};
export type UndoEntry = { id: string; removed: Removed; revision: number };
const request = <T>(r: IDBRequest<T>) =>
  new Promise<T>((resolve, reject) => {
    r.onsuccess = () => resolve(r.result);
    r.onerror = () => reject(r.error);
  });

export function openDatabase(
  factory: IDBFactory = indexedDB,
  name = DATABASE,
): Promise<IDBDatabase> {
  return new Promise((resolve, reject) => {
    const r = factory.open(name, 1);
    let blocked = false;
    r.onupgradeneeded = () =>
      stores.forEach((s) => r.result.createObjectStore(s));
    r.onerror = () => reject(r.error);
    r.onblocked = () => {
      blocked = true;
      reject(new Error('Close older Replift tabs, then retry storage.'));
    };
    r.onsuccess = () => {
      if (blocked) {
        r.result.close();
        return;
      }
      r.result.onversionchange = () => r.result.close();
      resolve(r.result);
    };
  });
}

async function transaction<T>(
  db: IDBDatabase,
  mode: IDBTransactionMode,
  work: (tx: IDBTransaction) => Promise<T>,
): Promise<T> {
  const tx = db.transaction(
    [...stores],
    mode,
    mode === 'readwrite' ? { durability: 'strict' } : undefined,
  );
  const done = new Promise<void>((resolve, reject) => {
    tx.oncomplete = () => resolve();
    tx.onabort = () => reject(tx.error ?? new Error('Local save aborted.'));
    tx.onerror = () => {};
  });
  // Attach immediately so an early abort cannot become an unhandled rejection.
  void done.catch(() => {});
  try {
    const result = await work(tx);
    await done;
    return result;
  } catch (error) {
    try {
      tx.abort();
    } catch {
      /* already completed/aborted */
    }
    await done.catch(() => {});
    throw error;
  }
}

function checkSnapshot(value: Snapshot | undefined): Snapshot {
  const clockMap = (map: unknown) =>
    !!map &&
    typeof map === 'object' &&
    !Array.isArray(map) &&
    Object.values(map).every(
      (counter) => Number.isSafeInteger(counter) && counter >= 0,
    );
  if (
    !value ||
    value.schema !== 2 ||
    !Number.isSafeInteger(value.revision) ||
    value.revision < 0 ||
    !Number.isSafeInteger(value.pending) ||
    value.pending < 0 ||
    typeof value.device !== 'string' ||
    !value.device ||
    !clockMap(value.versions) ||
    !clockMap(value.tombstones)
  )
    throw new Error(
      'Unsupported or damaged local database. Data was retained.',
    );
  validateData(value.data);
  if (
    value.data.prog.some((p) =>
      p.routines.some((r) =>
        Object.values(r.vals ?? {}).some((sets) => sets.some((s) => !s.id)),
      ),
    )
  )
    throw new Error(
      'Local set identities are damaged. Data retained; editing blocked.',
    );
  return value;
}
function assignSetIds(data: LocalData) {
  const configured = data.st?.sets;
  const count =
    typeof configured === 'number' &&
    Number.isInteger(configured) &&
    configured >= 1 &&
    configured <= 20
      ? configured
      : 3;
  for (const p of data.prog)
    for (const r of p.routines) {
      const vals = (r.vals ??= {});
      for (const exercise of r.ex)
        vals[exercise] ??= Array.from({ length: count }, () => ({
          kg: '',
          reps: '',
        }));
      for (const sets of Object.values(r.vals ?? {}))
        for (const set of sets) set.id ??= crypto.randomUUID();
    }
}

export class LocalRepository {
  constructor(private db: IDBDatabase) {}
  close() {
    this.db.close();
  }
  async initialize(raw: string | null): Promise<Snapshot> {
    // Parse before opening the transaction; no network or async crypto in an IDB transaction.
    let data: LocalData | undefined;
    let problem = false;
    try {
      data = raw === null ? emptyData() : validateData(JSON.parse(raw));
    } catch {
      problem = true;
    }
    const result = await transaction(this.db, 'readwrite', async (tx) => {
      const state = tx.objectStore('state');
      const existing = await request<Snapshot | undefined>(
        state.get('current'),
      );
      if (existing) {
        const source = await request<{ raw: string | null } | undefined>(
          tx.objectStore('recovery').get('legacy-original'),
        );
        if (!source || source.raw !== raw)
          throw new Error(
            'Legacy storage changed after migration. Both copies are retained; editing is blocked for recovery. Close the old client.',
          );
        return checkSnapshot(existing);
      }
      if (problem || !data) {
        // Keep exact invalid bytes in a private local recovery store; never reset to empty.
        const prior = await request<{ raw: string | null } | undefined>(
          tx.objectStore('recovery').get('legacy-invalid'),
        );
        if (prior && prior.raw !== raw)
          tx.objectStore('recovery').put(
            prior,
            `legacy-invalid:${crypto.randomUUID()}`,
          );
        tx.objectStore('recovery').put(
          { raw, reason: 'invalid legacy', at: Date.now() },
          'legacy-invalid',
        );
        return null;
      }
      // Compare against the source parse, independently of the validation result.
      const original: LocalData =
        raw === null ? structuredClone(data) : JSON.parse(raw);
      const credentials: Record<string, unknown> = {};
      for (const key of Object.keys(data.st ?? {})) {
        if (/^dbx/i.test(key)) {
          credentials[key] = data.st![key];
          delete data.st![key];
        }
      }
      // Verify all collections, nested values, photos and unknown fields survive normalization.
      const reconstructed = structuredClone(data);
      if (Object.keys(credentials).length)
        reconstructed.st = { ...reconstructed.st, ...credentials };
      if (!deepEqual(original, reconstructed))
        throw new Error('Migration verification failed. Original retained.');
      assignSetIds(data);
      validateData(data);
      const snapshot: Snapshot = {
        schema: 2,
        data,
        revision: 0,
        device: crypto.randomUUID(),
        pending: raw === null ? 0 : 1,
        versions: {},
        tombstones: {},
      };
      tx.objectStore('recovery').put(
        { raw, data: original, at: Date.now(), reason: 'before migration' },
        'legacy-original',
      );
      tx.objectStore('private').put(credentials, 'legacy-connection');
      if (raw !== null)
        tx.objectStore('pending').put(
          {
            id: 'migration',
            kind: 'migration',
            device: snapshot.device,
            counter: 0,
          },
          'migration',
        );
      state.put(snapshot, 'current');
      return snapshot;
    });
    if (!result)
      throw new Error(
        'Legacy data could not be validated. Original retained; editing is blocked. Keep a copy of replift.v1 for recovery.',
      );
    // Read back the committed state before enabling the editor.
    return this.read();
  }
  read(): Promise<Snapshot> {
    return transaction(this.db, 'readonly', async (tx) =>
      checkSnapshot(await request(tx.objectStore('state').get('current'))),
    );
  }
  undos(): Promise<UndoEntry[]> {
    return transaction(this.db, 'readonly', (tx) =>
      request(tx.objectStore('undo').getAll()),
    );
  }
  async commit(
    command: Command | { type: 'undo'; id: string },
  ): Promise<Snapshot> {
    return transaction(this.db, 'readwrite', async (tx) => {
      const state = tx.objectStore('state');
      const snapshot = checkSnapshot(await request(state.get('current')));
      const before = structuredClone(snapshot.data);
      let removed: Removed | undefined;
      let restoredRoutine: string | undefined;
      if (command.type === 'undo') {
        const entry = await request<UndoEntry | undefined>(
          tx.objectStore('undo').get(command.id),
        );
        if (!entry)
          throw new Error('Removal is already undone or unavailable.');
        restoreRemoved(snapshot.data, entry.removed);
        restoredRoutine = entry.removed.routine;
        tx.objectStore('undo').delete(command.id);
      } else removed = applyCommand(snapshot.data, command);
      checkSnapshot(snapshot);
      const counter = snapshot.revision + 1;
      if (!Number.isSafeInteger(counter))
        throw new Error('Local counter limit reached; data retained.');
      const id = `${snapshot.device}:${counter}`;
      const record = restoredRoutine
        ? `routine:${restoredRoutine}`
        : 'routine' in command
          ? `routine:${command.routine}`
          : 'program' in command
            ? `program:${command.program}`
            : command.type === 'program'
              ? `program:${command.id}`
              : `undo:${command.id}`;
      snapshot.revision = counter;
      snapshot.pending++;
      snapshot.versions[record] = counter;
      if (removed) {
        tx.objectStore('recovery').put(
          { data: before, at: Date.now(), reason: command.type },
          id,
        );
        tx.objectStore('undo').put(
          { id, removed, revision: counter } satisfies UndoEntry,
          id,
        );
        snapshot.tombstones[id] = counter;
      }
      if (command.type === 'undo') {
        tx.objectStore('recovery').put(
          { data: before, at: Date.now(), reason: 'before undo' },
          id,
        );
      }
      tx.objectStore('pending').put(
        {
          id,
          device: snapshot.device,
          counter,
          record,
          command,
          at: Date.now(),
        },
        id,
      );
      state.put(snapshot, 'current');
      return snapshot;
    });
  }
}

function deepEqual(a: unknown, b: unknown): boolean {
  if (Object.is(a, b)) return true;
  if (!a || !b || typeof a !== 'object' || typeof b !== 'object') return false;
  const x = Object.entries(a);
  const y = Object.entries(b);
  return (
    x.length === y.length &&
    x.every(
      ([k, v]) =>
        Object.hasOwn(b, k) && deepEqual(v, (b as Record<string, unknown>)[k]),
    )
  );
}
