import { afterEach, expect, it, vi } from 'vitest';
import { IDBObjectStore } from 'fake-indexeddb';
import { device, FakeDropbox } from '../fixtures/sync';
import {
  canonical,
  parseDocument,
  update,
  merge,
  materialize,
  legacyCloud,
  keepBoth,
} from '../../src/sync/core';
import {
  CLOUD_PATH,
  boundedText,
  ProviderError,
  DropboxProvider,
} from '../../src/sync/dropbox';
import { SyncEngine } from '../../src/sync/engine';
import { fixture } from '../fixtures/local';

afterEach(() => {
  vi.restoreAllMocks();
  vi.unstubAllGlobals();
});
it('keeps separate measurement readings and photo versions only when semantically valid', () => {
  const data = legacyCloud({ schema: 1, app: 'Replift', data: fixture() });
  const base = update(undefined, data, 'base'),
    a = structuredClone(data),
    b = structuredClone(data);
  a.ms!['Body weight']![0]!.v = 75;
  b.ms!['Body weight']![0]!.v = 80;
  a.ph![0]!.img = 'data:image/png;base64,AQ==';
  b.ph![0]!.img = 'data:image/png;base64,Ag==';
  const merged = merge(update(base, a, 'A'), update(base, b, 'B'));
  const measure = '["measure","Body weight","legacy:123:0"]',
    photo = '["ph","photo"]';
  const both = keepBoth(
    merged,
    measure,
    canonical(merged.records[measure]),
    'C',
    ['separate-reading'],
  );
  expect(
    materialize(both, data)
      .ms!['Body weight']!.map((v) => v.v)
      .sort(),
  ).toEqual([75, 80]);
  const photos = keepBoth(both, photo, canonical(both.records[photo]), 'C', [
    'separate-photo',
  ]);
  expect(materialize(photos, data).ph).toHaveLength(2);
  expect(() =>
    keepBoth(
      photos,
      '["wk","w"]',
      canonical(photos.records['["wk","w"]']),
      'C',
      [],
    ),
  ).toThrow('only');
});
it('preserves null unknown values and unknown routine fields separately from deletion', () => {
  const data = legacyCloud({ schema: 1, app: 'Replift', data: fixture() });
  data.unknownNullable = null;
  data.prog[0]!.routines[0]!.programId = 'unknown field, preserve exactly';
  const doc = update(undefined, data, 'A');
  const restored = materialize(parseDocument(doc), data);
  expect(Object.hasOwn(restored, 'unknownNullable')).toBe(true);
  expect(restored.unknownNullable).toBeNull();
  expect(restored.prog).toEqual(data.prog);
  const deleted = structuredClone(data);
  delete deleted.unknownNullable;
  const next = update(doc, deleted, 'A', data);
  expect(Object.hasOwn(materialize(next, deleted), 'unknownNullable')).toBe(
    false,
  );
  expect(next.records['["root","unknownNullable"]']![0]!.deleted).toBe(true);
});
it('acknowledges independent metadata while photo transfers remain durably pending', async () => {
  const d = await device();
  await d.repo.commit({
    type: 'name',
    program: 'p',
    value: 'Independent metadata',
  });
  const upload = d.provider.upload.bind(d.provider);
  vi.spyOn(d.provider, 'upload').mockImplementation(async (path, ...args) => {
    if (path.includes('photos')) throw new Error('photo interrupted');
    return upload(path, ...args);
  });
  await expect(d.engine.run()).rejects.toThrow(
    'Independent metadata was acknowledged',
  );
  const partial = parseDocument(
    JSON.parse(d.provider.files.get(CLOUD_PATH)!.body),
  );
  expect(partial.records['["prog","p"]']![0]!.value).toMatchObject({
    n: 'Independent metadata',
  });
  expect(partial.records['["ph","photo"]']).toBeUndefined();
  expect((await d.repo.read()).pending).toBeGreaterThan(0);
  expect((await d.repo.read()).data.ph).toEqual(fixture().ph);
  vi.restoreAllMocks();
  await d.engine.run();
  expect((await d.repo.read()).pending).toBe(0);
});
it('retains complete backup alternatives and photo bytes on a fresh device restore', async () => {
  const provider = new FakeDropbox(),
    a = await device(provider),
    b = await device(provider);
  await a.engine.run();
  await b.engine.run();
  await a.repo.commit({ type: 'name', program: 'p', value: 'A' });
  await b.repo.commit({ type: 'name', program: 'p', value: 'B' });
  await a.engine.run();
  await b.engine.run();
  const backup = JSON.parse(await b.repo.backup()) as {
    data: ReturnType<typeof fixture>;
    document: ReturnType<typeof parseDocument>;
  };
  expect(backup.document.records['["prog","p"]']).toHaveLength(2);
  const fresh = await device();
  await fresh.repo.restore(
    backup.data,
    (await fresh.repo.read()).revision,
    backup.document,
  );
  const restored = (await fresh.repo.syncState()).doc;
  expect(restored.records['["prog","p"]']!.map((v) => v.value)).toEqual(
    backup.document.records['["prog","p"]']!.map((v) => v.value),
  );
  expect((await fresh.repo.read()).data.ph).toEqual(backup.data.ph);
  await fresh.engine.run();
  expect(
    (await fresh.repo.syncState()).doc.records['["prog","p"]'],
  ).toHaveLength(2);
});
it('refuses missing or corrupt remote photos without replacing local content', async () => {
  for (const corrupt of [false, true]) {
    const provider = new FakeDropbox(),
      a = await device(provider);
    await a.engine.run();
    const photoPath = [...provider.files.keys()].find((p) => p !== CLOUD_PATH)!;
    if (corrupt)
      provider.files.set(photoPath, {
        body: '{"source":"changed"}',
        rev: 'corrupt',
      });
    else provider.files.delete(photoPath);
    const b = await device(provider),
      before = await b.repo.read();
    await expect(b.engine.run()).rejects.toThrow(
      corrupt ? 'integrity' : 'missing',
    );
    expect(await b.repo.read()).toEqual(before);
  }
});
it('does not apply remote edits while an editor becomes active in flight', async () => {
  const provider = new FakeDropbox(),
    a = await device(provider),
    b = await device(provider);
  await a.engine.run();
  await b.engine.run();
  await a.repo.commit({ type: 'name', program: 'p', value: 'Remote' });
  await a.engine.run();
  const before = await b.repo.read();
  const engine = new SyncEngine(b.repo, provider, b.connection, () => false);
  await expect(engine.run()).rejects.toThrow('paused while editing');
  expect(await b.repo.read()).toEqual(before);
  await b.engine.run();
  expect((await b.repo.read()).data.prog[0]!.n).toBe('Remote');
});
it('serializes duplicate requests and honours cancellation', async () => {
  const d = await device();
  const first = d.engine.run();
  expect(d.engine.run()).toBe(first);
  await first;
  d.engine.cancel();
  const before = await d.repo.read();
  await expect(d.engine.run()).rejects.toThrow();
  expect(await d.repo.read()).toEqual(before);
});
it('retains pre-existing historical exercise references but blocks orphan routine/program replacements', () => {
  const data = legacyCloud({ schema: 1, app: 'Replift', data: fixture() });
  data.wk[0]!.items[0]!.ex = 'historically-deleted';
  const doc = update(undefined, data, 'A');
  expect(materialize(doc, data).wk).toEqual(data.wk);
  const broken = structuredClone(doc);
  broken.records['["prog","p"]'] = [
    { value: null, deleted: true, clock: { B: 2 } },
  ];
  expect(() => materialize(broken, data)).toThrow('no program');
});
it('keeps measurement identities through edits/deletes and reports concurrent reorder alternatives', () => {
  const data = legacyCloud({ schema: 1, app: 'Replift', data: fixture() });
  const base = update(undefined, data, 'base');
  const normalized = materialize(base, data);
  const a = structuredClone(normalized),
    b = structuredClone(normalized);
  a.ms!['Body weight']![0]!.v = 75;
  b.ms!['Body weight'] = [];
  const merged = merge(update(base, a, 'A'), update(base, b, 'B'));
  expect(
    merged.records['["measure","Body weight","legacy:123:0"]'],
  ).toHaveLength(2);
  const ordered = structuredClone(normalized);
  ordered.ex.reverse();
  expect(
    materialize(update(base, ordered, 'A'), data).ex.map((v) => v.id),
  ).toEqual(['run', 'bench']);
});
it('aborts restore and conflict review if recovery cannot be saved', async () => {
  const d = await device(),
    before = await d.repo.read();
  const data = structuredClone(before.data);
  data.prog[0]!.n = 'restored';
  const put = IDBObjectStore.prototype.put;
  vi.spyOn(IDBObjectStore.prototype, 'put').mockImplementation(function (
    this: IDBObjectStore,
    ...args: Parameters<typeof put>
  ) {
    if (this.name === 'recovery') throw new Error('synthetic full disk');
    return put.apply(this, args);
  });
  await expect(d.repo.restore(data, before.revision)).rejects.toThrow(
    'full disk',
  );
  expect(await d.repo.read()).toEqual(before);
});
it('rejects oversized streaming responses and honors HTTP 429/401 without exposing server text', async () => {
  await expect(boundedText(new Response('123456'), 4)).rejects.toThrow(
    'too large',
  );
  const d = await device(),
    provider = new DropboxProvider(d.repo, d.connection);
  vi.stubGlobal(
    'fetch',
    vi.fn(async () =>
      Response.json(
        { error_summary: 'private-response' },
        { status: 429, headers: { 'Retry-After': '120' } },
      ),
    ),
  );
  try {
    await provider.download(CLOUD_PATH, new AbortController().signal);
    throw new Error('expected rate limit');
  } catch (error) {
    expect(error).toBeInstanceOf(ProviderError);
    expect((error as ProviderError).retryAfter).toBe(120000);
    expect(String(error)).not.toContain('private-response');
  }
  vi.stubGlobal(
    'fetch',
    vi.fn(async () =>
      Response.json({ error_summary: 'private-response' }, { status: 401 }),
    ),
  );
  await expect(
    provider.download(CLOUD_PATH, new AbortController().signal),
  ).rejects.toMatchObject({ kind: 'auth' });
});
it('makes unrelated edits possible while ordering conflicts remain unresolved', async () => {
  const provider = new FakeDropbox(),
    a = await device(provider),
    b = await device(provider);
  await a.engine.run();
  await b.engine.run();
  await a.repo.commit({ type: 'program', id: 'A' });
  await b.repo.commit({ type: 'program', id: 'B' });
  await a.engine.run();
  await b.engine.run();
  const before = (await b.repo.syncState()).doc.records['["order","prog"]'];
  expect(before).toHaveLength(2);
  await b.repo.commit({ type: 'name', program: 'B', value: 'Independent' });
  await b.repo.commit({ type: 'program', id: 'C' });
  expect(
    canonical((await b.repo.syncState()).doc.records['["order","prog"]']),
  ).toBe(canonical(before));
  await b.engine.run();
  await a.engine.run();
  expect((await a.repo.read()).data.prog.some((p) => p.id === 'C')).toBe(true);
});
