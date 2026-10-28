import { expect, test } from '@playwright/test';
import type { Page } from '@playwright/test';
import { fixture } from '../fixtures/local';

async function seed(page: Page) {
  const raw = JSON.stringify(fixture());
  await page.addInitScript((raw) => {
    if (localStorage.getItem('replift.v1') === null)
      localStorage.setItem('replift.v1', raw);
  }, raw);
  await page.goto('/');
  await expect(page.locator('.save-status')).toHaveText('Saved on this device');
  return raw;
}
async function openRoutine(page: Page, name = 'Routine · Monday') {
  await page
    .getByRole('navigation')
    .getByRole('button', { name: 'Workout', exact: true })
    .click();
  await page.getByRole('button', { name, exact: true }).click();
}
async function snapshot(page: Page) {
  return page.evaluate(async () => {
    const db = await new Promise<IDBDatabase>((resolve, reject) => {
      const r = indexedDB.open('replift.local.v2');
      r.onsuccess = () => resolve(r.result);
      r.onerror = () => reject(r.error);
    });
    const value = await new Promise<import('../../src/data/local').Snapshot>(
      (resolve, reject) => {
        const r = db.transaction('state').objectStore('state').get('current');
        r.onsuccess = () => resolve(r.result);
        r.onerror = () => reject(r.error);
      },
    );
    db.close();
    return value;
  });
}
test('migrates all collections, autosaves input/weekday, Back and reload retain edits', async ({
  page,
}) => {
  const raw = await seed(page);
  const before = await snapshot(page);
  await openRoutine(page);
  await page.getByLabel('Routine name').fill('My edited routine');
  await expect(page.locator('.save-status')).toHaveText('Saved on this device');
  await page.getByLabel('Weekday').selectOption('5');
  await page.getByLabel('Set 1 kg', { exact: true }).fill('2.');
  await expect(page.getByLabel('Set 1 kg', { exact: true })).toHaveAttribute(
    'aria-invalid',
    'true',
  );
  await expect(page.locator('.save-status')).toHaveText('Saved on this device');
  await page.getByRole('button', { name: 'Back to programs' }).click();
  await page
    .getByRole('button', { name: 'My edited routine · Friday', exact: true })
    .click();
  await expect(page.getByLabel('Set 1 kg', { exact: true })).toHaveValue('2.');
  await page.reload();
  await openRoutine(page, 'My edited routine · Friday');
  await expect(page.getByLabel('Set 1 kg', { exact: true })).toHaveValue('2.');
  const after = await snapshot(page);
  expect(after.data.wk).toEqual(before.data.wk);
  expect(after.data.ph).toEqual(before.data.ph);
  expect(after.data.ms).toEqual(before.data.ms);
  expect(after.data.draft).toEqual(before.data.draft);
  expect(await page.evaluate(() => localStorage.getItem('replift.v1'))).toBe(
    raw,
  );
});
test('selection commits before Done or sheet close; removal Undo survives reload', async ({
  page,
}) => {
  await seed(page);
  await openRoutine(page);
  await page
    .getByRole('button', { name: 'Choose exercises', exact: true })
    .click();
  await page
    .getByRole('button', { name: 'Add Synthetic run', exact: true })
    .click();
  await expect(
    page.getByRole('button', { name: 'Add Synthetic run', exact: true }),
  ).toHaveText('Added');
  expect((await snapshot(page)).data.prog[0]!.routines[0]!.ex).toContain('run');
  await page.getByRole('button', { name: 'Close exercise picker' }).click();
  await expect(
    page.getByRole('article', { name: 'Synthetic run', exact: true }),
  ).toBeVisible();
  await page
    .getByRole('button', { name: 'Remove Synthetic run', exact: true })
    .click();
  await expect(
    page.getByRole('button', { name: 'Undo removal' }),
  ).toBeEnabled();
  await page.reload();
  await openRoutine(page);
  await page.getByRole('button', { name: 'Undo removal' }).click();
  await expect(
    page.getByRole('article', { name: 'Synthetic run', exact: true }),
  ).toBeVisible();
  await page
    .getByRole('button', { name: 'Choose exercises', exact: true })
    .click();
  await page.getByRole('button', { name: 'Done', exact: true }).click();
  await expect(page.getByRole('dialog')).toHaveCount(0);
});
test('set controls retain raw values through delete/Undo and tab navigation', async ({
  page,
}, testInfo) => {
  await seed(page);
  await openRoutine(page);
  await page.getByRole('button', { name: 'Add set', exact: true }).click();
  await page.getByLabel('Set 2 reps', { exact: true }).fill('unfinished');
  await expect(page.locator('.save-status')).toHaveText('Saved on this device');
  await page.getByRole('button', { name: 'Remove set 2', exact: true }).click();
  await page.getByRole('button', { name: 'Undo removal' }).click();
  await expect(page.getByLabel('Set 2 reps', { exact: true })).toHaveValue(
    'unfinished',
  );
  for (const tab of ['Home', 'Stats', 'Library', 'Settings', 'Workout']) {
    await page
      .getByRole('navigation')
      .getByRole('button', { name: tab, exact: true })
      .click();
    await expect(page.locator('header time')).toBeVisible();
    await expect(
      page.getByRole('button', { name: 'Open profile' }),
    ).toBeVisible();
  }
  await page
    .getByRole('button', { name: 'Routine · Monday', exact: true })
    .click();
  await expect(page.getByLabel('Set 2 reps', { exact: true })).toHaveValue(
    'unfinished',
  );
  expect(
    await page.evaluate(
      () => document.documentElement.scrollWidth <= innerWidth,
    ),
  ).toBe(true);
  if (testInfo.project.name === 'mobile-chromium') {
    await page.locator('header').scrollIntoViewIfNeeded();
    await page.screenshot({
      path: 'artifacts/phase-2-routine-mobile.png',
      fullPage: true,
    });
  }
  await page.getByRole('button', { name: 'Open profile' }).click();
  await expect(
    page.getByRole('heading', { name: 'Local profile' }),
  ).toBeVisible();
  await page.getByRole('button', { name: 'Saved on this device' }).click();
  await expect(page.getByLabel('Storage and sync status')).toContainText(
    'No cloud acknowledgement',
  );
});
test('conflicting Undo preserves current values and confirmed discard unblocks editing', async ({
  page,
}) => {
  await seed(page);
  await openRoutine(page);
  await page
    .getByRole('button', { name: 'Remove Synthetic bench', exact: true })
    .click();
  await page
    .getByRole('button', { name: 'Choose exercises', exact: true })
    .click();
  await page
    .getByRole('button', { name: 'Add Synthetic bench', exact: true })
    .click();
  await expect(
    page.getByRole('button', { name: 'Add Synthetic bench', exact: true }),
  ).toHaveText('Added');
  await page.getByRole('button', { name: 'Done', exact: true }).click();
  await page.getByRole('button', { name: 'Undo removal' }).click();
  await expect(page.getByRole('alert')).toContainText(
    'current values are preserved',
  );
  expect(
    (await snapshot(page)).data.prog[0]!.routines[0]!.vals!.bench![0]!.kg,
  ).toBe('');
  page.once('dialog', (dialog) => dialog.accept());
  await page.getByRole('button', { name: 'Discard unsaved edits' }).click();
  await expect(page.getByRole('alert')).toHaveCount(0);
  await page.getByLabel('Set 1 kg', { exact: true }).fill('45');
  await expect(page.locator('.save-status')).toHaveText('Saved on this device');
  expect(
    (await snapshot(page)).data.prog[0]!.routines[0]!.vals!.bench![0]!.kg,
  ).toBe('45');
});
test('unavailable IndexedDB shows failure, leaves original untouched and retries safely', async ({
  page,
}) => {
  const raw = JSON.stringify(fixture());
  await page.addInitScript((raw) => {
    localStorage.setItem('replift.v1', raw);
    const original = indexedDB.open.bind(indexedDB);
    indexedDB.open = () => {
      indexedDB.open = original;
      throw new DOMException('Synthetic unavailable storage', 'SecurityError');
    };
  }, raw);
  await page.goto('/');
  await expect(page.getByRole('alert')).toContainText(
    'Synthetic unavailable storage',
  );
  expect(await page.evaluate(() => localStorage.getItem('replift.v1'))).toBe(
    raw,
  );
  await page.getByRole('button', { name: 'Retry storage' }).click();
  await expect(page.locator('.save-status')).toHaveText('Saved on this device');
  expect((await snapshot(page)).data.wk).toEqual(fixture().wk);
});
test('quota failure shows unsaved status, preserves input in memory and retries atomically', async ({
  page,
}) => {
  await seed(page);
  await openRoutine(page);
  await page.evaluate(() => {
    const original = IDBObjectStore.prototype.put;
    IDBObjectStore.prototype.put = function (
      ...args: Parameters<typeof original>
    ) {
      if (this.name === 'pending') {
        IDBObjectStore.prototype.put = original;
        throw new DOMException('Synthetic quota', 'QuotaExceededError');
      }
      return original.apply(this, args);
    };
  });
  await page.getByLabel('Set 1 kg', { exact: true }).fill('123.5');
  await expect(page.getByRole('alert')).toContainText('Storage is full');
  await expect(page.getByLabel('Set 1 kg', { exact: true })).toHaveValue(
    '123.5',
  );
  expect(
    (await snapshot(page)).data.prog[0]!.routines[0]!.vals!.bench![0]!.kg,
  ).toBe(20);
  await page.getByRole('button', { name: 'Retry saving' }).click();
  await expect(page.locator('.save-status')).toHaveText('Saved on this device');
  await page.reload();
  await openRoutine(page);
  await expect(page.getByLabel('Set 1 kg', { exact: true })).toHaveValue(
    '123.5',
  );
});
test('two tabs retain independent edits and block old-client changes', async ({
  page,
  context,
}) => {
  const raw = await seed(page);
  await openRoutine(page);
  const other = await context.newPage();
  await other.goto('/');
  await expect(other.locator('.save-status')).toHaveText(
    'Saved on this device',
  );
  await openRoutine(other);
  await Promise.all([
    page.getByLabel('Routine name').fill('Concurrent routine'),
    other.getByLabel('Set 1 kg', { exact: true }).fill('55'),
  ]);
  await expect(page.locator('.save-status')).toHaveText('Saved on this device');
  await expect(other.locator('.save-status')).toHaveText(
    'Saved on this device',
  );
  await expect(page.getByLabel('Set 1 kg', { exact: true })).toHaveValue('55');
  await expect(other.getByLabel('Routine name')).toHaveValue(
    'Concurrent routine',
  );
  await other.evaluate((raw) => {
    const changed = JSON.parse(raw);
    changed.pf.fn = 'Old-client edit';
    localStorage.setItem('replift.v1', JSON.stringify(changed));
  }, raw);
  await expect(page.getByRole('alert')).toContainText('Legacy storage changed');
  await expect(page.getByLabel('Routine name')).toBeDisabled();
  await page.reload();
  await expect(page.getByRole('alert')).toContainText(
    'Both copies are retained',
  );
});
test('new programs and routines save immediately on a clean origin', async ({
  page,
}) => {
  await page.goto('/');
  await expect(page.locator('.save-status')).toHaveText('Saved on this device');
  await page
    .getByRole('button', { name: 'Edit routines', exact: true })
    .click();
  await page.getByRole('button', { name: 'New program', exact: true }).click();
  await page.getByLabel('Program name').fill('New saved program');
  await page.getByRole('button', { name: 'Add routine', exact: true }).click();
  await expect(page.getByLabel('Routine name')).toBeVisible();
  await page.getByLabel('Routine name').fill('Saved routine');
  await expect(page.locator('.save-status')).toHaveText('Saved on this device');
  await page.reload();
  await openRoutine(page, 'Saved routine · Monday');
  await expect(page.getByLabel('Routine name')).toHaveValue('Saved routine');
});
