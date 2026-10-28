import { expect, test } from '@playwright/test';
import { readFile } from 'node:fs/promises';
import type { BrowserContext, Page } from '@playwright/test';
import { fixture } from '../fixtures/local';
import { CLOUD_PATH, LEGACY_PATH } from '../../src/sync/dropbox';

type Cloud = {
  files: Map<string, { body: string; rev: string }>;
  counter: number;
  fail: boolean;
};
async function fakeDropbox(context: BrowserContext, cloud: Cloud) {
  await context.route(
    (url) =>
      url.hostname === 'www.dropbox.com' ||
      url.hostname.endsWith('.dropboxapi.com'),
    async (route) => {
      const request = route.request(),
        url = new URL(request.url());
      if (url.pathname === '/oauth2/authorize') {
        const redirect = new URL(url.searchParams.get('redirect_uri')!);
        redirect.searchParams.set('state', url.searchParams.get('state')!);
        redirect.searchParams.set('code', 'synthetic-code');
        return route.fulfill({
          contentType: 'text/html',
          body: `<script>location.replace(${JSON.stringify(redirect.href)})</script>`,
        });
      }
      if (url.pathname === '/oauth2/token')
        return route.fulfill({
          json: {
            access_token: 'fake-browser-only',
            refresh_token: 'fake-refresh-only',
            expires_in: 3600,
          },
        });
      if (url.pathname.endsWith('/users/get_current_account'))
        return route.fulfill({
          json: { account_id: 'synthetic-browser-account' },
        });
      if (cloud.fail)
        return route.fulfill({
          status: 503,
          json: { error_summary: 'synthetic offline' },
        });
      const args = JSON.parse(request.headers()['dropbox-api-arg'] ?? '{}') as {
        path: string;
        mode?: { '.tag': string; update?: string };
        strict_conflict?: boolean;
      };
      const existing = cloud.files.get(args.path);
      if (url.pathname.endsWith('/files/download'))
        return existing
          ? route.fulfill({
              body: existing.body,
              headers: {
                'Dropbox-API-Result': JSON.stringify({ rev: existing.rev }),
                'Access-Control-Expose-Headers': 'Dropbox-API-Result',
              },
            })
          : route.fulfill({
              status: 409,
              json: { error_summary: 'path/not_found/...' },
            });
      if (url.pathname.endsWith('/files/upload')) {
        expect(args.strict_conflict).toBe(true);
        const expected =
          args.mode?.['.tag'] === 'update' ? args.mode.update : undefined;
        if (existing?.rev !== expected)
          return route.fulfill({
            status: 409,
            json: { error_summary: 'path/conflict/file/...' },
          });
        const rev = `browser-${++cloud.counter}`;
        cloud.files.set(args.path, { body: request.postData()!, rev });
        return route.fulfill({ json: { rev } });
      }
      throw new Error(`Unexpected fake Dropbox request ${url.pathname}`);
    },
  );
}
async function seed(page: Page) {
  const data = fixture();
  data.prog[0]!.routines[0]!.vals!.bench![0]!.id = 'set';
  await page.addInitScript((raw) => {
    if (localStorage.getItem('replift.v1') === null)
      localStorage.setItem('replift.v1', raw);
  }, JSON.stringify(data));
  await page.goto('/');
  await expect(page.locator('.save-status')).toHaveText('Saved on this device');
}
async function settings(page: Page) {
  await page
    .getByRole('navigation')
    .getByRole('button', { name: 'Settings', exact: true })
    .click();
}
async function connect(page: Page) {
  await settings(page);
  const returned = page.waitForURL(
    (url) =>
      url.origin === 'http://127.0.0.1:4173' && url.searchParams.has('code'),
  );
  await page
    .getByRole('button', { name: 'Connect Dropbox', exact: true })
    .click();
  await returned;
  // Navigation restarts the app on Home; the review is also accessible through Settings.
  await expect(page).not.toHaveURL(/code=/);
  await settings(page);
  await expect(
    page.getByRole('heading', { name: 'Review Dropbox account' }),
  ).toBeVisible();
  await expect(
    page.getByRole('button', { name: 'Connect and merge this account' }),
  ).toBeEnabled();
  await page
    .getByRole('button', { name: 'Connect and merge this account' })
    .click();
}
async function sync(page: Page) {
  await page.getByRole('button', { name: 'Sync now', exact: true }).click();
  await expect(
    page.getByText('Dropbox acknowledged saved changes', { exact: true }),
  ).toBeVisible();
}
test('optional connection, legacy review, photo transfer, complete backup and previewed restore', async ({
  page,
  context,
}, testInfo) => {
  const cloud: Cloud = {
    files: new Map([
      [
        LEGACY_PATH,
        {
          body: JSON.stringify({ schema: 1, app: 'Replift', data: fixture() }),
          rev: 'legacy-browser',
        },
      ],
    ]),
    counter: 0,
    fail: false,
  };
  const legacy = cloud.files.get(LEGACY_PATH);
  await fakeDropbox(context, cloud);
  await seed(page);
  await connect(page);
  await expect(
    page.getByRole('heading', { name: 'Legacy cloud data found' }),
  ).toBeVisible();
  expect(cloud.files.has(CLOUD_PATH)).toBe(false);
  await page
    .getByRole('button', { name: 'Import legacy cloud safely' })
    .click();
  await expect(
    page.getByText('Dropbox acknowledged saved changes', { exact: true }),
  ).toBeVisible();
  expect(cloud.files.get(LEGACY_PATH)).toEqual(legacy);
  expect(cloud.files.get(CLOUD_PATH)!.body).toContain('replift-photo:');
  if (testInfo.project.name === 'mobile-chromium')
    await page.screenshot({
      path: 'artifacts/phase-3-mobile.png',
      fullPage: true,
    });
  // Local/legacy routine set IDs differ: migration retains both versions for review.
  for (const conflict of await page
    .getByRole('region', { name: 'Review sync conflict' })
    .all())
    await conflict
      .getByRole('button', { name: 'Use version 1', exact: true })
      .click();
  const downloadEvent = page.waitForEvent('download');
  await page.getByRole('button', { name: 'Download complete backup' }).click();
  const download = await downloadEvent;
  expect(download.suggestedFilename()).toMatch(/^replift-backup-/);
  const buffer = await readFile((await download.path())!);
  expect(buffer.toString()).toContain('data:image/png;base64,AA==');
  expect(buffer.toString()).not.toMatch(
    /fake-refresh-only|fake-browser-only|synthetic-browser-account/,
  );
  await page
    .getByRole('navigation')
    .getByRole('button', { name: 'Workout', exact: true })
    .click();
  await page.getByLabel('Program name').fill('Changed after backup');
  await expect(page.locator('.save-status')).toHaveText('Saved on this device');
  await settings(page);
  await page.getByLabel('Preview a backup to restore').setInputFiles({
    name: 'synthetic-backup.json',
    mimeType: 'application/json',
    buffer,
  });
  await expect(
    page.getByRole('heading', { name: 'Review backup restore' }),
  ).toBeVisible();
  await page
    .getByRole('button', { name: 'Restore with recovery point' })
    .click();
  await expect(
    page.getByRole('heading', { name: 'Review backup restore' }),
  ).toHaveCount(0);
  await page
    .getByRole('navigation')
    .getByRole('button', { name: 'Workout', exact: true })
    .click();
  await expect(page.getByLabel('Program name')).toHaveValue(
    'Synthetic program',
  );
  await settings(page);
  await page
    .getByRole('button', { name: 'Show local recovery points' })
    .click();
  await page
    .getByRole('button', { name: 'Preview this recovery point' })
    .first()
    .click();
  await expect(
    page.getByRole('heading', { name: 'Review backup restore' }),
  ).toBeVisible();
  await page.getByRole('button', { name: 'Cancel restore' }).click();
  await page.getByRole('button', { name: 'Disconnect Dropbox' }).click();
  await expect(
    page.getByText('Dropbox disconnected; local data retained'),
  ).toBeVisible();
});

test('two isolated browsers review conflicts, reconnect after failure and preserve local edits', async ({
  browser,
  page,
  context,
}) => {
  const cloud: Cloud = { files: new Map(), counter: 0, fail: false };
  await fakeDropbox(context, cloud);
  await seed(page);
  await connect(page);
  await expect(
    page.getByText('Dropbox acknowledged saved changes', { exact: true }),
  ).toBeVisible();
  const otherContext = await browser.newContext();
  await fakeDropbox(otherContext, cloud);
  const other = await otherContext.newPage();
  await seed(other);
  await connect(other);
  await expect(
    other.getByText('Dropbox acknowledged saved changes', { exact: true }),
  ).toBeVisible();
  await context.setOffline(true);
  await otherContext.setOffline(true);
  for (const [p, name] of [
    [page, 'Device A'],
    [other, 'Device B'],
  ] as const) {
    await p
      .getByRole('navigation')
      .getByRole('button', { name: 'Workout', exact: true })
      .click();
    await p.getByLabel('Program name').fill(name);
    await expect(p.locator('.save-status')).toHaveText('Saved on this device');
    await settings(p);
  }
  await context.setOffline(false);
  await sync(page);
  await otherContext.setOffline(false);
  await sync(other);
  await expect(
    other.getByRole('heading', { name: 'Review conflicting program values' }),
  ).toBeVisible();
  await other
    .getByRole('button', { name: 'Use version 1', exact: true })
    .click();
  await sync(other);
  await sync(page);
  await expect(
    page.getByRole('heading', { name: 'Review conflicting program values' }),
  ).toHaveCount(0);
  cloud.fail = true;
  await page.getByRole('button', { name: 'Sync now', exact: true }).click();
  await expect(
    page.getByRole('alert').filter({ hasText: 'Dropbox request failed' }),
  ).toBeVisible();
  cloud.fail = false;
  await sync(page);
  await page.reload();
  await settings(page);
  await sync(page);
  expect(await page.evaluate(() => location.search)).toBe('');
  await otherContext.close();
});

test('same-origin tabs coordinate cloud requests with one Web Lock', async ({
  page,
  context,
}) => {
  const cloud: Cloud = { files: new Map(), counter: 0, fail: false };
  await fakeDropbox(context, cloud);
  await seed(page);
  await connect(page);
  await expect(
    page.getByText('Dropbox acknowledged saved changes', { exact: true }),
  ).toBeVisible();
  const other = await context.newPage();
  await other.goto('/');
  await settings(other);
  await expect(
    other.getByText('Dropbox acknowledged saved changes', { exact: true }),
  ).toBeVisible();
  let release!: () => void, entered!: () => void;
  const gate = new Promise<void>((resolve) => {
    release = resolve;
  });
  const waiting = new Promise<void>((resolve) => {
    entered = resolve;
  });
  await context.route(
    'https://content.dropboxapi.com/2/files/download',
    async (route) => {
      const args = JSON.parse(
        route.request().headers()['dropbox-api-arg']!,
      ) as { path: string };
      if (args.path === CLOUD_PATH) {
        entered();
        await gate;
      }
      await route.fallback();
    },
  );
  await page.getByRole('button', { name: 'Sync now', exact: true }).click();
  await waiting;
  await other.getByRole('button', { name: 'Sync now', exact: true }).click();
  try {
    await expect
      .poll(async () =>
        page.evaluate(async () => {
          const locks = await navigator.locks.query();
          return {
            held: locks.held?.filter((l) => l.name === 'replift-dropbox-v3')
              .length,
            pending: locks.pending?.filter(
              (l) => l.name === 'replift-dropbox-v3',
            ).length,
          };
        }),
      )
      .toEqual({ held: 1, pending: 1 });
  } finally {
    release();
  }
  await expect(
    page.getByText('Dropbox acknowledged saved changes', { exact: true }),
  ).toBeVisible();
  await expect(
    other.getByText('Dropbox acknowledged saved changes', { exact: true }),
  ).toBeVisible();
  await other.close();
});
