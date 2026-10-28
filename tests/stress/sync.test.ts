import { expect, it } from 'vitest';
import { device, FakeDropbox } from '../fixtures/sync';
import {
  canonical,
  materialize,
  merge,
  parseDocument,
} from '../../src/sync/core';
import { ProviderError } from '../../src/sync/dropbox';
import { LocalRepository, openDatabase } from '../../src/data/local';
import { SyncEngine } from '../../src/sync/engine';

for (const seed of [7303, 20261028, 0xdecaf]) {
  it(`three-device sync invariants, seed=${seed}, 300 actions`, async () => {
    let state = seed >>> 0;
    const random = () => {
      state = (Math.imul(state, 1664525) + 1013904223) >>> 0;
      return state;
    };
    const provider = new FakeDropbox();
    const devices = await Promise.all([
      device(provider),
      device(provider),
      device(provider),
    ]);
    for (const d of [...devices, ...devices]) await d.engine.run();
    const original = (await devices[0]!.repo.read()).data;
    for (let step = 0; step < 300; step++) {
      const index = random() % 3,
        d = devices[index]!,
        action = random() % 9;
      if (action < 3) {
        // Each device owns one independent program; edits must survive every merge.
        const id = `owner-${index}`;
        const snapshot = await d.repo.read();
        if (!snapshot.data.prog.some((p) => p.id === id))
          await d.repo.commit({ type: 'program', id });
        await d.repo.commit({
          type: 'name',
          program: id,
          value: `${seed}:${index}:${step}`,
        });
      } else if (action === 3) {
        // Concurrent same-record edits are reviewed, never silently discarded.
        const doc = (await d.repo.syncState()).doc,
          k = '["prog","p"]';
        if (doc.records[k]!.length > 1)
          await d.repo.review(
            k,
            canonical(doc.records[k]),
            random() % doc.records[k]!.length,
          );
        else
          await d.repo.commit({
            type: 'name',
            program: 'p',
            value: `conflict:${index}:${step}`,
          });
      } else if (action === 4) {
        const before = await d.repo.read(),
          doc = (await d.repo.syncState()).doc;
        provider.fail = new ProviderError(
          random() % 2 ? 'network' : 'rate',
          'seeded unavailable',
        );
        await expect(d.engine.run()).rejects.toThrow();
        provider.fail = undefined;
        expect(
          await d.repo.read(),
          `seed=${seed} step=${step} failed write`,
        ).toEqual(before);
        expect((await d.repo.syncState()).doc).toEqual(doc);
      } else if (action === 5) {
        d.repo.close();
        d.repo = new LocalRepository(await openDatabase(d.factory));
        await d.repo.initialize(d.raw);
        d.engine = new SyncEngine(d.repo, provider, d.connection);
      } else if (action === 6) {
        provider.loseResponse = true;
        try {
          await d.engine.run();
        } catch (e) {
          expect(String(e)).toContain('lost response');
        }
        provider.loseResponse = false;
      } else await d.engine.run();

      const docs = await Promise.all(
        devices.map(async (d) => parseDocument((await d.repo.syncState()).doc)),
      );
      expect(
        canonical(merge(docs[0]!, docs[1]!)),
        `commutativity ${seed}:${step}`,
      ).toBe(canonical(merge(docs[1]!, docs[0]!)));
      expect(
        canonical(merge(merge(docs[0]!, docs[1]!), docs[2]!)),
        `associativity ${seed}:${step}`,
      ).toBe(canonical(merge(docs[0]!, merge(docs[1]!, docs[2]!))));
      for (const [i, doc] of docs.entries()) {
        expect(canonical(merge(doc, doc))).toBe(canonical(doc));
        const snapshot = await devices[i]!.repo.read();
        expect(snapshot.data.wk).toEqual(original.wk);
        expect(snapshot.data.ph).toEqual(original.ph);
        expect(snapshot.data.unknownFutureField).toEqual(
          original.unknownFutureField,
        );
        expect(materialize(doc, snapshot.data).prog).toEqual(
          snapshot.data.prog,
        );
      }
    }
    for (const d of [...devices, ...devices, ...devices]) await d.engine.run();
    const docs = await Promise.all(
      devices.map(async (d) => (await d.repo.syncState()).doc),
    );
    expect(canonical(docs[0])).toBe(canonical(docs[1]));
    expect(canonical(docs[1])).toBe(canonical(docs[2]));
    for (const d of devices) {
      expect((await d.repo.read()).pending).toBe(0);
      d.repo.close();
    }
  }, 120_000);
}
