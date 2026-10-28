import type { Connection, LocalRepository } from '../data/local';
import { canonical, legacyCloud, merge, parseDocument, update } from './core';
import { CLOUD_PATH, LEGACY_PATH, ProviderError } from './dropbox';
import type { Provider } from './dropbox';
import { downloadPhotos, uploadPhotos } from './photos';

export class LegacyReview extends Error {
  constructor(
    public raw: string,
    public revision: string,
    public counts: string,
  ) {
    super('Legacy Dropbox data found. Review migration before continuing.');
  }
}
export class SyncEngine {
  private running: Promise<void> | undefined;
  private controller = new AbortController();
  constructor(
    private repo: LocalRepository,
    private provider: Provider,
    private connection: Connection,
    private canApply: () => boolean = () => true,
  ) {}
  cancel() {
    this.controller.abort();
  }
  run() {
    if (!this.running)
      this.running = this.cycle().finally(() => {
        this.running = undefined;
      });
    return this.running;
  }
  private async current() {
    this.controller.signal.throwIfAborted();
    const active = await this.repo.privateRead<Connection>('connection');
    if (
      active?.generation !== this.connection.generation ||
      active.account !== this.connection.account
    )
      throw new Error('Connection changed; stale sync cancelled.');
  }
  private async cycle() {
    const execute = async () => {
      const signal = AbortSignal.any([
        this.controller.signal,
        AbortSignal.timeout(90_000),
      ]);
      for (let attempt = 0; attempt < 3; attempt++) {
        await this.current();
        const local = await this.repo.syncState();
        const remote = await this.provider.download(CLOUD_PATH, signal);
        await this.current();
        let doc = local.doc;
        if (remote) {
          let validated;
          try {
            validated = parseDocument(JSON.parse(remote.body));
          } catch (error) {
            await this.repo.privateWrite(
              `remote-invalid:${this.connection.account}:${remote.rev}`,
              remote,
            );
            throw error;
          }
          doc = merge(
            doc,
            parseDocument(
              await downloadPhotos(validated, this.repo, this.provider, signal),
            ),
          );
        }
        {
          const legacy = await this.provider.download(LEGACY_PATH, signal);
          if (legacy && !doc.legacy.includes(legacy.rev)) {
            const approved = await this.repo.privateRead<string>(
              `legacy-approved:${this.connection.account}`,
            );
            if (approved !== legacy.rev) {
              await this.repo.privateWrite(
                `legacy-stage:${this.connection.account}`,
                legacy,
              );
              const data = legacyCloud(JSON.parse(legacy.body));
              throw new LegacyReview(
                legacy.body,
                legacy.rev,
                `${data.wk.length} workouts · ${data.prog.length} programs · ${data.ph?.length ?? 0} photos`,
              );
            }
            const data = legacyCloud(JSON.parse(legacy.body));
            // Stable importer identity/revision: repeated attempts never duplicate an import.
            doc = merge(doc, update(undefined, data, `legacy:${legacy.rev}`));
            doc.legacy = [...new Set([...doc.legacy, legacy.rev])].sort();
          }
        }
        await this.current();
        // Persist downloaded alternatives and a recovery point before any publish.
        if (!this.canApply())
          throw new Error(
            'Sync paused while editing or reviewing. Local changes stay saved.',
          );
        await this.repo.applySync(doc, this.connection, false);
        const captured = await this.repo.syncState();
        const { wire, pending } = await uploadPhotos(
          captured.doc,
          this.repo,
          this.provider,
          this.connection.account,
          signal,
          remote ? parseDocument(JSON.parse(remote.body)) : undefined,
        );
        await this.current();
        try {
          if (
            !remote ||
            canonical(parseDocument(JSON.parse(remote.body))) !==
              canonical(wire)
          )
            await this.provider.upload(
              CLOUD_PATH,
              JSON.stringify(wire),
              remote?.rev ?? null,
              signal,
            );
        } catch (error) {
          if (
            error instanceof ProviderError &&
            error.kind === 'race' &&
            attempt < 2
          )
            continue;
          throw error;
        }
        await this.current();
        if (!this.canApply())
          throw new Error(
            'Sync acknowledgement pending while editing. Local changes stay saved.',
          );
        const uploaded = pending
          ? parseDocument(
              await downloadPhotos(wire, this.repo, this.provider, signal),
            )
          : captured.doc;
        await this.repo.applySync(uploaded, this.connection, true);
        if (pending)
          throw new Error(
            `${pending} photo-containing records remain pending. Independent metadata was acknowledged; photo sources are retained for retry.`,
          );
        return;
      }
    };
    // Same-origin tabs share a lock. Without Web Locks, disable cloud writes;
    // local saving remains available rather than pretending coordination exists.
    if (typeof window !== 'undefined') {
      if (!navigator.locks)
        throw new Error(
          'This browser cannot coordinate Dropbox across tabs. Use a browser with Web Locks; local saving still works.',
        );
      await navigator.locks.request(
        'replift-dropbox-v3',
        { signal: this.controller.signal },
        execute,
      );
    } else await execute(); // deterministic non-browser provider tests
  }
}

export class Scheduler {
  private timer: ReturnType<typeof setTimeout> | undefined;
  private failures = 0;
  private stopped = false;
  constructor(
    private run: () => Promise<void>,
    private report: (error: unknown | null) => void,
  ) {}
  request(delay = 1200) {
    if (this.stopped) return;
    clearTimeout(this.timer);
    this.timer = setTimeout(() => {
      void this.tick();
    }, delay);
  }
  private async tick() {
    if (this.stopped) return;
    try {
      await this.run();
      this.failures = 0;
      this.report(null);
      this.request(10 * 60_000);
    } catch (error) {
      if (this.stopped) return;
      this.report(error);
      if (
        error instanceof LegacyReview ||
        (error instanceof ProviderError &&
          ['auth', 'invalid'].includes(error.kind))
      )
        return;
      this.failures++;
      this.request(
        Math.max(
          error instanceof ProviderError ? error.retryAfter : 0,
          Math.min(10 * 60_000, 2000 * 2 ** Math.min(this.failures, 8)),
        ),
      );
    }
  }
  stop() {
    this.stopped = true;
    clearTimeout(this.timer);
  }
}
