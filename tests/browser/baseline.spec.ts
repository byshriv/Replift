import { expect, test } from '@playwright/test';
test.use({ serviceWorkers: 'block' });
test('preserved reference boots, adopts a template and retains a synthetic draft', async ({
  page,
}) => {
  const errors: string[] = [];
  page.on('pageerror', (error) => errors.push(error.message));
  // No live service access. This is synthetic local reference coverage only.
  await page.route('**/*', (route) =>
    route.request().url().startsWith('http://127.0.0.1:4174')
      ? route.continue()
      : route.abort(),
  );
  await page.goto('http://127.0.0.1:4174');
  await expect(page.locator('body')).toContainText('Replift');
  await page.evaluate(() => {
    const stored = JSON.parse(localStorage.getItem('replift.v1')!);
    stored.ob = { done: 1, i: -1, m: '' };
    stored.pf = { fn: 'Synthetic', days: 1 };
    localStorage.setItem('replift.v1', JSON.stringify(stored));
  });
  await page.reload();
  await page.locator('[data-a="tab"][data-v="lib"]').click();
  await expect(
    page.getByRole('heading', { name: 'Library', exact: true }),
  ).toBeVisible();
  await page.locator('[data-a="tpl"]').first().click();
  await page.locator('[data-a="tab"][data-v="work"]').click();
  await page.locator('[data-a="start"][data-r]').first().click();
  await expect(page.getByText('Finish workout', { exact: true })).toBeVisible();
  const before = await page.evaluate(() => {
    const data = JSON.parse(localStorage.getItem('replift.v1')!);
    return {
      exercises: data.ex.length,
      programs: data.prog.length,
      draft: data.draft,
    };
  });
  expect(before.exercises).toBe(420);
  expect(before.programs).toBe(1);
  expect(before.draft.items.length).toBeGreaterThan(0);
  await page.reload();
  expect(
    await page.evaluate(
      () => JSON.parse(localStorage.getItem('replift.v1')!).draft,
    ),
  ).toEqual(before.draft);
  expect(errors).toEqual([]);
});
