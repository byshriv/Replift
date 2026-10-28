import { expect, it, vi } from 'vitest';
import { readFileSync } from 'node:fs';
import { runInNewContext } from 'node:vm';
import { publicLink, feedbackUrl } from '../../src/platform/links';
import { wrapText, shareImages } from '../../src/platform/share';

function worker(fail = false) {
  const handlers: Record<string, (e: unknown) => void> = {};
  const cached = new Map<string, string>();
  const prefix = 'replift-shell-v1-https%3A%2F%2Flocal.test%2F:';
  const keys = new Set([
    'other-app-cache',
    prefix + 'old',
    'replift-shell-v1-other-scope:old',
    'replift-legacy-cache',
  ]);
  const fetch = vi.fn(async () => 'network');
  const cache = {
    addAll: vi.fn(async (requests: { url: string }[]) => {
      if (fail) throw new Error('Interrupted precache');
      requests.forEach((r) => cached.set(r.url, `cached:${r.url}`));
    }),
    match: async (url: string) => cached.get(url),
  };
  runInNewContext(
    readFileSync('scripts/worker-template.js', 'utf8')
      .replace('__VERSION__', 'new')
      .replace(
        '__ASSETS__',
        JSON.stringify(['/index.html', '/assets/app.js', '/font.woff2']),
      ),
    {
      self: {
        location: { origin: 'https://local.test' },
        registration: { scope: 'https://local.test/' },
        addEventListener: (name: string, cb: (e: unknown) => void) => {
          handlers[name] = cb;
        },
      },
      caches: {
        open: async (key: string) => {
          keys.add(key);
          return cache;
        },
        keys: async () => [...keys],
        delete: async (key: string) => keys.delete(key),
      },
      Request: class {
        constructor(public url: string) {}
      },
      URL,
      fetch,
    },
  );
  const lifetime = (name: string) =>
    new Promise<void>((resolve, reject) =>
      handlers[name]!({
        waitUntil: (p: Promise<void>) => p.then(resolve, reject),
      }),
    );
  async function request(path: string, mode = 'cors', method = 'GET') {
    let response: Promise<string> | undefined;
    handlers.fetch!({
      request: { url: new URL(path, 'https://local.test').href, mode, method },
      respondWith: (p: Promise<string>) => {
        response = p;
      },
    });
    return response;
  }
  return { keys, cache, fetch, lifetime, request, prefix };
}
it('precaches shell/assets and isolates OAuth, APIs, query responses and non-GET requests', async () => {
  const w = worker();
  await w.lifetime('install');
  expect(await w.request('/?code=private&state=private', 'navigate')).toBe(
    'cached:/index.html',
  );
  expect(await w.request('/assets/app.js')).toBe('cached:/assets/app.js');
  for (const path of [
    '/api/data',
    '/assets/app.js?token=private',
    'https://api.dropboxapi.com/2/files/download',
    '/backup.json',
  ])
    expect(await w.request(path)).toBeUndefined();
  expect(await w.request('/index.html', 'cors', 'POST')).toBeUndefined();
  expect(w.cache.addAll).toHaveBeenCalledTimes(1);
  expect(w.fetch).not.toHaveBeenCalled();
  await w.lifetime('activate');
  expect(w.keys.has(w.prefix + 'old')).toBe(false);
  expect(w.keys.has(w.prefix + 'new')).toBe(true);
  for (const key of [
    'other-app-cache',
    'replift-legacy-cache',
    'replift-shell-v1-other-scope:old',
  ])
    expect(w.keys.has(key)).toBe(true);
});
it('failed precache rejects installation and leaves the previous cache intact', async () => {
  const w = worker(true);
  await expect(w.lifetime('install')).rejects.toThrow('Interrupted');
  expect(w.keys.has(w.prefix + 'old')).toBe(true);
});
it('accepts HTTPS owner links only and feedback includes only explicitly entered text', () => {
  for (const value of [
    '',
    undefined,
    'javascript:alert(1)',
    'http://bad.test',
    'https://user:pass@bad.test',
    '/relative',
  ])
    expect(publicLink(value)).toBeNull();
  expect(publicLink('https://example.com/help')).toBe(
    'https://example.com/help',
  );
  const url = new URL(feedbackUrl('Other', 'A & B\n#hello'));
  expect(url.searchParams.get('body')).toContain('A & B\n#hello');
  expect(url.hostname).toBe('github.com');
});
it('wraps long unbroken and multiline share text without dropping characters', () => {
  const text = 'a'.repeat(150);
  const lines = wrapText(text, (s) => s.length, 20);
  expect(lines.join('')).toBe(text);
  expect(lines.every((x) => x.length <= 20)).toBe(true);
  expect(wrapText('first\nsecond', (s) => s.length, 20)).toEqual([
    'first',
    'second',
  ]);
});
it('native share cancellation does not trigger downloads', async () => {
  vi.stubGlobal('navigator', {
    canShare: () => true,
    share: async () => {
      throw new DOMException('Cancelled', 'AbortError');
    },
  });
  try {
    expect(await shareImages([], 'Test')).toBe('Sharing cancelled.');
  } finally {
    vi.unstubAllGlobals();
  }
});
