import { expect, test } from '@playwright/test';
test('preview navigation and catalogue leave legacy data untouched', async ({
  page,
}) => {
  const errors: string[] = [];
  page.on('pageerror', (error) => errors.push(error.message));
  const external: string[] = [];
  page.on('request', (request) => {
    if (!request.url().startsWith('http://127.0.0.1:4173'))
      external.push(request.url());
  });
  await page.addInitScript(() =>
    localStorage.setItem('replift.v1', '{"synthetic":"preserve-me"}'),
  );
  await page.goto('/');
  await expect(
    page.getByRole('heading', { name: /Good (morning|afternoon|evening)/ }),
  ).toBeVisible();
  await page.getByRole('button', { name: 'Explore the library' }).click();
  await expect(page.getByRole('status')).toHaveText('420 exercises');
  await page.getByLabel('Search exercises').fill('Barbell Bench Press');
  await expect(page.getByRole('status')).toHaveText('3 exercises');
  await expect(
    page.getByRole('heading', { name: 'Barbell Bench Press', exact: true }),
  ).toBeVisible();
  await page.getByLabel('Search exercises').fill('zzzz');
  await expect(page.getByText('No exercises match your search.')).toBeVisible();
  for (const tab of ['Stats', 'Workout', 'Settings']) {
    await page
      .getByRole('navigation')
      .getByRole('button', { name: tab, exact: true })
      .click();
    await expect(page.locator('header time')).toBeVisible();
    await expect(
      page.getByRole('button', { name: 'Open profile' }),
    ).toBeVisible();
  }
  await expect(
    page.getByRole('link', { name: 'Report an issue on GitHub' }),
  ).toHaveAttribute(
    'href',
    'https://github.com/byshriv/Replift/issues/new/choose',
  );
  await page.reload();
  expect(await page.evaluate(() => localStorage.getItem('replift.v1'))).toBe(
    '{"synthetic":"preserve-me"}',
  );
  // Phase 5 registers the shell even when legacy data needs recovery.
  const worker = await page.evaluate(async () => {
    const registration = await navigator.serviceWorker.ready;
    return registration.active?.scriptURL;
  });
  expect(worker).toBe('http://127.0.0.1:4173/sw.js');
  expect(
    await page.evaluate(
      () => document.documentElement.scrollWidth <= window.innerWidth,
    ),
  ).toBe(true);
  expect(errors).toEqual([]);
  expect(external).toEqual([]);
});
test('skip link moves focus to main content', async ({ page, browserName }) => {
  await page.goto('/');
  // Mobile WebKit does not enable full keyboard link traversal by default.
  // Verify activation there; Chromium also verifies discovery through Tab.
  if (browserName === 'webkit') {
    await page.getByRole('link', { name: 'Skip to content' }).focus();
  } else {
    await page.keyboard.press('Tab');
  }
  await expect(
    page.getByRole('link', { name: 'Skip to content' }),
  ).toBeFocused();
  await page.keyboard.press('Enter');
  await expect(page.getByRole('main')).toBeFocused();
});
