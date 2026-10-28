import { devices, expect, test, type Page } from '@playwright/test';
import { createServer } from 'node:http';
import { readFile, readdir } from 'node:fs/promises';
import { resolve, extname } from 'node:path';
import { fixture } from '../fixtures/local';

async function seed(page: Page) {
  await page.addInitScript((raw) => {
    if (!localStorage.getItem('replift.v1'))
      localStorage.setItem('replift.v1', raw);
  }, JSON.stringify(fixture()));
}
async function tab(page: Page, name: string) {
  await page
    .getByRole('navigation')
    .getByRole('button', { name, exact: true })
    .click();
}
async function ready(page: Page) {
  await page.evaluate(async () => {
    await navigator.serviceWorker.ready;
  });
  await page.reload();
  await page.waitForFunction(() => !!navigator.serviceWorker.controller);
  await expect(page.locator('.save-status')).toHaveText('Saved on this device');
}
test('offline cold shell opens lazy settings, edits and resumes drafts without network', async ({
  page,
  context,
}) => {
  await seed(page);
  await page.goto('/');
  await ready(page);
  const assets = await page.evaluate(async () => {
    const cache = await caches.open(
      (await caches.keys()).find((key) => key.startsWith('replift-shell-v1-'))!,
    );
    return (await cache.keys()).map((r) => r.url);
  });
  expect(assets.some((url) => url.endsWith('.woff2'))).toBe(true);
  expect(assets.some((url) => url.includes('Settings-'))).toBe(true);
  expect(
    assets.every(
      (url) =>
        new URL(url).origin === new URL(page.url()).origin &&
        !new URL(url).search,
    ),
  ).toBe(true);
  await context.setOffline(true);
  await page.reload();
  await expect(
    page.getByText('Offline · saved edits stay on this device.', {
      exact: false,
    }),
  ).toBeVisible();
  await tab(page, 'Workout');
  await page.getByLabel('Exercise 1 set 1 lb', { exact: true }).fill('88');
  await expect(page.locator('.save-status')).toHaveText('Saved on this device');
  await tab(page, 'Settings');
  await expect(
    page.getByRole('heading', { name: 'Install and offline' }),
  ).toBeVisible();
  await page.getByLabel('First name', { exact: true }).fill('Offline test');
  await expect(page.locator('.save-status')).toHaveText('Saved on this device');
  await page.reload();
  await tab(page, 'Workout');
  await expect(
    page.getByLabel('Exercise 1 set 1 lb', { exact: true }),
  ).toHaveValue('88');
  await context.setOffline(false);
  await expect(
    page.getByText('Offline · saved edits stay on this device.', {
      exact: false,
    }),
  ).toHaveCount(0);
});

test('install guidance, manifest, public feedback and missing URLs remain explicit', async ({
  page,
}) => {
  await seed(page);
  await page.goto('/');
  await tab(page, 'Settings');
  const manifest = await (
    await page.request.get('/manifest.webmanifest')
  ).json();
  expect(manifest.display).toBe('standalone');
  expect(manifest.start_url).toBe('/');
  for (const icon of manifest.icons)
    expect((await page.request.get(icon.src)).ok()).toBe(true);
  await expect(
    page.getByRole('region', { name: 'Install and offline' }),
  ).toContainText('Add to Home Screen');
  await expect(
    page.getByRole('region', { name: 'Links and support' }),
  ).toContainText('Donate: URL not supplied.');
  await page
    .getByRole('button', { name: 'Delete local profile', exact: true })
    .click();
  const dialog = page.getByRole('dialog', { name: 'Delete local profile' });
  await dialog.getByLabel('Why are you leaving?').selectOption('Other');
  await dialog
    .getByLabel('Tell us why (required)')
    .fill('Synthetic feedback & details');
  await dialog.getByLabel('Type delete to confirm').fill('delete');
  const feedback = dialog.getByRole('link', {
    name: 'Share feedback on GitHub',
  });
  const url = new URL((await feedback.getAttribute('href'))!);
  expect(url.searchParams.get('body')).toContain(
    'Synthetic feedback & details',
  );
  expect(url.searchParams.get('body')).not.toContain('Synthetic history');
  await expect(
    dialog.getByRole('button', { name: 'Delete everything on this device' }),
  ).toBeEnabled();
  await expect(dialog).toContainText('unfinished workout draft');
  await dialog
    .getByLabel('Why are you leaving?')
    .selectOption('Dropbox sync problems');
  await expect(dialog).toContainText('Dropbox help video URL not supplied');
});

test('320px keyboard/sheet focus, reduced motion and text scaling preserve navigation', async ({
  page,
}) => {
  await page.setViewportSize({ width: 320, height: 640 });
  await page.emulateMedia({ reducedMotion: 'reduce' });
  await seed(page);
  await page.goto('/');
  await tab(page, 'Settings');
  await page.evaluate(() => {
    document.documentElement.style.fontSize = '20px';
  });
  await page.getByLabel('First name', { exact: true }).focus();
  await expect(page.getByLabel('First name', { exact: true })).toBeFocused();
  await page.getByRole('button', { name: 'About, Terms and Privacy' }).click();
  const dialog = page.getByRole('dialog', { name: 'About Replift' });
  await expect(dialog).toBeVisible();
  expect(
    await page.evaluate(() => !!document.activeElement?.closest('dialog')),
  ).toBe(true);
  expect(
    await page.evaluate(
      () => document.documentElement.scrollWidth <= innerWidth,
    ),
  ).toBe(true);
  if (test.info().project.name === 'mobile-chromium')
    await page.screenshot({ path: 'artifacts/phase-5-mobile-legal.png' });
  await page.keyboard.press('Escape');
  await expect(dialog).toHaveCount(0);
  await expect(
    page.getByRole('button', { name: 'About, Terms and Privacy' }),
  ).toBeFocused();
  await tab(page, 'Home');
});

test('install prompt is user initiated and fourth-workout donation notice is dismissible once', async ({
  page,
}) => {
  const d = fixture();
  d.wk = Array.from({ length: 4 }, (_, n) => ({
    ...structuredClone(d.wk[0]!),
    id: `synthetic-${n}`,
    t: 123 + n,
  }));
  await page.addInitScript((raw) => {
    if (!localStorage.getItem('replift.v1'))
      localStorage.setItem('replift.v1', raw);
  }, JSON.stringify(d));
  await page.goto('/');
  await tab(page, 'Settings');
  await page.evaluate(() => {
    const event = new Event('beforeinstallprompt', { cancelable: true });
    Object.assign(event, {
      prompt: async () => {
        document.body.dataset.installPrompts = '1';
      },
      userChoice: Promise.resolve({ outcome: 'dismissed' }),
    });
    window.dispatchEvent(event);
  });
  expect(
    await page.locator('body').getAttribute('data-install-prompts'),
  ).toBeNull();
  await page
    .getByRole('button', { name: 'Install Replift', exact: true })
    .click();
  await expect(page.locator('body')).toHaveAttribute(
    'data-install-prompts',
    '1',
  );
  await expect(
    page.getByRole('button', { name: 'Install Replift', exact: true }),
  ).toHaveCount(0);
  await tab(page, 'Stats');
  await page.getByRole('button', { name: 'History', exact: true }).click();
  await page
    .getByRole('button', { name: /Synthetic history/ })
    .first()
    .click();
  await page
    .getByRole('button', { name: 'View and share cards', exact: true })
    .click();
  const cards = page.getByRole('dialog', { name: 'Well done' });
  await expect(
    cards.getByRole('region', { name: 'Support Replift' }),
  ).toContainText('Donation URL not supplied');
  await cards.getByRole('button', { name: 'Continue', exact: true }).click();
  await expect(page.locator('.save-status')).toHaveText('Saved on this device');
  await page
    .getByRole('button', { name: 'View and share cards', exact: true })
    .click();
  await expect(
    cards.getByRole('region', { name: 'Support Replift' }),
  ).toHaveCount(0);
});

test('card PNG download and blocked native sharing fallback retain workout data', async ({
  page,
}) => {
  await seed(page);
  await page.goto('/');
  await tab(page, 'Stats');
  await page.getByRole('button', { name: 'History', exact: true }).click();
  await page.getByRole('button', { name: /Synthetic history/ }).click();
  await page
    .getByRole('button', { name: 'View and share cards', exact: true })
    .click();
  const dialog = page.getByRole('dialog', { name: 'Well done' });
  const download = page.waitForEvent('download');
  await dialog
    .getByRole('button', { name: 'Download PNG', exact: true })
    .first()
    .click();
  expect((await download).suggestedFilename()).toMatch(/replift-card.png/);
  await page.evaluate(() => {
    Object.defineProperty(navigator, 'canShare', {
      configurable: true,
      value: () => true,
    });
    Object.defineProperty(navigator, 'share', {
      configurable: true,
      value: () =>
        Promise.reject(new DOMException('Blocked', 'NotAllowedError')),
    });
  });
  const fallback = page.waitForEvent('download');
  await dialog
    .getByRole('button', { name: 'Share this card', exact: true })
    .first()
    .click();
  expect((await fallback).suggestedFilename()).toMatch(/replift-card.png/);
  await expect(dialog.getByRole('status')).toContainText('PNG downloaded');
});

test('waiting update retains two editing tabs, activates only after closing both, reopens offline', async ({
  playwright,
  browserName,
  context: temporaryContext,
}) => {
  test.setTimeout(60_000);
  // Test disk-backed cache retention, independently of private-context lifetime.
  const profile = test.info().outputPath('pwa-profile');
  const device =
    test.info().project.name === 'webkit'
      ? devices['iPhone 13']!
      : test.info().project.name === 'mobile-chromium'
        ? devices['Pixel 7']!
        : devices['Desktop Chrome']!;
  let context =
    browserName === 'webkit'
      ? await playwright.webkit.launchPersistentContext(profile, {
          ...device,
          serviceWorkers: 'allow',
        })
      : temporaryContext;
  let version = 1;
  // Serve one immutable build; another build must not replace files mid-update.
  const assets = new Map<string, Buffer>();
  async function capture(folder: string, prefix = '') {
    for (const entry of await readdir(folder, { withFileTypes: true })) {
      const path = resolve(folder, entry.name),
        name = prefix + '/' + entry.name;
      if (entry.isDirectory()) await capture(path, name);
      else assets.set(name, await readFile(path));
    }
  }
  await capture(resolve('dist'));
  const types: Record<string, string> = {
    '.js': 'application/javascript',
    '.html': 'text/html',
    '.css': 'text/css',
    '.webmanifest': 'application/manifest+json',
    '.png': 'image/png',
    '.woff2': 'font/woff2',
    '.woff': 'font/woff',
  };
  const server = createServer(async (req, res) => {
    try {
      const path = new URL(req.url!, 'http://localhost').pathname;
      if (path.includes('..')) {
        res.writeHead(400).end();
        return;
      }
      const file = path === '/' ? '/index.html' : path;
      let data: string | Buffer | undefined = assets.get(file);
      if (!data) {
        res.writeHead(404).end();
        return;
      }
      if (file === '/sw.js')
        data = data
          .toString()
          .replace(
            /const CACHE = PREFIX \+ '[a-f0-9]+';/,
            `const CACHE = PREFIX + 'test${version}';`,
          );
      if (file === '/index.html')
        data = data
          .toString()
          .replace(
            '</head>',
            `<meta name="test-build" content="${version}"></head>`,
          );
      res
        .writeHead(200, {
          'Content-Type': types[extname(file)] || 'application/octet-stream',
          'Cache-Control': 'no-store',
        })
        .end(data);
    } catch {
      res.writeHead(404).end();
    }
  });
  await new Promise<void>((resolve) => server.listen(0, '127.0.0.1', resolve));
  const address = server.address();
  if (!address || typeof address === 'string')
    throw new Error('No test address');
  const origin = `http://127.0.0.1:${address.port}`;
  let a: Page | undefined, b: Page | undefined;
  try {
    a = await context.newPage();
    await seed(a);
    await a.goto(origin);
    await ready(a);
    await a.evaluate(async () => {
      const c = await caches.open('unrelated-test-cache');
      await c.put('/sentinel', new Response('keep'));
    });
    b = await context.newPage();
    await b.goto(origin);
    await tab(a, 'Workout');
    await a.getByLabel('Exercise 1 set 1 lb', { exact: true }).fill('123');
    await expect(a.locator('.save-status')).toHaveText('Saved on this device');
    const before = await a.evaluate(() => localStorage.getItem('replift.v1'));
    version = 2;
    await b.evaluate(async () => {
      const r = await navigator.serviceWorker.getRegistration();
      await r!.update();
    });
    await expect(b.getByRole('region', { name: 'Update ready' })).toBeVisible();
    await expect(a.locator('meta[name="test-build"]')).toHaveAttribute(
      'content',
      '1',
    );
    await expect(
      a.getByLabel('Exercise 1 set 1 lb', { exact: true }),
    ).toHaveValue('123');
    await b.close();
    b = undefined;
    expect(
      await a.evaluate(
        async () =>
          !!(await navigator.serviceWorker.getRegistration())?.waiting,
      ),
    ).toBe(true);
    await a.close();
    a = undefined;
    a = await context.newPage();
    await a.goto(origin);
    await a.waitForFunction(
      async () => !(await navigator.serviceWorker.getRegistration())?.waiting,
    );
    await a.reload();
    await expect(a.locator('meta[name="test-build"]')).toHaveAttribute(
      'content',
      '2',
    );
    expect(
      await a.evaluate(async () => caches.has('unrelated-test-cache')),
    ).toBe(true);
    expect(await a.evaluate(() => localStorage.getItem('replift.v1'))).toBe(
      before,
    );
    await a.waitForFunction(async () => {
      const registration = await navigator.serviceWorker.getRegistration();
      return (
        registration?.active?.state === 'activated' &&
        navigator.serviceWorker.controller?.state === 'activated'
      );
    });
    try {
      await expect
        .poll(() =>
          a!.evaluate(async () => {
            const key =
              'replift-shell-v1-' +
              encodeURIComponent(location.origin + '/') +
              ':test2';
            return !!(await (await caches.open(key)).match('/index.html'));
          }),
        )
        .toBe(true);
    } catch (error) {
      console.log(
        'failed-cache-state',
        JSON.stringify(
          await a.evaluate(async () => ({
            origin: location.origin,
            scope: (await navigator.serviceWorker.getRegistration())?.scope,
            entries: await Promise.all(
              (await caches.keys()).map(async (key) => ({
                key,
                urls: (await (await caches.open(key)).keys()).map((r) => r.url),
              })),
            ),
            active: (await navigator.serviceWorker.getRegistration())?.active
              ?.scriptURL,
          })),
        ),
      );
      throw error;
    }
    if (browserName === 'webkit') {
      await context.close();
      context = await playwright.webkit.launchPersistentContext(profile, {
        ...device,
        serviceWorkers: 'allow',
        offline: true,
      });
      a = await context.newPage();
      await a.goto(origin);
    } else await context.setOffline(true);
    await a.reload();
    await tab(a, 'Workout');
    await expect(
      a.getByLabel('Exercise 1 set 1 lb', { exact: true }),
    ).toHaveValue('123');
    await context.setOffline(false);
  } finally {
    await a?.close();
    await b?.close();
    if (browserName === 'webkit') await context.close();
    server.closeAllConnections();
    await new Promise<void>((resolve) => server.close(() => resolve()));
  }
});
