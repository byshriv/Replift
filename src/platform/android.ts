import { Capacitor } from '@capacitor/core';

export const ANDROID_REDIRECT = 'io.github.byshriv.replift://oauth/dropbox';
export const isAndroid = () => Capacitor.getPlatform() === 'android';

export function androidCallback(value: string): URL | null {
  try {
    const url = new URL(value);
    if (
      `${url.protocol}//${url.host}${url.pathname}` !== ANDROID_REDIRECT ||
      url.username ||
      url.password ||
      url.hash ||
      (!url.searchParams.has('code') && !url.searchParams.has('error')) ||
      (url.searchParams.has('code') && url.searchParams.has('error')) ||
      !url.searchParams.get('state') ||
      ['code', 'state', 'error'].some(
        (key) => url.searchParams.getAll(key).length > 1,
      )
    )
      return null;
    return url;
  } catch {
    return null;
  }
}

// Shared by native warm/cold returns; the two Android delivery paths can overlap.
export function callbackQueue(consume: (url: URL) => Promise<void>) {
  let last = '',
    chain = Promise.resolve();
  return (value: string) => {
    const url = androidCallback(value);
    if (!url || url.href === last) return chain;
    last = url.href;
    chain = chain.then(() => consume(url));
    return chain;
  };
}

export function backController(options: {
  closeSheet: () => boolean;
  home: () => boolean;
  unsaved: () => boolean;
  hint: (message: string) => void;
  exit: () => Promise<void>;
  now?: () => number;
}) {
  let armed: number | null = null;
  return async () => {
    if (options.closeSheet() || options.home()) {
      armed = null;
      return;
    }
    if (options.unsaved()) {
      armed = null;
      options.hint(
        'Keep Replift open: resolve unsaved changes before exiting.',
      );
      return;
    }
    const now = (options.now ?? Date.now)();
    if (armed !== null && now - armed < 2000 && now >= armed) {
      armed = null;
      await options.exit();
    } else {
      armed = now;
      options.hint('Press Back again to exit.');
    }
  };
}

export async function openAuthorization(url: string) {
  if (!isAndroid()) {
    location.assign(url);
    return;
  }
  const { Browser } = await import('@capacitor/browser');
  await Browser.open({ url }); // Android browser Custom Tab, never the app WebView.
}

export async function hapticCheck(enabled: boolean) {
  if (!enabled || !isAndroid()) return;
  try {
    const { Haptics, ImpactStyle } = await import('@capacitor/haptics');
    await Haptics.impact({ style: ImpactStyle.Light });
  } catch {
    /* A missing actuator must never affect saving. */
  }
}

export async function initializeAndroid(
  receive: (url: URL) => Promise<void>,
  back: () => Promise<void>,
) {
  if (!isAndroid()) return () => {};
  const { App } = await import('@capacitor/app');
  const deliver = callbackQueue(receive);
  const link = await App.addListener('appUrlOpen', ({ url }) => {
    void deliver(url);
  });
  const button = await App.addListener('backButton', () => {
    void back();
  });
  const resume = await App.addListener('appStateChange', ({ isActive }) => {
    if (isActive) window.dispatchEvent(new Event('focus'));
  });
  const launch = await App.getLaunchUrl();
  if (launch) await deliver(launch.url);
  return () => {
    void link.remove();
    void button.remove();
    void resume.remove();
  };
}
