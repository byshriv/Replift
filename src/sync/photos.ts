import type { Document } from './core';
import type { LocalRepository } from '../data/local';
import type { Provider } from './dropbox';
import { ProviderError } from './dropbox';

const prefix = 'replift-photo:';
const photoPath = (hash: string) => `/replift-photos-v3/${hash}.json`;
export async function digest(text: string): Promise<string> {
  return [
    ...new Uint8Array(
      await crypto.subtle.digest('SHA-256', new TextEncoder().encode(text)),
    ),
  ]
    .map((x) => x.toString(16).padStart(2, '0'))
    .join('');
}
async function walk(
  value: unknown,
  transform: (s: string) => Promise<string>,
): Promise<unknown> {
  if (typeof value === 'string') return transform(value);
  if (!value || typeof value !== 'object') return value;
  if (Array.isArray(value))
    return Promise.all(value.map((v) => walk(v, transform)));
  return Object.fromEntries(
    await Promise.all(
      Object.entries(value).map(async ([k, v]) => [
        k,
        await walk(v, transform),
      ]),
    ),
  );
}
// The durable source is kept both in the document/recovery and as an IDB blob.
// No compression or garbage collection: neither can discard the only source.
export async function uploadPhotos(
  doc: Document,
  repo: LocalRepository,
  provider: Provider,
  account: string,
  signal: AbortSignal,
  previous?: Document,
): Promise<{ wire: Document; pending: number }> {
  const cache = new Map<string, Promise<string>>();
  const transform = async (text: string) => {
    if (text.startsWith(prefix))
      throw new Error('Unhydrated photo reference in local data.');
    if (!text.startsWith('data:image/')) return text;
    if (!cache.has(text))
      cache.set(
        text,
        (async () => {
          const hash = await digest(text);
          await repo.blob(hash, new Blob([text], { type: 'text/plain' }));
          const queueKey = `photo:${account}:${hash}`;
          await repo.privateWrite(queueKey, { hash, status: 'pending' });
          const body = JSON.stringify({
            format: 'replift-photo',
            hash,
            source: text,
          });
          let verified = await provider.download(photoPath(hash), signal);
          if (!verified) {
            try {
              await provider.upload(photoPath(hash), body, null, signal);
            } catch (error) {
              if (!(error instanceof ProviderError) || error.kind !== 'race')
                throw error;
            }
            verified = await provider.download(photoPath(hash), signal);
          }
          if (!verified || verified.body !== body)
            throw new Error(
              'Photo verification failed. Source retained and this record remains pending.',
            );
          await repo.privateWrite(queueKey, { hash, status: 'verified' });
          return prefix + hash;
        })(),
      );
    return cache.get(text)!;
  };
  const wire: Document = { ...doc, records: {} };
  let pending = 0;
  for (const [key, variants] of Object.entries(doc.records)) {
    try {
      wire.records[key] = (await walk(variants, transform)) as typeof variants;
    } catch (error) {
      signal.throwIfAborted();
      if (
        error instanceof ProviderError &&
        ['auth', 'rate', 'invalid'].includes(error.kind)
      )
        throw error;
      // Publish independent metadata, retaining the previous cloud record until
      // every referenced immutable source is verified. Never publish a dangling ref.
      if (previous?.records[key]) wire.records[key] = previous.records[key];
      pending++;
    }
  }
  return { wire, pending };
}
export async function downloadPhotos(
  doc: Document,
  repo: LocalRepository,
  provider: Provider,
  signal: AbortSignal,
): Promise<Document> {
  const cache = new Map<string, Promise<string>>();
  return (await walk(doc, async (text) => {
    if (!text.startsWith(prefix)) return text;
    const hash = text.slice(prefix.length);
    if (!/^[a-f0-9]{64}$/.test(hash))
      throw new Error('Invalid photo reference.');
    if (!cache.has(hash))
      cache.set(
        hash,
        (async () => {
          const stored = await repo.blob(hash);
          if (stored) {
            const source = await stored.text();
            if ((await digest(source)) === hash) return source;
          }
          const remote = await provider.download(photoPath(hash), signal);
          if (!remote)
            throw new Error(
              'A Dropbox photo is missing. Local data retained; retry or recover a complete backup.',
            );
          const value: unknown = JSON.parse(remote.body);
          if (
            !value ||
            typeof value !== 'object' ||
            !('source' in value) ||
            typeof value.source !== 'string' ||
            !value.source.startsWith('data:image/') ||
            (await digest(value.source)) !== hash
          )
            throw new Error(
              'Photo integrity check failed. Local data retained.',
            );
          await repo.blob(
            hash,
            new Blob([value.source], { type: 'text/plain' }),
          );
          return value.source;
        })(),
      );
    return cache.get(hash)!;
  })) as Document;
}
