import { expect, test, type Page } from '@playwright/test';
import { fixture } from '../fixtures/local';
import { ANDROID_REDIRECT } from '../../src/platform/android';
import { readFile } from 'node:fs/promises';

declare global {
  interface Window {
    __native: {
      listeners: Record<string, (event: Record<string, unknown>) => void>;
      calls: {
        plugin: string;
        method: string;
        options: Record<string, string>;
      }[];
      files: Record<string, string>;
      cancelled: boolean;
    };
  }
}

async function seed(page: Page, data = fixture()) {
  data.st = { ...data.st, vib: 1 };
  await page.addInitScript((raw) => {
    if (!localStorage.getItem('replift.v1'))
      localStorage.setItem('replift.v1', raw);
    window.__native = { listeners: {}, calls: [], files: {}, cancelled: false };
    const host = window as unknown as Record<string, unknown>;
    host.androidBridge = {};
    host.Capacitor = {
      PluginHeaders: [
        ['App', 'getLaunchUrl', 'exitApp', 'addListener', 'removeListener'],
        ['Browser', 'open'],
        ['Haptics', 'impact'],
        ['Filesystem', 'mkdir', 'readdir', 'writeFile', 'deleteFile'],
        ['Share', 'share'],
      ].map(([name, ...methods]) => ({
        name,
        methods: methods.map((name) => ({
          name,
          rtype: name === 'addListener' ? 'callback' : 'promise',
        })),
      })),
      nativeCallback: (
        _plugin: string,
        _method: string,
        options: { eventName: string },
        callback: (e: Record<string, unknown>) => void,
      ) => {
        window.__native.listeners[options.eventName] = callback;
        return options.eventName;
      },
      nativePromise: async (
        plugin: string,
        method: string,
        options: Record<string, string> = {},
      ) => {
        window.__native.calls.push({ plugin, method, options });
        if (method === 'getLaunchUrl')
          return { url: localStorage.getItem('synthetic-launch') ?? '' };
        if (method === 'readdir') return { files: [] };
        if (method === 'writeFile') {
          window.__native.files[options.path!] = options.data!;
          return { uri: `file:///cache/${options.path}` };
        }
        if (method === 'share' && window.__native.cancelled)
          throw new Error('Share canceled');
        return {};
      },
    };
  }, JSON.stringify(data));
  await page.goto('/');
  await expect(page.locator('.save-status')).toHaveText('Saved on this device');
  await expect
    .poll(() => page.evaluate(() => !!window.__native.listeners.backButton))
    .toBe(true);
}
async function settings(page: Page) {
  await page
    .getByRole('navigation')
    .getByRole('button', { name: 'Settings', exact: true })
    .click();
  await expect(
    page.getByRole('heading', { name: 'Android installation and updates' }),
  ).toBeVisible();
}
async function back(page: Page) {
  await page.evaluate(() => window.__native.listeners.backButton!({}));
}

test('native bridge uses bundled shell, closes only top sheet, goes Home, then exits on second Back', async ({
  page,
}) => {
  await seed(page);
  await settings(page);
  expect(
    await page.evaluate(
      async () => (await navigator.serviceWorker.getRegistrations()).length,
    ),
  ).toBe(0);
  await page
    .getByRole('button', { name: 'About, Terms and Privacy', exact: true })
    .click();
  await expect(page.getByRole('dialog')).toBeVisible();
  await back(page);
  await expect(page.getByRole('dialog')).toHaveCount(0);
  await expect(
    page.getByRole('heading', { name: 'Android installation and updates' }),
  ).toBeVisible();
  await back(page);
  await expect(
    page
      .getByRole('navigation')
      .getByRole('button', { name: 'Home', exact: true }),
  ).toHaveAttribute('aria-current', 'page');
  await back(page);
  await expect(
    page.getByRole('status').filter({ hasText: 'Press Back again to exit.' }),
  ).toBeVisible();
  await back(page);
  await expect
    .poll(() =>
      page.evaluate(
        () =>
          window.__native.calls.filter((c) => c.method === 'exitApp').length,
      ),
    )
    .toBe(1);
});

test('explicit browser-to-APK backup import crosses isolated storage without changing the source', async ({
  page,
  browser,
}) => {
  const original = fixture();
  await page.addInitScript(
    (raw) => localStorage.setItem('replift.v1', raw),
    JSON.stringify(original),
  );
  await page.goto('/');
  await expect(page.locator('.save-status')).toHaveText('Saved on this device');
  await page
    .getByRole('navigation')
    .getByRole('button', { name: 'Settings', exact: true })
    .click();
  const download = page.waitForEvent('download');
  await page.getByRole('button', { name: 'Download complete backup' }).click();
  const file = await download;
  const bytes = await readFile((await file.path())!);
  const sourceData = (
    JSON.parse(bytes.toString()) as { data: ReturnType<typeof fixture> }
  ).data;
  const targetContext = await browser.newContext();
  try {
    const target = await targetContext.newPage();
    const empty = fixture();
    empty.wk = [];
    empty.ph = [];
    await seed(target, empty);
    await settings(target);
    await target.getByLabel('Preview a backup to restore').setInputFiles({
      name: file.suggestedFilename(),
      mimeType: 'application/json',
      buffer: bytes,
    });
    await target
      .getByRole('button', { name: 'Restore with recovery point' })
      .click();
    await expect(
      target.getByRole('heading', { name: 'Review backup restore' }),
    ).toHaveCount(0);
    await target.reload();
    await settings(target);
    await target.getByRole('button', { name: 'Share complete backup' }).click();
    await expect
      .poll(() =>
        target.evaluate(() => Object.keys(window.__native.files).length),
      )
      .toBe(1);
    const exported = await target.evaluate(() => {
      const text = new TextDecoder().decode(
        Uint8Array.from(atob(Object.values(window.__native.files)[0]!), (c) =>
          c.charCodeAt(0),
        ),
      );
      return JSON.parse(text) as { data: ReturnType<typeof fixture> };
    });
    expect(exported.data.ph).toEqual(original.ph);
    expect(exported.data.wk).toEqual(original.wk);
    expect(exported.data.prog).toEqual(sourceData.prog);
    expect(exported.data.draft).toEqual(sourceData.draft);
    expect(exported.data.unknownFutureField).toEqual(
      original.unknownFutureField,
    );
    await page.reload();
    await page
      .getByRole('navigation')
      .getByRole('button', { name: 'Settings', exact: true })
      .click();
    const sourceDownload = page.waitForEvent('download');
    await page
      .getByRole('button', { name: 'Download complete backup' })
      .click();
    const source = JSON.parse(
      await readFile((await (await sourceDownload).path())!, 'utf8'),
    ) as { data: ReturnType<typeof fixture> };
    expect(source.data.ph).toEqual(original.ph);
    expect(source.data.wk).toEqual(original.wk);
  } finally {
    await targetContext.close();
  }
});

for (const cold of [false, true])
  test(`external browser PKCE ${cold ? 'cold' : 'warm'} return previews account exactly once`, async ({
    page,
  }) => {
    let exchanges = 0;
    await page.route('https://**.dropboxapi.com/**', async (route) => {
      const url = route.request().url();
      if (url.endsWith('/oauth2/token')) {
        exchanges++;
        expect(route.request().postData()).toContain(
          encodeURIComponent(ANDROID_REDIRECT),
        );
        return route.fulfill({
          json: {
            access_token: 'native-browser-fake',
            refresh_token: 'native-browser-refresh-fake',
            expires_in: 3600,
          },
        });
      }
      if (url.endsWith('/users/get_current_account'))
        return route.fulfill({
          json: { account_id: 'native-browser-account' },
        });
      return route.fulfill({
        status: 409,
        json: { error_summary: 'path/not_found/' },
      });
    });
    await seed(page);
    await settings(page);
    await page
      .getByRole('button', { name: 'Connect Dropbox', exact: true })
      .click();
    await expect
      .poll(() =>
        page.evaluate(
          () =>
            window.__native.calls.find((c) => c.plugin === 'Browser')?.options
              .url,
        ),
      )
      .toBeTruthy();
    const url = new URL(
      await page.evaluate(
        () =>
          window.__native.calls.find((c) => c.plugin === 'Browser')!.options
            .url!,
      ),
    );
    expect(url.searchParams.get('redirect_uri')).toBe(ANDROID_REDIRECT);
    const returned = `${ANDROID_REDIRECT}?code=synthetic&state=${url.searchParams.get('state')}`;
    expect(page.url()).not.toContain('dropbox');
    if (cold) {
      await page.evaluate(
        (url) => localStorage.setItem('synthetic-launch', url),
        returned,
      );
      await page.reload();
      await settings(page);
    }
    await page.evaluate((url) => {
      window.__native.listeners.appUrlOpen!({ url });
      window.__native.listeners.appUrlOpen!({ url });
    }, returned);
    await expect(
      page.getByRole('heading', { name: 'Review Dropbox account' }),
    ).toBeVisible();
    await expect(
      page.getByRole('button', { name: 'Connect and merge this account' }),
    ).toBeEnabled();
    expect(exchanges).toBe(1);
  });

test('native complete transfer exports original photos and no credentials, cancellation leaves data intact', async ({
  page,
}) => {
  await seed(page);
  await settings(page);
  await page.getByRole('button', { name: 'Share complete backup' }).click();
  await expect
    .poll(() =>
      page.evaluate(() =>
        window.__native.calls.some((c) => c.method === 'share'),
      ),
    )
    .toBe(true);
  const exported = await page.evaluate(() => {
    const base64 = Object.values(window.__native.files)[0]!;
    return new TextDecoder().decode(
      Uint8Array.from(atob(base64), (c) => c.charCodeAt(0)),
    );
  });
  const backup = JSON.parse(exported) as { data: ReturnType<typeof fixture> };
  expect(backup.data.ph).toEqual(fixture().ph);
  expect(backup.data.wk).toEqual(fixture().wk);
  expect(exported).not.toContain('refresh_token');
  await page.evaluate(() => {
    window.__native.cancelled = true;
  });
  await page.getByRole('button', { name: 'Share complete backup' }).click();
  await expect(
    page.getByText('Sharing cancelled.', { exact: true }),
  ).toBeVisible();
  await page.reload();
  await settings(page);
  await page.getByLabel('Preview a backup to restore').setInputFiles({
    name: 'transfer.json',
    mimeType: 'application/json',
    buffer: Buffer.from(exported),
  });
  await expect(
    page.getByRole('button', {
      name: 'Restore with recovery point',
    }),
  ).toBeVisible();
  await page
    .getByRole('button', { name: 'Restore with recovery point' })
    .click();
  await expect(
    page.getByRole('heading', { name: 'Review backup restore' }),
  ).toHaveCount(0);
  await expect(page.locator('.save-status')).toHaveText('Saved on this device');
  await page.reload();
  await settings(page);
  await page.getByRole('button', { name: 'Share complete backup' }).click();
  await expect
    .poll(() => page.evaluate(() => Object.keys(window.__native.files).length))
    .toBe(1);
  const restored = await page.evaluate(() => {
    const encoded = Object.values(window.__native.files)[0]!;
    const text = new TextDecoder().decode(
      Uint8Array.from(atob(encoded), (c) => c.charCodeAt(0)),
    );
    return JSON.parse(text) as { data: ReturnType<typeof fixture> };
  });
  expect(restored.data.ph).toEqual(backup.data.ph);
  expect(restored.data.wk).toEqual(backup.data.wk);
});

test('set completion requests Android haptics only when enabled', async ({
  page,
}) => {
  await seed(page);
  await page
    .getByRole('navigation')
    .getByRole('button', { name: 'Workout', exact: true })
    .click();
  await page.getByLabel('Exercise 1 set 1 lb', { exact: true }).fill('20');
  await page.getByLabel('Exercise 1 set 1 reps', { exact: true }).fill('8');
  await expect(page.locator('.save-status')).toHaveText('Saved on this device');
  // Assigning legacy set IDs must not remount the next field during input.
  await expect(
    page.getByLabel('Exercise 1 set 1 reps', { exact: true }),
  ).toBeFocused();
  await expect(
    page.getByLabel('Exercise 1 set 1 reps', { exact: true }),
  ).toHaveValue('8');
  const complete = page.getByRole('button', {
    name: 'Complete exercise 1 set 1',
    exact: true,
  });
  await complete.click();
  await expect
    .poll(() =>
      page.evaluate(
        () => window.__native.calls.filter((c) => c.method === 'impact').length,
      ),
    )
    .toBe(1);
  await complete.click();
  await settings(page);
  await page.getByLabel('Android haptics', { exact: true }).click();
  await expect(
    page.getByLabel('Android haptics', { exact: true }),
  ).not.toBeChecked();
  await expect(page.locator('.save-status')).toHaveText('Saved on this device');
  await page
    .getByRole('navigation')
    .getByRole('button', { name: 'Workout', exact: true })
    .click();
  await complete.click();
  await expect(complete).toHaveAttribute('aria-pressed', 'true');
  expect(
    await page.evaluate(
      () => window.__native.calls.filter((c) => c.method === 'impact').length,
    ),
  ).toBe(1);
});
