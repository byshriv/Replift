import { afterEach, describe, expect, it, vi } from 'vitest';
import { IDBObjectStore } from 'fake-indexeddb';
import { device, FakeDropbox } from '../fixtures/sync';
import { fixture } from '../fixtures/local';
import {
  canonical,
  legacyCloud,
  materialize,
  merge,
  parseDocument,
  resolve,
  update,
} from '../../src/sync/core';
import {
  CLOUD_PATH,
  LEGACY_PATH,
  ProviderError,
  DropboxProvider,
  beginOAuth,
  finishOAuth,
} from '../../src/sync/dropbox';
import { LegacyReview, Scheduler, SyncEngine } from '../../src/sync/engine';
import { LocalRepository, openDatabase } from '../../src/data/local';

afterEach(() => {
  vi.restoreAllMocks();
  vi.unstubAllGlobals();
  vi.useRealTimers();
});
describe('causal records and retained alternatives', () => {
  it('roundtrips collections, ordering, unknown fields and coupled routine values', () => {
    const data = legacyCloud({ schema: 1, app: 'Replift', data: fixture() });
    data.prog.push({ id: 'aaa', n: 'Second', routines: [] });
    const doc = update(undefined, data, 'A');
    const restored = materialize(parseDocument(doc), data);
    expect(restored.prog).toEqual(data.prog);
    expect(restored.ex).toEqual(data.ex);
    expect(restored.wk).toEqual(data.wk);
    expect(restored.ph).toEqual(data.ph);
    expect(restored.unknownFutureField).toEqual(data.unknownFutureField);
    expect(restored.draft).toEqual(data.draft);
    expect(doc.records['["root","draft"]']).toBeUndefined();
  });
  it('merges independent program/routine edits and retains concurrent coupled fields', () => {
    const data = legacyCloud({ schema: 1, app: 'Replift', data: fixture() });
    const base = update(undefined, data, 'base');
    const a = structuredClone(data),
      b = structuredClone(data);
    a.prog[0]!.n = 'Program A';
    b.prog[0]!.routines[0]!.day = 5;
    const combined = merge(update(base, a, 'A'), update(base, b, 'B'));
    expect(materialize(combined, data).prog[0]).toMatchObject({
      n: 'Program A',
      routines: [{ day: 5 }],
    });
    a.prog[0]!.routines[0]!.vals!.bench![0]!.kg = 50;
    b.prog[0]!.routines[0]!.vals!.bench![0]!.reps = 3;
    const conflict = merge(update(base, a, 'A'), update(base, b, 'B'));
    expect(conflict.records['["routine","r"]']).toHaveLength(2);
    expect(canonical(merge(conflict, conflict))).toBe(canonical(conflict));
    const versions = conflict.records['["routine","r"]']!;
    const resolved = resolve(
      conflict,
      '["routine","r"]',
      canonical(versions),
      1,
      'C',
    );
    expect(merge(resolved, conflict).records['["routine","r"]']).toHaveLength(
      1,
    );
    expect(() =>
      resolve(resolved, '["routine","r"]', canonical(versions), 0, 'C'),
    ).toThrow('changed');
  });
  it('retains delete/edit alternatives and never resurrects an acknowledged tombstone', () => {
    const data = legacyCloud({ schema: 1, app: 'Replift', data: fixture() });
    const base = update(undefined, data, 'base');
    const deleted = structuredClone(data),
      edited = structuredClone(data);
    deleted.wk = [];
    edited.wk[0]!.notes = 'Other device';
    const removal = update(base, deleted, 'A');
    expect(materialize(merge(removal, base), data).wk).toEqual([]);
    const merged = merge(removal, update(base, edited, 'B'));
    expect(merged.records['["wk","w"]']).toHaveLength(2);
    expect(merged.records['["wk","w"]']!.some((v) => v.value === null)).toBe(
      true,
    );
  });
  it('rejects unsupported format, malformed hidden alternatives, causal corruption and private fields', () => {
    const data = legacyCloud({ schema: 1, app: 'Replift', data: fixture() });
    const doc = update(undefined, data, 'A');
    expect(() => parseDocument({ ...doc, version: 999 })).toThrow();
    const bad = structuredClone(doc);
    bad.records['["wk","w"]']!.push({ clock: { B: 1 }, value: { id: 'w' } });
    expect(() => parseDocument(bad)).toThrow();
    const other = structuredClone(doc);
    other.records['["wk","w"]']![0]!.value = { bad: true };
    expect(() => merge(doc, other)).toThrow('same causal');
    const privateData = legacyCloud({
      schema: 1,
      app: 'Replift',
      data: fixture(),
    });
    privateData.custom = { access_token: 'synthetic' };
    expect(() => parseDocument(update(undefined, privateData, 'A'))).toThrow(
      'Private',
    );
  });
});

describe('fake provider / isolated devices', () => {
  it('discovers remote-only edits on a clean device and is idempotent', async () => {
    const provider = new FakeDropbox(),
      a = await device(provider),
      b = await device(provider);
    await a.engine.run();
    await b.engine.run();
    await a.engine.run();
    await a.repo.commit({ type: 'name', program: 'p', value: 'From A' });
    await a.engine.run();
    expect((await b.repo.read()).pending).toBe(0);
    await b.engine.run();
    expect((await b.repo.read()).data.prog[0]!.n).toBe('From A');
    const count = provider.requests.length;
    await b.engine.run();
    expect(provider.requests.length).toBe(count);
    expect((await b.repo.read()).pending).toBe(0);
  });
  it('converges independent edits from three offline devices in any order', async () => {
    const provider = new FakeDropbox(),
      a = await device(provider),
      b = await device(provider),
      c = await device(provider);
    for (const d of [a, b, c, a]) await d.engine.run();
    await a.repo.commit({ type: 'name', program: 'p', value: 'A' });
    await b.repo.commit({ type: 'day', routine: 'r', value: 6 });
    await c.repo.commit({ type: 'program', id: 'C' });
    for (const d of [c, b, a, c, b]) await d.engine.run();
    const states = await Promise.all([a, b, c].map((d) => d.repo.read()));
    expect(states[0]!.data.prog[0]).toMatchObject({
      n: 'A',
      routines: [{ day: 6 }],
    });
    expect(
      states.every(
        (s) => canonical(s.data.prog) === canonical(states[0]!.data.prog),
      ),
    ).toBe(true);
  });
  it('persists conflict alternatives after restart, reviews stale versions safely and syncs the decision', async () => {
    const provider = new FakeDropbox(),
      a = await device(provider),
      b = await device(provider);
    await a.engine.run();
    await b.engine.run();
    await a.engine.run();
    await a.repo.commit({ type: 'name', program: 'p', value: 'A' });
    await b.repo.commit({ type: 'name', program: 'p', value: 'B' });
    await a.engine.run();
    await b.engine.run();
    b.repo.close();
    const reopened = new LocalRepository(await openDatabase(b.factory));
    await reopened.initialize(b.raw);
    const doc = (await reopened.syncState()).doc,
      k = '["prog","p"]';
    expect(doc.records[k]).toHaveLength(2);
    await expect(
      reopened.commit({ type: 'name', program: 'p', value: 'unreviewed' }),
    ).rejects.toThrow('Review');
    await reopened.review(k, canonical(doc.records[k]), 1);
    await expect(
      reopened.review(k, canonical(doc.records[k]), 0),
    ).rejects.toThrow('changed');
    await new SyncEngine(reopened, provider, b.connection).run();
    await a.engine.run();
    expect((await a.repo.syncState()).doc.records[k]).toHaveLength(1);
    expect((await a.repo.recoveryPoints()).length).toBeGreaterThan(0);
  });
  it('keeps edits made during upload pending and acknowledges only the captured snapshot', async () => {
    const d = await device();
    await d.engine.run();
    await d.repo.commit({ type: 'name', program: 'p', value: 'First' });
    // Fixture photos are already immutable: intercept the metadata upload specifically.
    const upload = d.provider.upload.bind(d.provider);
    vi.spyOn(d.provider, 'upload').mockImplementation(
      async (path, body, rev, signal) => {
        if (path === CLOUD_PATH)
          await d.repo.commit({ type: 'day', routine: 'r', value: 4 });
        return upload(path, body, rev, signal);
      },
    );
    await d.engine.run();
    expect((await d.repo.read()).pending).toBeGreaterThan(0);
    expect(canonical((await d.repo.syncState()).acknowledged)).not.toBe(
      canonical((await d.repo.syncState()).doc),
    );
    vi.restoreAllMocks();
    await d.engine.run();
    expect((await d.repo.read()).pending).toBe(0);
  });
  it('retries revision races and lost upload responses without duplicate records', async () => {
    const provider = new FakeDropbox(),
      a = await device(provider),
      b = await device(provider);
    await a.engine.run();
    await b.engine.run();
    await a.engine.run();
    await a.repo.commit({ type: 'name', program: 'p', value: 'Race A' });
    await b.repo.commit({ type: 'day', routine: 'r', value: 4 });
    const upload = provider.upload.bind(provider);
    let raced = false;
    vi.spyOn(provider, 'upload').mockImplementation(
      async (path, body, rev, signal) => {
        if (path === CLOUD_PATH && !raced) {
          raced = true;
          await b.engine.run();
        }
        return upload(path, body, rev, signal);
      },
    );
    await a.engine.run();
    vi.restoreAllMocks();
    expect((await a.repo.read()).data.prog[0]).toMatchObject({
      n: 'Race A',
      routines: [{ day: 4 }],
    });
    await a.repo.commit({ type: 'program', id: 'lost' });
    // Only lose the metadata response.
    vi.spyOn(provider, 'upload').mockImplementation(
      async (path, body, rev, signal) => {
        if (path === CLOUD_PATH) provider.loseResponse = true;
        return upload(path, body, rev, signal);
      },
    );
    await expect(a.engine.run()).rejects.toThrow('lost response');
    expect((await a.repo.read()).pending).toBeGreaterThan(0);
    vi.restoreAllMocks();
    await a.engine.run();
    expect(
      (await a.repo.read()).data.prog.filter((p) => p.id === 'lost'),
    ).toHaveLength(1);
    expect((await a.repo.read()).pending).toBe(0);
  });
  it('stages legacy migration, never overwrites the original, detects old-client changes', async () => {
    const d = await device();
    const body = JSON.stringify({ schema: 1, app: 'Replift', data: fixture() });
    d.provider.files.set(LEGACY_PATH, { body, rev: 'legacy-1' });
    await expect(d.engine.run()).rejects.toBeInstanceOf(LegacyReview);
    expect(d.provider.files.has(CLOUD_PATH)).toBe(false);
    await d.repo.privateWrite(
      `legacy-approved:${d.connection.account}`,
      'legacy-1',
    );
    await d.engine.run();
    expect(d.provider.files.get(LEGACY_PATH)).toEqual({
      body,
      rev: 'legacy-1',
    });
    expect(
      parseDocument(JSON.parse(d.provider.files.get(CLOUD_PATH)!.body)).legacy,
    ).toEqual(['legacy-1']);
    d.provider.files.set(LEGACY_PATH, { body, rev: 'legacy-2' });
    await expect(d.engine.run()).rejects.toBeInstanceOf(LegacyReview);
    expect(
      await d.repo.privateRead(`legacy-stage:${d.connection.account}`),
    ).toMatchObject({ rev: 'legacy-2' });
  });
  it.each(['auth', 'rate', 'network'] as const)(
    'preserves pending changes after %s failures and retries after restart',
    async (kind) => {
      const d = await device();
      d.provider.fail = new ProviderError(kind, 'synthetic failure');
      await expect(d.engine.run()).rejects.toThrow();
      expect((await d.repo.read()).pending).toBeGreaterThan(0);
      d.repo.close();
      const repo = new LocalRepository(await openDatabase(d.factory));
      await repo.initialize(d.raw);
      d.provider.fail = undefined;
      await new SyncEngine(repo, d.provider, d.connection).run();
      expect((await repo.read()).pending).toBe(0);
    },
  );
  it('blocks corrupt/incompatible cloud without mutating local data', async () => {
    for (const body of ['{', JSON.stringify({ version: 999 })]) {
      const d = await device(),
        before = await d.repo.read();
      d.provider.files.set(CLOUD_PATH, { body, rev: 'bad' });
      await expect(d.engine.run()).rejects.toThrow();
      expect(await d.repo.read()).toEqual(before);
    }
  });
  it('cancels stale callbacks after disconnect/account switch and requires account approval', async () => {
    const d = await device();
    await d.engine.run();
    await d.repo.commit({ type: 'name', program: 'p', value: 'Pending' });
    const upload = d.provider.upload.bind(d.provider);
    vi.spyOn(d.provider, 'upload').mockImplementation(
      async (path, body, rev, signal) => {
        if (path === CLOUD_PATH) await d.repo.disconnect();
        return upload(path, body, rev, signal);
      },
    );
    await expect(d.engine.run()).rejects.toThrow('Connection changed');
    expect((await d.repo.read()).pending).toBeGreaterThan(0);
    const next = {
      ...d.connection,
      account: 'different-account',
      generation: 'next',
    };
    await expect(d.repo.connect(next, false)).rejects.toThrow('Review');
    await d.repo.connect(next, true);
    expect((await d.repo.syncState()).acknowledged).toBeNull();
    await expect(d.engine.run()).rejects.toThrow('Connection changed');
    expect((await d.repo.read()).data.prog[0]!.n).toBe('Pending');
  });
  it('keeps photos durable through interruption, hydrates another device and exports every byte', async () => {
    const provider = new FakeDropbox(),
      a = await device(provider),
      b = await device(provider);
    provider.loseResponse = true;
    await expect(a.engine.run()).rejects.toThrow();
    const partial = parseDocument(
      JSON.parse(provider.files.get(CLOUD_PATH)!.body),
    );
    expect(partial.records['["ph","photo"]']).toBeUndefined();
    expect(provider.files.get(CLOUD_PATH)!.body).not.toContain(
      'replift-photo:',
    );
    expect((await a.repo.read()).data.ph).toEqual(fixture().ph);
    await a.engine.run();
    await b.engine.run();
    const wire = provider.files.get(CLOUD_PATH)!.body;
    expect(wire).toContain('replift-photo:');
    expect(wire).not.toContain('data:image/');
    expect((await b.repo.read()).data.ph).toEqual(fixture().ph);
    const backup = JSON.parse(await b.repo.backup()) as { data: unknown };
    expect(backup.data).toMatchObject({ ph: fixture().ph });
    expect(JSON.stringify(backup)).not.toMatch(
      /fake-only|synthetic-account|refresh|access_token/,
    );
  });
  it.each(['recovery', 'state'])(
    'aborts sync apply/ack when %s persistence fails',
    async (store) => {
      const d = await device(),
        before = await d.repo.read();
      const put = IDBObjectStore.prototype.put;
      vi.spyOn(IDBObjectStore.prototype, 'put').mockImplementation(function (
        this: IDBObjectStore,
        ...args: Parameters<typeof put>
      ) {
        if (this.name === store) throw new Error('synthetic quota');
        return put.apply(this, args);
      });
      await expect(d.engine.run()).rejects.toThrow();
      expect(await d.repo.read()).toEqual(before);
      expect(d.provider.files.has(CLOUD_PATH)).toBe(false);
    },
  );
  it('does not report a committed success when cloud ack succeeds but local ack fails', async () => {
    const d = await device();
    const upload = d.provider.upload.bind(d.provider),
      apply = d.repo.applySync.bind(d.repo);
    let cloudWritten = false;
    vi.spyOn(d.provider, 'upload').mockImplementation(async (...args) => {
      const result = await upload(...args);
      if (args[0] === CLOUD_PATH) cloudWritten = true;
      return result;
    });
    vi.spyOn(d.repo, 'applySync').mockImplementation(async (...args) => {
      if (cloudWritten && args[2]) throw new Error('ack quota');
      return apply(...args);
    });
    await expect(d.engine.run()).rejects.toThrow('ack quota');
    expect((await d.repo.read()).pending).toBeGreaterThan(0);
    vi.restoreAllMocks();
    await d.engine.run();
    expect((await d.repo.read()).pending).toBe(0);
  });
  it('restores an old backup as new intent, snapshots before replacement, refuses stale previews', async () => {
    const d = await device();
    await d.engine.run();
    const old = (await d.repo.read()).data;
    await d.repo.commit({ type: 'name', program: 'p', value: 'New' });
    const current = await d.repo.read();
    await expect(d.repo.restore(old, current.revision - 1)).rejects.toThrow(
      'changed',
    );
    await d.repo.restore(old, current.revision);
    expect(
      (await d.repo.recoveryPoints()).some(
        (p) =>
          p.reason === 'before backup restore' && p.data?.prog[0]!.n === 'New',
      ),
    ).toBe(true);
    await d.engine.run();
    expect((await d.repo.read()).data.prog[0]!.n).toBe(old.prog[0]!.n);
  });
});

describe('Dropbox HTTP/OAuth and scheduling contract', () => {
  it('uses strict create/update, refreshes expired credentials and distinguishes missing from permission errors', async () => {
    const d = await device();
    await d.repo.saveCredentials({ ...d.connection, expires: 0 });
    const calls: { url: string; init: RequestInit }[] = [];
    vi.stubGlobal(
      'fetch',
      vi.fn(async (url: string, init: RequestInit) => {
        calls.push({ url, init });
        if (url.endsWith('/oauth2/token'))
          return Response.json({
            access_token: 'synthetic-new',
            expires_in: 3600,
          });
        if (url.endsWith('/files/download'))
          return Response.json(
            { error_summary: 'path/not_found/...' },
            { status: 409 },
          );
        return Response.json({ rev: 'synthetic-rev' });
      }),
    );
    const provider = new DropboxProvider(d.repo, {
      ...d.connection,
      expires: 0,
    });
    const signal = new AbortController().signal;
    expect(await provider.download(CLOUD_PATH, signal)).toBeNull();
    await provider.upload(CLOUD_PATH, '{}', null, signal);
    await provider.upload(CLOUD_PATH, '{}', 'rev-old', signal);
    const args = calls
      .filter((c) => c.url.endsWith('/files/upload'))
      .map(
        (c) =>
          JSON.parse(
            (c.init.headers as Record<string, string>)['Dropbox-API-Arg']!,
          ) as Record<string, unknown>,
      );
    expect(args).toMatchObject([
      { mode: { '.tag': 'add' }, strict_conflict: true, autorename: false },
      { mode: { '.tag': 'update', update: 'rev-old' } },
    ]);
    expect(calls.filter((c) => c.url.endsWith('/oauth2/token'))).toHaveLength(
      1,
    );
    vi.stubGlobal(
      'fetch',
      vi.fn(async () =>
        Response.json(
          { error_summary: 'path/restricted_content/...' },
          { status: 409 },
        ),
      ),
    );
    await expect(provider.download(CLOUD_PATH, signal)).rejects.toThrow();
  });
  it('validates PKCE state/expiry, persists across return and consumes state once', async () => {
    const d = await device(),
      redirect = 'http://localhost/';
    const url = new URL(await beginOAuth(d.repo, redirect));
    expect(url.searchParams.get('code_challenge_method')).toBe('S256');
    expect(url.searchParams.get('client_secret')).toBeNull();
    const state = url.searchParams.get('state')!;
    await expect(
      finishOAuth(d.repo, new URL(`${redirect}?code=test&state=wrong`)),
    ).rejects.toThrow('state');
    await expect(
      finishOAuth(d.repo, new URL(`${redirect}?code=test&state=${state}`)),
    ).rejects.toThrow('state');
    const second = new URL(await beginOAuth(d.repo, redirect));
    vi.stubGlobal(
      'fetch',
      vi.fn(async (url: string) =>
        url.endsWith('/oauth2/token')
          ? Response.json({
              access_token: 'synthetic',
              refresh_token: 'synthetic-refresh',
              expires_in: 3600,
            })
          : Response.json({ account_id: 'synthetic-account' }),
      ),
    );
    const connection = await finishOAuth(
      d.repo,
      new URL(
        `${redirect}?code=test&state=${second.searchParams.get('state')}`,
      ),
    );
    expect(connection?.account).toBe('synthetic-account');
    const third = new URL(await beginOAuth(d.repo, redirect));
    vi.spyOn(Date, 'now').mockReturnValue(Date.now() + 11 * 60_000);
    await expect(
      finishOAuth(
        d.repo,
        new URL(
          `${redirect}?code=test&state=${third.searchParams.get('state')}`,
        ),
      ),
    ).rejects.toThrow('expired');
  });
  it('polls clean devices, honors retry-after and cancels scheduled work', async () => {
    vi.useFakeTimers();
    const run = vi.fn<() => Promise<void>>().mockResolvedValue(undefined),
      report = vi.fn();
    const scheduler = new Scheduler(run, report);
    scheduler.request(0);
    await vi.advanceTimersByTimeAsync(1);
    expect(run).toHaveBeenCalledTimes(1);
    await vi.advanceTimersByTimeAsync(600_000);
    expect(run).toHaveBeenCalledTimes(2);
    run.mockRejectedValueOnce(new ProviderError('rate', 'busy', 120_000));
    scheduler.request(0);
    await vi.advanceTimersByTimeAsync(1);
    await vi.advanceTimersByTimeAsync(119_000);
    expect(run).toHaveBeenCalledTimes(3);
    await vi.advanceTimersByTimeAsync(1000);
    expect(run).toHaveBeenCalledTimes(4);
    scheduler.stop();
    await vi.advanceTimersByTimeAsync(1_000_000);
    expect(run).toHaveBeenCalledTimes(4);
  });
});
