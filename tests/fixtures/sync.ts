import { IDBFactory } from 'fake-indexeddb';
import { LocalRepository, openDatabase } from '../../src/data/local';
import type { Connection } from '../../src/data/local';
import { ProviderError } from '../../src/sync/dropbox';
import type { Provider, Remote } from '../../src/sync/dropbox';
import { SyncEngine } from '../../src/sync/engine';
import { fixture } from './local';

export class FakeDropbox implements Provider {
  files = new Map<string, Remote>();
  requests: { path: string; rev: string | null }[] = [];
  counter = 0;
  beforeUpload: (() => Promise<void>) | undefined;
  fail: Error | undefined;
  loseResponse = false;
  async download(path: string, signal: AbortSignal) {
    signal.throwIfAborted();
    if (this.fail) throw this.fail;
    return structuredClone(this.files.get(path) ?? null);
  }
  async upload(
    path: string,
    body: string,
    rev: string | null,
    signal: AbortSignal,
  ) {
    signal.throwIfAborted();
    if (this.fail) throw this.fail;
    const hook = this.beforeUpload;
    this.beforeUpload = undefined;
    await hook?.();
    signal.throwIfAborted();
    this.requests.push({ path, rev });
    const prior = this.files.get(path);
    if ((prior?.rev ?? null) !== rev)
      throw new ProviderError('race', 'Synthetic revision race');
    const next = `rev-${++this.counter}`;
    this.files.set(path, { body, rev: next });
    if (this.loseResponse) {
      this.loseResponse = false;
      throw new Error('Synthetic lost response');
    }
    return next;
  }
}
export async function device(provider = new FakeDropbox()) {
  const factory = new IDBFactory();
  const repo = new LocalRepository(await openDatabase(factory));
  const data = fixture();
  data.prog[0]!.routines[0]!.vals!.bench![0]!.id = 'set';
  const raw = JSON.stringify(data);
  await repo.initialize(raw);
  const connection: Connection = {
    account: 'synthetic-account',
    generation: crypto.randomUUID(),
    refresh: 'fake-only',
    access: 'fake-only',
    expires: Number.MAX_SAFE_INTEGER,
  };
  await repo.connect(connection, true);
  const engine = new SyncEngine(repo, provider, connection);
  return { repo, engine, connection, factory, raw, provider };
}
