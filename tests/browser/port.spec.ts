import { expect, test, type Page } from '@playwright/test';
import { fixture } from '../fixtures/local';
async function snapshot(page: Page) {
  return page.evaluate(async () => {
    const db = await new Promise<IDBDatabase>((resolve, reject) => {
      const r = indexedDB.open('replift.local.v2');
      r.onsuccess = () => resolve(r.result);
      r.onerror = () => reject(r.error);
    });
    const state = await new Promise<import('../../src/data/local').Snapshot>(
      (resolve) => {
        const r = db.transaction('state').objectStore('state').get('current');
        r.onsuccess = () => resolve(r.result);
      },
    );
    db.close();
    return state;
  });
}
async function seed(page: Page, weightedHistory = false) {
  const d = fixture();
  d.draft = null;
  if (weightedHistory) d.wk[0]!.items[0]!.sets[0]!.est = 0;
  d.st = { u: 'kg', sets: 3 };
  d.ex[0]!.m = 'Chest';
  d.ex[0]!.e = 'Barbell';
  await page.addInitScript((raw) => {
    if (!localStorage.getItem('replift.v1'))
      localStorage.setItem('replift.v1', raw);
  }, JSON.stringify(d));
  await page.goto('/');
  await saved(page);
  return d;
}
async function saved(page: Page) {
  await expect(page.locator('.save-status')).toHaveText('Saved on this device');
}
async function tab(page: Page, name: string) {
  await page
    .getByRole('navigation')
    .getByRole('button', { name, exact: true })
    .click();
}
test('logging draft survives reload; finishing validates duration, clamps date and preserves other collections', async ({
  page,
}) => {
  const d = await seed(page);
  await tab(page, 'Workout');
  await page
    .getByRole('button', { name: 'Start Routine', exact: true })
    .click();
  await page.getByLabel('Exercise 1 set 1 kg', { exact: true }).fill('55');
  await page.getByLabel('Exercise 1 set 1 reps', { exact: true }).fill('10');
  await page
    .getByRole('button', { name: 'Complete exercise 1 set 1', exact: true })
    .click();
  await saved(page);
  await page.reload();
  await tab(page, 'Workout');
  await expect(
    page.getByLabel('Exercise 1 set 1 kg', { exact: true }),
  ).toHaveValue('55');
  await expect(
    page.getByRole('button', {
      name: 'Complete exercise 1 set 1',
      exact: true,
    }),
  ).toHaveAttribute('aria-pressed', 'true');
  await page
    .getByRole('button', { name: 'Finish workout', exact: true })
    .click();
  await expect(
    page.getByRole('button', { name: 'Save workout', exact: true }),
  ).toBeDisabled();
  await page.getByLabel('Duration (minutes, required)').fill('35');
  await page
    .getByLabel('Workout title', { exact: true })
    .fill('Synthetic finished workout');
  await page.getByLabel('Workout date and time').fill('2099-01-01T12:00');
  await page.getByRole('button', { name: 'Save workout', exact: true }).click();
  await expect(
    page.getByRole('dialog', { name: 'Well done', exact: true }),
  ).toBeVisible();
  await saved(page);
  const after = (await snapshot(page)).data;
  expect(after.wk).toHaveLength(2);
  expect(after.wk.at(-1)!.t).toBeLessThanOrEqual(Date.now());
  expect(after.wk.at(-1)!.dur).toBe(35);
  expect(after.draft).toBeNull();
  expect(after.ms).toEqual(d.ms);
  expect(after.ph).toEqual(d.ph);
  expect(after.unknownFutureField).toEqual(d.unknownFutureField);
  expect(after.prog[0]!.routines[0]!.vals!.bench![0]!.kg).toBe('55');
  await page
    .getByRole('dialog', { name: 'Well done' })
    .getByRole('button', { name: 'Continue', exact: true })
    .click();
  await tab(page, 'Stats');
  await page.getByRole('button', { name: 'History', exact: true }).click();
  await page
    .getByRole('button', { name: /Synthetic finished workout/ })
    .click();
  await expect(
    page.getByRole('dialog', { name: 'Workout details' }),
  ).toContainText('55 × 10');
});
test('all exercise types reject incomplete input and raw autofill survives navigation/reload', async ({
  page,
}) => {
  await seed(page);
  await tab(page, 'Workout');
  await page
    .getByRole('button', { name: 'Start empty workout', exact: true })
    .click();
  await page
    .getByRole('button', { name: 'Add workout exercise', exact: true })
    .click();
  await page
    .getByRole('button', { name: 'Log Synthetic run', exact: true })
    .click();
  await expect(
    page.getByRole('button', {
      name: 'Complete exercise 1 set 1',
      exact: true,
    }),
  ).toBeDisabled();
  await page.getByLabel('Exercise 1 set 1 km', { exact: true }).fill('2.');
  await page.getByLabel('Exercise 1 set 1 minutes', { exact: true }).fill('15');
  await saved(page);
  await page.reload();
  await tab(page, 'Workout');
  await expect(
    page.getByLabel('Exercise 1 set 1 km', { exact: true }),
  ).toHaveValue('2.');
  await expect(
    page.getByLabel('Exercise 1 set 2 km', { exact: true }),
  ).toHaveValue('2.');
  await page.getByLabel('Exercise 1 set 1 km', { exact: true }).fill('2.5');
  await page
    .getByRole('button', { name: 'Complete exercise 1 set 1', exact: true })
    .click();
  await expect(
    page.getByRole('button', {
      name: 'Complete exercise 1 set 1',
      exact: true,
    }),
  ).toHaveAttribute('aria-pressed', 'true');
  await tab(page, 'Home');
  await expect(
    page.getByRole('button', { name: /Resume Workout/ }),
  ).toBeVisible();
});
test('set menus persist kind/RPE and duplicate resets completion; history edit preserves identity', async ({
  page,
}) => {
  await seed(page);
  await tab(page, 'Stats');
  await page.getByRole('button', { name: 'History', exact: true }).click();
  await page.getByRole('button', { name: /Synthetic history/ }).click();
  await page.getByRole('button', { name: 'Edit workout', exact: true }).click();
  await page.getByRole('button', { name: 'Set 1 menu', exact: true }).click();
  await page.getByRole('button', { name: 'Drop', exact: true }).click();
  await page.getByRole('button', { name: 'Set 1 menu', exact: true }).click();
  await page.getByLabel('RPE', { exact: true }).selectOption('8.5');
  await saved(page);
  await page
    .getByRole('button', { name: 'Duplicate set', exact: true })
    .click();
  await expect(
    page.getByRole('button', {
      name: 'Complete exercise 1 set 2',
      exact: true,
    }),
  ).toHaveAttribute('aria-pressed', 'false');
  const d = (await snapshot(page)).data;
  expect(d.draft!.id).toBe('w');
  expect(d.draft!.items[0]!.sets[1]).toMatchObject({
    k: 'd',
    rpe: 8.5,
    done: 0,
  });
  expect(d.wk).toHaveLength(1);
});
test('custom exercise and favourite survive reload; bundled catalogue stays read-only', async ({
  page,
}) => {
  await page.goto('/');
  await saved(page);
  await tab(page, 'Library');
  await page.getByRole('button', { name: 'New exercise', exact: true }).click();
  await page.getByLabel('Exercise name').fill('Synthetic custom lift');
  await page.getByLabel('Primary muscle').selectOption('Back');
  await page.getByLabel('Logging type').selectOption('wb');
  await page
    .getByRole('button', { name: 'Save exercise', exact: true })
    .click();
  await saved(page);
  await page.getByLabel('Search exercises').fill('Synthetic custom lift');
  await page
    .getByRole('button', {
      name: 'Favourite Synthetic custom lift',
      exact: true,
    })
    .click();
  await saved(page);
  await page.reload();
  await tab(page, 'Library');
  await page.getByLabel('Show', { exact: true }).selectOption('favourites');
  await expect(page.getByRole('status')).toHaveText('1 exercises');
  await page
    .getByRole('heading', { name: 'Synthetic custom lift', exact: true })
    .click();
  await expect(page.getByLabel('Logging type')).toHaveValue('wb');
  await page.getByRole('button', { name: 'Close Custom exercise' }).click();
  await page
    .getByRole('button', { name: 'Clear filters', exact: true })
    .click();
  await page.getByLabel('Search exercises').fill('Barbell Bench Press');
  await page
    .getByRole('heading', { name: 'Barbell Bench Press', exact: true })
    .click();
  await expect(
    page.getByRole('dialog', { name: 'Exercise details' }),
  ).toContainText('Read-only');
  await expect(page.getByLabel('Exercise name')).toHaveCount(0);
});
test('onboarding selects without advancing and persists choose-then-Continue through reload', async ({
  page,
}) => {
  await page.goto('/');
  await saved(page);
  await page.getByRole('button', { name: 'Get started', exact: true }).click();
  await page.getByRole('button', { name: 'Female', exact: true }).click();
  await expect(
    page.getByRole('heading', { name: 'About you', exact: true }),
  ).toBeVisible();
  await saved(page);
  await page.reload();
  await expect(
    page.getByRole('button', { name: 'Female', exact: true }),
  ).toHaveAttribute('aria-pressed', 'true');
  await page.getByRole('button', { name: 'Continue', exact: true }).click();
  await page.getByLabel('Your first name').fill('Synthetic');
  await saved(page);
  await page.getByRole('button', { name: 'Continue', exact: true }).click();
  await expect(
    page.getByRole('heading', {
      name: 'Used a workout logger before?',
      exact: true,
    }),
  ).toBeVisible();
  expect((await snapshot(page)).data.pf).toMatchObject({
    g: 'Female',
    fn: 'Synthetic',
  });
});
test('measurement, layout and profile changes survive reload without replacing history', async ({
  page,
}) => {
  const before = await seed(page);
  await tab(page, 'Stats');
  await page.getByRole('button', { name: 'Measures', exact: true }).click();
  await page.getByLabel('Measurement (kg)', { exact: true }).fill('75');
  await page
    .getByRole('button', { name: 'Save measurement', exact: true })
    .click();
  await saved(page);
  await tab(page, 'Settings');
  await page
    .getByLabel('First name', { exact: true })
    .fill('Synthetic updated');
  await page.getByLabel('Units', { exact: true }).selectOption('lb');
  await saved(page);
  await page.reload();
  await tab(page, 'Stats');
  await page.getByRole('button', { name: 'Measures', exact: true }).click();
  await expect(
    page.getByLabel('Measurement (lb)', { exact: true }),
  ).toBeVisible();
  expect((await snapshot(page)).data.ms!['Body weight']!.at(-1)!.v).toBe(75);
  await tab(page, 'Home');
  await page.getByRole('button', { name: 'Edit blocks', exact: true }).click();
  await page
    .getByRole('button', { name: 'Remove block Today', exact: true })
    .click();
  await saved(page);
  await page.getByRole('button', { name: 'Done', exact: true }).click();
  await page.reload();
  expect((await snapshot(page)).data.lay!.home).toEqual([]);
  expect((await snapshot(page)).data.wk).toEqual(before.wk);
  await expect(
    page.getByRole('heading', { name: /Synthetic updated/ }),
  ).toBeVisible();
});
test('local deletion warns about pending data, requires Other text and typed confirmation', async ({
  page,
}) => {
  await seed(page);
  await tab(page, 'Settings');
  await page
    .getByRole('button', { name: 'Delete local profile', exact: true })
    .click();
  await expect(
    page.getByRole('dialog', { name: 'Delete local profile' }),
  ).toContainText('pending acknowledgement');
  await page.getByLabel('Why are you leaving?').selectOption('Other');
  await page.getByLabel('Type delete to confirm').fill('delete');
  await expect(
    page.getByRole('button', {
      name: 'Delete everything on this device',
      exact: true,
    }),
  ).toBeDisabled();
  await page
    .getByLabel('Tell us why (required)')
    .fill('Synthetic browser trial');
  await expect(
    page.getByRole('button', {
      name: 'Delete everything on this device',
      exact: true,
    }),
  ).toBeEnabled();
  await page
    .getByRole('button', { name: 'Close Delete local profile', exact: true })
    .click();
  expect((await snapshot(page)).data.wk).toHaveLength(1);
});
test('share image downloads a PNG and retains workout data', async ({
  page,
}) => {
  await seed(page);
  await page.evaluate(() =>
    Object.defineProperty(navigator, 'canShare', {
      value: () => false,
      configurable: true,
    }),
  );
  await tab(page, 'Stats');
  await page.getByRole('button', { name: 'History', exact: true }).click();
  await page.getByRole('button', { name: /Synthetic history/ }).click();
  await page
    .getByRole('button', { name: 'View and share cards', exact: true })
    .click();
  const download = page.waitForEvent('download');
  await page
    .getByRole('button', { name: 'Share this card', exact: true })
    .first()
    .click();
  expect((await download).suggestedFilename()).toBe('replift-card.png');
  expect((await snapshot(page)).data.wk).toHaveLength(1);
});

test('reconstruction ranks and applies all unfinished sets with estimate log', async ({
  page,
}) => {
  await seed(page, true);
  await tab(page, 'Workout');
  await page
    .getByRole('button', { name: 'Start Routine', exact: true })
    .click();
  await page
    .getByRole('button', { name: 'Add workout set', exact: true })
    .click();
  await saved(page);
  await page
    .getByRole('button', { name: 'Estimate a set', exact: true })
    .click();
  await page.getByRole('button', { name: 'All sets', exact: true }).click();
  await page.getByLabel('Remembered weight (kg)').fill('20');
  await page.getByRole('button', { name: 'Estimate', exact: true }).click();
  await expect(page.getByRole('button', { name: /Best estimate/ })).toHaveCount(
    2,
  );
  await page
    .getByRole('button', { name: 'Use these estimates', exact: true })
    .click();
  await saved(page);
  const d = (await snapshot(page)).data;
  expect(d.draft!.items[0]!.sets).toHaveLength(2);
  expect(
    d.draft!.items[0]!.sets.every(
      (s) => s.est === 1 && s.done === 1 && s.pr === 0,
    ),
  ).toBe(true);
  expect(d.pl).toHaveLength(3);
});
test('new photos compress while original bytes survive save/reload and comparison', async ({
  page,
}) => {
  await seed(page);
  const source = await page.evaluate(() => {
    const c = document.createElement('canvas');
    c.width = 800;
    c.height = 600;
    const x = c.getContext('2d')!;
    x.fillStyle = '#62d391';
    x.fillRect(0, 0, 800, 600);
    return c.toDataURL('image/png');
  });
  await tab(page, 'Stats');
  await page.getByRole('button', { name: 'Photos', exact: true }).click();
  await page.getByLabel('Progress photo', { exact: true }).setInputFiles({
    name: 'synthetic.png',
    mimeType: 'image/png',
    buffer: Buffer.from(source.split(',')[1]!, 'base64'),
  });
  await expect(page.getByAltText('New progress preview')).toBeVisible();
  await page
    .getByRole('button', { name: 'Save progress photo', exact: true })
    .click();
  await saved(page);
  const d = (await snapshot(page)).data;
  expect(d.ph).toHaveLength(2);
  expect(d.ph!.at(-1)!.img).toMatch(/^data:image\/jpeg/);
  expect(d.ph!.at(-1)!.originalImg).toBe(source);
  await page.reload();
  await tab(page, 'Stats');
  await page.getByRole('button', { name: 'Photos', exact: true }).click();
  await page.locator('.photo-button').first().click();
  await page.locator('.photo-button').last().click();
  await page
    .getByRole('button', { name: 'Compare selected photos (2)', exact: true })
    .click();
  await expect(
    page
      .getByRole('dialog', { name: 'Compare progress photos' })
      .locator('img'),
  ).toHaveCount(2);
});
test('browser Back closes the top sheet before returning Home and keeps saved edits', async ({
  page,
}) => {
  await seed(page);
  await tab(page, 'Workout');
  await page
    .getByRole('button', { name: 'Start Routine', exact: true })
    .click();
  await page.getByLabel('Exercise 1 set 1 kg', { exact: true }).fill('42');
  await saved(page);
  await page.getByRole('button', { name: 'Set 1 menu', exact: true }).click();
  await expect(page.getByRole('dialog', { name: 'Set options' })).toBeVisible();
  await page.evaluate(() => history.back());
  await expect(page.getByRole('dialog', { name: 'Set options' })).toHaveCount(
    0,
  );
  await expect(
    page.getByRole('heading', { name: 'Workout', exact: true }),
  ).toBeVisible();
  await page.evaluate(() => history.back());
  await expect(
    page.getByRole('heading', { name: /Good (morning|afternoon|evening)/ }),
  ).toBeVisible();
  expect((await snapshot(page)).data.draft!.items[0]!.sets[0]!.kg).toBe('42');
});
test('full local erasure leaves a fresh profile and does not delete unrelated storage', async ({
  page,
}) => {
  await page.goto('/');
  await saved(page);
  await page.evaluate(() => localStorage.setItem('unrelated-test', 'keep'));
  await tab(page, 'Workout');
  await page.getByRole('button', { name: 'New program', exact: true }).click();
  await saved(page);
  expect((await snapshot(page)).data.prog).toHaveLength(1);
  await tab(page, 'Settings');
  await page
    .getByRole('button', { name: 'Delete local profile', exact: true })
    .click();
  await page.getByLabel('Why are you leaving?').selectOption('Other');
  await page
    .getByLabel('Tell us why (required)')
    .fill('Synthetic removal test');
  await page.getByLabel('Type delete to confirm').fill('delete');
  await page
    .getByRole('button', {
      name: 'Delete everything on this device',
      exact: true,
    })
    .click();
  await expect(
    page.getByRole('button', { name: 'Get started', exact: true }),
  ).toBeVisible();
  await saved(page);
  expect((await snapshot(page)).data.prog).toEqual([]);
  expect(
    await page.evaluate(() => localStorage.getItem('unrelated-test')),
  ).toBe('keep');
});
test('dashboard charts, muscle selection and template preview fit the viewport', async ({
  page,
}, testInfo) => {
  const errors: string[] = [];
  page.on('pageerror', (e) => errors.push(e.message));
  await page.goto('/');
  await saved(page);
  await tab(page, 'Library');
  await page.getByText('Programs and templates', { exact: true }).click();
  await page
    .getByRole('button', { name: 'Add template Full Body', exact: true })
    .click();
  await saved(page);
  await tab(page, 'Stats');
  await page
    .getByRole('button', { name: 'Chest recovery', exact: true })
    .first()
    .press('Enter');
  await expect(page.getByText(/Chest · 0 sets · 100% recovered/)).toBeVisible();
  expect(
    await page.evaluate(
      () => document.documentElement.scrollWidth <= innerWidth,
    ),
  ).toBe(true);
  await tab(page, 'Home');
  expect(
    await page.evaluate(() =>
      [...document.querySelectorAll('.block')].every(
        (el) => el.scrollWidth <= el.clientWidth,
      ),
    ),
  ).toBe(true);
  await page.evaluate(() => window.scrollTo(0, 0));
  if (
    testInfo.project.name === 'mobile-chromium' ||
    testInfo.project.name === 'chromium'
  )
    await page.screenshot({
      path: `artifacts/phase-4-${testInfo.project.name}.png`,
      fullPage: true,
    });
  expect(errors).toEqual([]);
});
