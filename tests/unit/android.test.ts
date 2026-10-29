import { afterEach, expect, it, vi } from 'vitest';
import {
  ANDROID_REDIRECT,
  androidCallback,
  backController,
  callbackQueue,
} from '../../src/platform/android';
import { beginOAuth, finishOAuth } from '../../src/sync/dropbox';
import { LocalRepository, openDatabase } from '../../src/data/local';
import { device } from '../fixtures/sync';

afterEach(() => {
  vi.restoreAllMocks();
  vi.unstubAllGlobals();
});

it('accepts only exact Android return routes and rejects ambiguous parameters', () => {
  expect(
    androidCallback(`${ANDROID_REDIRECT}?code=fake&state=state`),
  ).not.toBeNull();
  for (const value of [
    'https://oauth/dropbox?code=x&state=y',
    `${ANDROID_REDIRECT}/?code=x&state=y`,
    `${ANDROID_REDIRECT}?code=x&state=y#fragment`,
    `${ANDROID_REDIRECT}?code=x&state=y&state=z`,
    'io.github.byshriv.replift://user@oauth/dropbox?code=x&state=y',
    `${ANDROID_REDIRECT}?code=x`,
    'invalid',
  ])
    expect(androidCallback(value)).toBeNull();
});
it('serializes warm/cold duplicate deliveries without exchanging the same code twice', async () => {
  const consume = vi.fn(async () => {}),
    deliver = callbackQueue(consume);
  await Promise.all([
    deliver(`${ANDROID_REDIRECT}?code=a&state=s`),
    deliver(`${ANDROID_REDIRECT}?code=a&state=s`),
  ]);
  await deliver('https://invalid.test/?code=a&state=s');
  expect(consume).toHaveBeenCalledTimes(1);
});
it('closes sheets, returns Home, arms exit and refuses to exit with failed/pending saves', async () => {
  let sheet = true,
    tab = 'Settings',
    unsaved = false,
    now = 10;
  const exit = vi.fn(async () => {}),
    hint = vi.fn();
  const back = backController({
    closeSheet: () => {
      if (!sheet) return false;
      sheet = false;
      return true;
    },
    home: () => {
      if (tab === 'Home') return false;
      tab = 'Home';
      return true;
    },
    unsaved: () => unsaved,
    hint,
    exit,
    now: () => now,
  });
  await back();
  expect(tab).toBe('Settings');
  await back();
  expect(tab).toBe('Home');
  await back();
  expect(exit).not.toHaveBeenCalled();
  unsaved = true;
  await back();
  await back();
  expect(exit).not.toHaveBeenCalled();
  unsaved = false;
  await back();
  now += 2100;
  await back();
  expect(exit).not.toHaveBeenCalled();
  now += 100;
  await back();
  expect(exit).toHaveBeenCalledTimes(1);
  expect(hint).toHaveBeenCalledWith(expect.stringContaining('unsaved'));
});
it('resumes persisted Android PKCE after repository restart; secrets never enter the backup', async () => {
  const d = await device();
  const before = (await d.repo.read()).data;
  const authorization = new URL(await beginOAuth(d.repo, ANDROID_REDIRECT));
  d.repo.close();
  const reopened = new LocalRepository(await openDatabase(d.factory));
  const fetch = vi.fn(async (url: string, options?: RequestInit) => {
    if (url.endsWith('/oauth2/token')) {
      const body = options?.body as URLSearchParams;
      expect(body.get('redirect_uri')).toBe(ANDROID_REDIRECT);
      expect(body.get('code_verifier')!.length).toBeGreaterThan(42);
      expect(body.has('client_secret')).toBe(false);
      return Response.json({
        access_token: 'native-test-access',
        refresh_token: 'native-test-refresh',
        expires_in: 3600,
      });
    }
    return Response.json({ account_id: 'native-test-account' });
  });
  vi.stubGlobal('fetch', fetch);
  const callback = new URL(
    `${ANDROID_REDIRECT}?code=synthetic&state=${authorization.searchParams.get('state')}`,
  );
  expect((await finishOAuth(reopened, callback))?.account).toBe(
    'native-test-account',
  );
  expect((await reopened.read()).data).toEqual(before);
  expect(await reopened.privateRead('oauth')).toBeNull();
  await expect(finishOAuth(reopened, callback)).rejects.toThrow('state');
  expect(fetch).toHaveBeenCalledTimes(2);
  const backup = await reopened.backup();
  for (const value of [
    'native-test-refresh',
    'native-test-access',
    'code_verifier',
  ])
    expect(backup).not.toContain(value);
  reopened.close();
});
it('rejects cancelled/expired/wrong-state native returns without changing saved content', async () => {
  const d = await device(),
    before = (await d.repo.read()).data;
  vi.stubGlobal('fetch', vi.fn());
  for (const reason of ['cancel', 'expired', 'state']) {
    const auth = new URL(await beginOAuth(d.repo, ANDROID_REDIRECT));
    const pending = await d.repo.privateRead<{ at: number }>('oauth');
    if (reason === 'expired')
      await d.repo.privateWrite('oauth', {
        ...pending,
        at: Date.now() - 700000,
      });
    const url = new URL(ANDROID_REDIRECT);
    url.searchParams.set(reason === 'cancel' ? 'error' : 'code', 'synthetic');
    url.searchParams.set(
      'state',
      reason === 'state' ? 'wrong' : auth.searchParams.get('state')!,
    );
    await expect(finishOAuth(d.repo, url)).rejects.toThrow();
    expect((await d.repo.read()).data).toEqual(before);
  }
  expect(fetch).not.toHaveBeenCalled();
  d.repo.close();
});
