import type { Connection, LocalRepository } from '../data/local';

export const CLOUD_PATH = '/replift-v3.json';
export const LEGACY_PATH = '/replift-data.json';
export const APP_KEY =
  import.meta.env?.VITE_DROPBOX_APP_KEY || 'gs2p3dras9gv94g';
export const MAX_FILE = 32 * 1024 * 1024;
export type Remote = { body: string; rev: string };
export interface Provider {
  download(path: string, signal: AbortSignal): Promise<Remote | null>;
  upload(
    path: string,
    body: string,
    rev: string | null,
    signal: AbortSignal,
  ): Promise<string>;
}
export class ProviderError extends Error {
  constructor(
    public kind: 'race' | 'auth' | 'rate' | 'network' | 'invalid',
    message: string,
    public retryAfter = 0,
  ) {
    super(message);
  }
}
export async function boundedText(
  response: Response,
  limit = MAX_FILE,
): Promise<string> {
  if (Number(response.headers.get('Content-Length')) > limit)
    throw new ProviderError(
      'invalid',
      'Dropbox file is too large; original retained.',
    );
  const reader = response.body?.getReader();
  if (!reader) return '';
  const decoder = new TextDecoder('utf-8', { fatal: true });
  let size = 0,
    text = '';
  try {
    for (;;) {
      const { value, done } = await reader.read();
      if (done) break;
      size += value.byteLength;
      if (size > limit)
        throw new ProviderError(
          'invalid',
          'Dropbox file is too large; original retained.',
        );
      text += decoder.decode(value, { stream: true });
    }
    return text + decoder.decode();
  } finally {
    await reader.cancel();
  }
}
async function check(
  response: Response,
  downloading = false,
): Promise<boolean> {
  if (response.ok) return true;
  const text = await boundedText(response, 64 * 1024);
  let error: unknown;
  try {
    error = JSON.parse(text);
  } catch {
    /* report fixed messages, never token-bearing server text */
  }
  const summary =
    error && typeof error === 'object' && 'error_summary' in error
      ? String(error.error_summary)
      : '';
  if (
    response.status === 409 &&
    downloading &&
    summary.startsWith('path/not_found/')
  )
    return false;
  if (
    response.status === 409 &&
    !downloading &&
    summary.startsWith('path/conflict/')
  )
    throw new ProviderError(
      'race',
      'Dropbox changed during upload. Retrying safely.',
    );
  if (response.status === 401)
    throw new ProviderError(
      'auth',
      'Dropbox authorization expired or was revoked. Reconnect to continue.',
    );
  if (response.status === 429) {
    const header = response.headers.get('Retry-After');
    const retry = header === null ? Number.NaN : Number(header);
    throw new ProviderError(
      'rate',
      'Dropbox is busy. Local changes remain saved; retry later.',
      Number.isFinite(retry) ? Math.max(1, retry) * 1000 : 60_000,
    );
  }
  throw new ProviderError(
    'network',
    `Dropbox request failed (${response.status}). Local changes remain pending.`,
  );
}
async function tokenRequest(params: URLSearchParams, signal?: AbortSignal) {
  const response = await fetch('https://api.dropboxapi.com/oauth2/token', {
    method: 'POST',
    body: params,
    signal: signal ?? AbortSignal.timeout(30_000),
  });
  if (!response.ok)
    throw new ProviderError(
      'auth',
      'Dropbox authorization failed. Reconnect to continue.',
    );
  const value: unknown = JSON.parse(await boundedText(response, 64 * 1024));
  if (
    !value ||
    typeof value !== 'object' ||
    !('access_token' in value) ||
    typeof value.access_token !== 'string' ||
    !('expires_in' in value) ||
    typeof value.expires_in !== 'number'
  )
    throw new ProviderError('invalid', 'Invalid Dropbox token response.');
  return {
    access: value.access_token,
    expires: Date.now() + value.expires_in * 1000,
    refresh:
      'refresh_token' in value && typeof value.refresh_token === 'string'
        ? value.refresh_token
        : '',
  };
}
// Dropbox-API-Arg is an HTTP header: encode all non-ASCII characters safely.
const headerJSON = (value: unknown) =>
  JSON.stringify(value).replace(
    /[\u007f-\uffff]/g,
    (s) => `\\u${s.charCodeAt(0).toString(16).padStart(4, '0')}`,
  );
export class DropboxProvider implements Provider {
  constructor(
    private repo: LocalRepository,
    private connection: Connection,
    private credentialKey = 'connection',
  ) {}
  private async access(signal: AbortSignal) {
    const current = await this.repo.privateRead<Connection>(this.credentialKey);
    if (
      current?.generation !== this.connection.generation ||
      current.account !== this.connection.account
    )
      throw new Error('Connection changed.');
    if (this.connection.expires <= Date.now() + 60_000) {
      const token = await tokenRequest(
        new URLSearchParams({
          grant_type: 'refresh_token',
          refresh_token: this.connection.refresh,
          client_id: APP_KEY,
        }),
        signal,
      );
      this.connection = {
        ...this.connection,
        ...token,
        refresh: token.refresh || this.connection.refresh,
      };
      await this.repo.saveCredentials(this.connection, this.credentialKey);
    }
    return this.connection.access;
  }
  async download(path: string, signal: AbortSignal): Promise<Remote | null> {
    const access = await this.access(signal);
    const response = await fetch(
      'https://content.dropboxapi.com/2/files/download',
      {
        method: 'POST',
        headers: {
          Authorization: `Bearer ${access}`,
          'Dropbox-API-Arg': headerJSON({ path }),
        },
        signal,
      },
    );
    if (!(await check(response, true))) return null;
    const meta: unknown = JSON.parse(
      response.headers.get('Dropbox-API-Result') ?? 'null',
    );
    if (
      !meta ||
      typeof meta !== 'object' ||
      !('rev' in meta) ||
      typeof meta.rev !== 'string'
    )
      throw new ProviderError('invalid', 'Missing Dropbox revision.');
    return { rev: meta.rev, body: await boundedText(response) };
  }
  async upload(
    path: string,
    body: string,
    rev: string | null,
    signal: AbortSignal,
  ): Promise<string> {
    if (new TextEncoder().encode(body).byteLength > MAX_FILE)
      throw new ProviderError(
        'invalid',
        'File exceeds the safe transfer size. Export a backup; data retained.',
      );
    const access = await this.access(signal);
    const response = await fetch(
      'https://content.dropboxapi.com/2/files/upload',
      {
        method: 'POST',
        headers: {
          Authorization: `Bearer ${access}`,
          'Content-Type': 'application/octet-stream',
          'Dropbox-API-Arg': headerJSON({
            path,
            mode:
              rev === null
                ? { '.tag': 'add' }
                : { '.tag': 'update', update: rev },
            autorename: false,
            strict_conflict: true,
            mute: true,
          }),
        },
        body,
        signal,
      },
    );
    await check(response);
    const result: unknown = JSON.parse(await boundedText(response, 64 * 1024));
    if (
      !result ||
      typeof result !== 'object' ||
      !('rev' in result) ||
      typeof result.rev !== 'string'
    )
      throw new ProviderError(
        'invalid',
        'Missing upload acknowledgement. Local work remains pending.',
      );
    return result.rev;
  }
}
const encode = (bytes: Uint8Array) =>
  btoa(String.fromCharCode(...bytes))
    .replace(/\+/g, '-')
    .replace(/\//g, '_')
    .replace(/=+$/, '');
type OAuthPending = {
  state: string;
  verifier: string;
  redirect: string;
  at: number;
};
export async function beginOAuth(
  repo: LocalRepository,
  redirect: string,
): Promise<string> {
  const verifier = encode(crypto.getRandomValues(new Uint8Array(64)));
  const state = encode(crypto.getRandomValues(new Uint8Array(32)));
  const challenge = encode(
    new Uint8Array(
      await crypto.subtle.digest('SHA-256', new TextEncoder().encode(verifier)),
    ),
  );
  await repo.privateWrite('oauth', {
    state,
    verifier,
    redirect,
    at: Date.now(),
  } satisfies OAuthPending);
  return `https://www.dropbox.com/oauth2/authorize?${new URLSearchParams({ client_id: APP_KEY, response_type: 'code', redirect_uri: redirect, state, code_challenge: challenge, code_challenge_method: 'S256', token_access_type: 'offline', scope: 'files.content.read files.content.write files.metadata.read account_info.read' })}`;
}
export async function finishOAuth(
  repo: LocalRepository,
  url: URL,
): Promise<Connection | null> {
  if (!url.searchParams.has('code') && !url.searchParams.has('error'))
    return null;
  const pending = await repo.privateRead<OAuthPending>('oauth');
  await repo.privateWrite('oauth', null); // single-use, including failure/cancellation
  if (
    !pending ||
    url.searchParams.get('state') !== pending.state ||
    Date.now() - pending.at > 10 * 60_000 ||
    Date.now() < pending.at ||
    `${url.protocol}//${url.host}${url.pathname}` !== pending.redirect ||
    !!url.username ||
    !!url.password ||
    !!url.hash ||
    ['code', 'state', 'error'].some(
      (key) => url.searchParams.getAll(key).length > 1,
    )
  )
    throw new Error(
      'Dropbox sign-in state expired or did not match. Connect again.',
    );
  if (url.searchParams.has('error'))
    throw new Error('Dropbox sign-in was cancelled. Local data is retained.');
  const token = await tokenRequest(
    new URLSearchParams({
      grant_type: 'authorization_code',
      code: url.searchParams.get('code')!,
      code_verifier: pending.verifier,
      client_id: APP_KEY,
      redirect_uri: pending.redirect,
    }),
  );
  if (!token.refresh)
    throw new Error(
      'Dropbox did not return offline authorization. Connect again.',
    );
  const response = await fetch(
    'https://api.dropboxapi.com/2/users/get_current_account',
    {
      method: 'POST',
      headers: { Authorization: `Bearer ${token.access}` },
      signal: AbortSignal.timeout(30_000),
    },
  );
  await check(response);
  const account: unknown = JSON.parse(await boundedText(response, 64 * 1024));
  if (
    !account ||
    typeof account !== 'object' ||
    !('account_id' in account) ||
    typeof account.account_id !== 'string'
  )
    throw new Error('Dropbox account could not be verified.');
  return {
    ...token,
    account: account.account_id,
    generation: crypto.randomUUID(),
  };
}
