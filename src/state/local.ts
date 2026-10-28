import { create } from 'zustand';
import { LocalRepository, openDatabase } from '../data/local';
import type { Snapshot, UndoEntry } from '../data/local';
import type { Command } from '../domain/local';

type Edit = Command | { type: 'undo'; id: string };
type State = {
  snapshot: Snapshot | null;
  undos: UndoEntry[];
  queued: number;
  error: string;
  fatal: boolean;
  drafts: Record<string, string>;
  load: () => Promise<void>;
  edit: (command: Edit, key?: string, value?: string) => void;
  retry: () => void;
  discard: () => void;
};
let repository: LocalRepository | undefined;
let loading: Promise<void> | undefined;
let running = false;
const queue: { command: Edit; key?: string; value?: string }[] = [];
let channel: BroadcastChannel | undefined;
function message(error: unknown) {
  return error instanceof DOMException && error.name === 'QuotaExceededError'
    ? 'Storage is full. This edit is not saved. Keep this tab open, free device space, then Retry saving.'
    : error instanceof Error
      ? error.message
      : 'Local storage failed. Keep this tab open and retry.';
}
async function refresh() {
  if (!repository) return;
  try {
    const snapshot = await repository.read();
    const undos = await repository.undos();
    useLocal.setState((state) =>
      snapshot.revision >= (state.snapshot?.revision ?? -1)
        ? { snapshot, undos }
        : {},
    );
  } catch (error) {
    useLocal.setState({ error: message(error), fatal: true });
  }
}
async function drain() {
  if (running || !repository || useLocal.getState().fatal) return;
  running = true;
  useLocal.setState({ error: '' });
  while (queue.length && !useLocal.getState().fatal) {
    const item = queue[0]!;
    try {
      const snapshot = await repository.commit(item.command);
      queue.shift();
      useLocal.setState((state) => {
        const drafts = { ...state.drafts };
        if (
          item.key &&
          drafts[item.key] === item.value &&
          !queue.some((q) => q.key === item.key)
        )
          delete drafts[item.key];
        return { snapshot, drafts, queued: queue.length };
      });
      // A notification failure must not make an already committed edit retry.
      try {
        channel?.postMessage('changed');
      } catch {
        /* focus refresh remains available */
      }
    } catch (error) {
      useLocal.setState({ error: message(error) });
      break;
    }
  }
  running = false;
  await refresh();
}
export const useLocal = create<State>((set, get) => ({
  snapshot: null,
  undos: [],
  queued: 0,
  error: '',
  fatal: false,
  drafts: {},
  load: () =>
    (loading ??= (async () => {
      try {
        repository = new LocalRepository(await openDatabase());
        const snapshot = await repository.initialize(
          localStorage.getItem('replift.v1'),
        );
        set({
          snapshot,
          undos: await repository.undos(),
          fatal: false,
          error: '',
        });
        if (typeof BroadcastChannel !== 'undefined') {
          channel = new BroadcastChannel('replift.local.v2');
          channel.onmessage = () => {
            void refresh();
          };
        }
        window.addEventListener('focus', () => {
          void refresh();
        });
        window.addEventListener('storage', (event) => {
          if (event.key === 'replift.v1' || event.key === null)
            set({
              fatal: true,
              error:
                'Legacy storage changed in another tab. Editing blocked; both copies are retained. Close the old client and recover before continuing.',
            });
        });
        window.addEventListener('beforeunload', (event) => {
          if (get().queued) {
            event.preventDefault();
            event.returnValue = '';
          }
        });
      } catch (error) {
        repository?.close();
        repository = undefined;
        loading = undefined;
        set({ error: message(error), fatal: true });
      }
    })()),
  edit: (command, key, value) => {
    if (get().fatal || !repository) return;
    queue.push({
      command,
      ...(key === undefined ? {} : { key }),
      ...(value === undefined ? {} : { value }),
    });
    set((state) => ({
      queued: queue.length,
      drafts:
        key === undefined
          ? state.drafts
          : { ...state.drafts, [key]: value ?? '' },
    }));
    if (!get().error) void drain();
  },
  retry: () => {
    if (get().fatal) {
      loading = undefined;
      void get().load();
    } else void drain();
  },
  discard: () => {
    if (running || get().fatal || !get().error) return;
    queue.length = 0;
    set({ queued: 0, drafts: {}, error: '' });
    void refresh();
  },
}));
