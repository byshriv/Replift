import { create } from 'zustand';
import {
  ANDROID_REDIRECT,
  isAndroid,
  openAuthorization,
} from '../platform/android';
import { nativeShare } from '../platform/native-files';
import { useNavigation } from './navigation';
import { z } from 'zod';
import type { Connection } from '../data/local';
import type { LocalData } from '../domain/local';
import { validateData } from '../domain/local';
import { getRepository, refreshLocal, useLocal } from './local';
import {
  canonical,
  legacyCloud,
  parseDocument,
  assertPrivateFree,
} from '../sync/core';
import type { Document } from '../sync/core';
import {
  beginOAuth,
  CLOUD_PATH,
  DropboxProvider,
  finishOAuth,
  LEGACY_PATH,
  MAX_FILE,
} from '../sync/dropbox';
import { LegacyReview, Scheduler, SyncEngine } from '../sync/engine';

type Preview = {
  data: LocalData;
  revision: number;
  description: string;
  document?: Document;
};
type State = {
  connected: boolean;
  busy: boolean;
  status: string;
  error: string;
  doc: Document | null;
  candidate: Connection | null;
  accountPreview: string;
  accountRevision: number | null;
  legacy: { revision: string; counts: string } | null;
  restorePreview: Preview | null;
};
export const useSync = create<State>(() => ({
  connected: false,
  busy: false,
  status: 'Dropbox not connected',
  error: '',
  doc: null,
  candidate: null,
  accountPreview: '',
  accountRevision: null,
  legacy: null,
  restorePreview: null,
}));
let engine: SyncEngine | undefined, scheduler: Scheduler | undefined;
let initial: Promise<void> | undefined;
let generation = 0;
let connectionChannel: BroadcastChannel | undefined;
function notifyConnection() {
  try {
    connectionChannel?.postMessage('changed');
  } catch {
    /* Persistent generation checks remain authoritative. */
  }
}
const errorText = (e: unknown) =>
  e instanceof Error ? e.message : 'Sync failed. Local data remains saved.';
export const counts = (data: LocalData) =>
  `${data.wk.length} workouts · ${data.prog.length} programs · ${Object.values(data.ms ?? {}).reduce((n, v) => n + v.length, 0)} measurements · ${data.ph?.length ?? 0} photos`;
async function reload() {
  await refreshLocal();
  useSync.setState({ doc: (await getRepository().syncState()).doc });
}
function stop() {
  generation++;
  engine?.cancel();
  scheduler?.stop();
  engine = undefined;
  scheduler = undefined;
}
async function start() {
  stop();
  const operation = generation;
  const repo = getRepository();
  const connection = await repo.privateRead<Connection>('connection');
  if (operation !== generation) return;
  useSync.setState({
    connected: !!connection,
    busy: false,
    status: connection ? 'Ready to sync' : 'Dropbox not connected',
  });
  if (!connection) return;
  const currentGeneration = generation;
  const canApply = () =>
    !useLocal.getState().queued &&
    !useLocal.getState().fatal &&
    !useLocal.getState().error &&
    !useSync.getState().restorePreview &&
    !useSync.getState().candidate &&
    !document.activeElement?.matches('input, textarea, select');
  engine = new SyncEngine(
    repo,
    new DropboxProvider(repo, connection),
    connection,
    canApply,
  );
  const currentEngine = engine;
  scheduler = new Scheduler(
    async () => {
      if (!navigator.onLine)
        throw new Error('Offline. Changes stay saved on this device.');
      if (
        useLocal.getState().queued ||
        useLocal.getState().fatal ||
        useLocal.getState().error ||
        useSync.getState().restorePreview ||
        useSync.getState().candidate ||
        document.activeElement?.matches('input, textarea, select')
      )
        throw new Error(
          'Sync paused while editing or reviewing. Local changes stay saved.',
        );
      useSync.setState({
        busy: true,
        status: 'Syncing with Dropbox…',
        error: '',
      });
      await currentEngine.run();
      await reload();
    },
    (error) => {
      if (currentGeneration !== generation) return;
      useSync.setState({
        busy: false,
        error: error ? errorText(error) : '',
        status: error
          ? 'Sync needs attention'
          : 'Dropbox acknowledged saved changes',
        legacy:
          error instanceof LegacyReview
            ? { revision: error.revision, counts: error.counts }
            : null,
      });
      if (!error) {
        void repo.syncState().then((s) => {
          if (
            currentGeneration === generation &&
            canonical(s.doc) !== canonical(s.acknowledged)
          )
            scheduler?.request();
        });
      }
    },
  );
  scheduler.request(0);
}
export async function initializeSync() {
  return (initial ??= (async () => {
    await useLocal.getState().load();
    if (useLocal.getState().fatal) return;
    try {
      const repo = getRepository();
      if (typeof BroadcastChannel !== 'undefined') {
        connectionChannel = new BroadcastChannel('replift.connection.v3');
        connectionChannel.onmessage = () => {
          void start()
            .then(reload)
            .catch((error: unknown) =>
              useSync.setState({ error: errorText(error) }),
            );
        };
      }
      const url = new URL(location.href);
      if (url.searchParams.has('code') || url.searchParams.has('error')) {
        // Strip callback parameters before routing or rendering user-controlled error text.
        const clean = new URL(url);
        for (const key of ['code', 'state', 'error', 'error_description'])
          clean.searchParams.delete(key);
        history.replaceState(null, '', clean);
        const connection = await finishOAuth(repo, url);
        if (connection) await repo.privateWrite('candidate', connection);
      }
      await repo.syncState();
      await reload();
      const candidate = await repo.privateRead<Connection | null>('candidate');
      if (candidate) await previewAccount(candidate);
      else await start();
      window.addEventListener('replift-local-committed', () => {
        scheduler?.request();
        void reload();
      });
      window.addEventListener('online', () => scheduler?.request(0));
      window.addEventListener('focus', () => scheduler?.request(0));
      document.addEventListener('visibilitychange', () =>
        scheduler?.request(0),
      );
    } catch (error) {
      useSync.setState({ error: errorText(error), busy: false });
    }
  })());
}
export async function connectDropbox() {
  try {
    stop();
    const url = await beginOAuth(
      getRepository(),
      isAndroid() ? ANDROID_REDIRECT : `${location.origin}${location.pathname}`,
    );
    useSync.setState({
      error: '',
      status:
        'Complete Dropbox sign-in in the browser, then return to Replift. You can cancel and reconnect here.',
    });
    await openAuthorization(url);
  } catch (error) {
    useSync.setState({ error: errorText(error) });
  }
}
export async function acceptNativeOAuth(url: URL) {
  await initializeSync();
  useNavigation.getState().navigate('Settings');
  try {
    const repo = getRepository();
    // Android can redeliver the Activity's launch intent after a WebView reload.
    // No pending authorization means there is nothing to exchange or consume.
    if (!(await repo.privateRead('oauth'))) return;
    const connection = await finishOAuth(repo, url);
    if (connection) {
      await repo.privateWrite('candidate', connection);
      await previewAccount(connection);
    }
  } catch (error) {
    useSync.setState({ error: errorText(error), busy: false });
  }
}
export async function cancelOAuth() {
  try {
    await getRepository().privateWrite('oauth', null);
    await start();
    useSync.setState({
      status: 'Dropbox sign-in cancelled. Saved data is retained.',
      error: '',
    });
  } catch (error) {
    useSync.setState({ error: errorText(error) });
  }
}
async function previewAccount(connection: Connection) {
  stop();
  const operation = generation;
  useSync.setState({
    candidate: connection,
    accountPreview: '',
    accountRevision: null,
    busy: true,
  });
  const provider = new DropboxProvider(
    getRepository(),
    connection,
    'candidate',
  );
  const signal = AbortSignal.timeout(60_000);
  try {
    const remote = await provider.download(CLOUD_PATH, signal);
    if (remote) {
      const doc = parseDocument(JSON.parse(remote.body));
      const snapshot = await getRepository().read();
      if (operation !== generation) return;
      useSync.setState({
        accountPreview: `Upgraded cloud file: ${Object.keys(doc.records).length} records, ${Object.values(doc.records).filter((v) => v.length > 1).length} conflicts. Local: ${counts(snapshot.data)}.`,
        accountRevision: snapshot.revision,
      });
    } else {
      const legacy = await provider.download(LEGACY_PATH, signal);
      const snapshot = await getRepository().read();
      if (operation !== generation) return;
      useSync.setState({
        accountPreview: `${legacy ? `Legacy cloud: ${counts(legacyCloud(JSON.parse(legacy.body)))}` : 'No Replift cloud file found'}. Local: ${counts(snapshot.data)}.`,
        accountRevision: snapshot.revision,
      });
    }
  } finally {
    if (operation === generation) useSync.setState({ busy: false });
  }
}
export async function approveAccount() {
  try {
    const candidate =
      await getRepository().privateRead<Connection>('candidate');
    if (!candidate || !useSync.getState().accountPreview)
      throw new Error('Preview this account before connecting.');
    if (
      useLocal.getState().queued ||
      (await getRepository().read()).revision !==
        useSync.getState().accountRevision
    )
      throw new Error(
        'Local content changed. Refresh this account preview before connecting.',
      );
    await getRepository().connect(
      candidate,
      true,
      useSync.getState().accountRevision!,
    );
    await getRepository().privateWrite('candidate', null);
    notifyConnection();
    useSync.setState({ candidate: null, accountPreview: '', error: '' });
    await start();
  } catch (error) {
    useSync.setState({ error: errorText(error) });
  }
}
export async function refreshAccountPreview() {
  try {
    const candidate =
      await getRepository().privateRead<Connection>('candidate');
    if (candidate) await previewAccount(candidate);
  } catch (error) {
    useSync.setState({ error: errorText(error), busy: false });
  }
}
export async function cancelAccount() {
  await getRepository().privateWrite('candidate', null);
  useSync.setState({ candidate: null, accountPreview: '', error: '' });
  await start();
}
export async function disconnectDropbox() {
  stop();
  await getRepository().disconnect();
  notifyConnection();
  await getRepository().privateWrite('candidate', null);
  useSync.setState({
    connected: false,
    candidate: null,
    busy: false,
    error: '',
    status: 'Dropbox disconnected; local data retained',
    legacy: null,
  });
}
export async function approveLegacy() {
  const connection =
    await getRepository().privateRead<Connection>('connection');
  const legacy = useSync.getState().legacy;
  if (!connection || !legacy) return;
  await getRepository().privateWrite(
    `legacy-approved:${connection.account}`,
    legacy.revision,
  );
  useSync.setState({ legacy: null, error: '' });
  scheduler?.request(0);
}
export function requestSync() {
  if (scheduler && !useSync.getState().busy)
    useSync.setState({ status: 'Sync requested…' });
  scheduler?.request(0);
}
export async function reviewConflict(
  record: string,
  expected: string,
  index: number | 'both',
) {
  try {
    await getRepository().review(record, expected, index);
    await reload();
    useSync.setState({ error: '' });
    scheduler?.request();
  } catch (error) {
    useSync.setState({ error: errorText(error) });
    await reload();
  }
}
export async function exportBackup() {
  try {
    if (useLocal.getState().queued)
      throw new Error('Save pending edits before exporting.');
    const text = await getRepository().backup();
    const name = `replift-backup-${new Date().toISOString().slice(0, 10)}.json`;
    if (isAndroid()) {
      const result = await nativeShare(
        [new File([text], name, { type: 'application/json' })],
        'Save Replift backup',
      );
      useSync.setState({ status: result ?? 'Backup was not shared.' });
      return; // Chooser completion is not proof of a durable backup; do not mark downloaded.
    }
    const url = URL.createObjectURL(
      new Blob([text], { type: 'application/json' }),
    );
    const a = document.createElement('a');
    a.href = url;
    a.download = name;
    a.click();
    await getRepository().commit({
      type: 'domain',
      action: { kind: 'backupDownloaded', time: Date.now() },
    });
    await refreshLocal();
    setTimeout(() => URL.revokeObjectURL(url), 30_000);
  } catch (error) {
    useSync.setState({ error: errorText(error) });
  }
}
export async function previewBackup(file: File) {
  try {
    if (file.size > MAX_FILE)
      throw new Error(
        'Backup exceeds the safe import size. Original retained.',
      );
    const value: unknown = JSON.parse(await file.text());
    const envelope = z
      .strictObject({
        format: z.literal('replift-backup'),
        version: z.literal(1),
        data: z.unknown(),
        document: z.unknown(),
      })
      .parse(value);
    assertPrivateFree(envelope);
    const doc = parseDocument(envelope.document);
    const data = validateData(envelope.data);
    if (JSON.stringify(envelope).includes('replift-photo:'))
      throw new Error('Backup is missing photo sources.');
    const snapshot = await getRepository().read();
    useSync.setState({
      restorePreview: {
        data,
        document: doc,
        revision: snapshot.revision,
        description: `Backup: ${counts(data)}, including ${Object.values(doc.records).filter((v) => v.length > 1).length} conflicts. Current: ${counts(snapshot.data)}.`,
      },
      error: '',
    });
  } catch (error) {
    useSync.setState({ error: errorText(error) });
  }
}
export async function restorePreview() {
  const preview = useSync.getState().restorePreview;
  if (!preview) return;
  try {
    if (useLocal.getState().queued)
      throw new Error('Save pending local edits before restoring.');
    await getRepository().restore(
      preview.data,
      preview.revision,
      preview.document,
    );
    useSync.setState({ restorePreview: null, error: '' });
    await reload();
    scheduler?.request();
  } catch (error) {
    useSync.setState({ error: errorText(error) });
  }
}
