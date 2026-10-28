import { useEffect, useState } from 'react';
import { Cloud, Download, Upload, Unplug } from 'lucide-react';
import {
  useSync,
  initializeSync,
  connectDropbox,
  approveAccount,
  refreshAccountPreview,
  cancelAccount,
  disconnectDropbox,
  approveLegacy,
  requestSync,
  reviewConflict,
  exportBackup,
  previewBackup,
  restorePreview,
  counts,
} from '../state/sync';
import { getRepository } from '../state/local';
import { useLocal } from '../state/local';
import { canonical } from '../sync/core';
import type { Document } from '../sync/core';
import type { LocalData } from '../domain/local';

function describe(value: unknown): string {
  if (value === null) return 'Deleted';
  if (!value || typeof value !== 'object') return String(value);
  const v = value as Record<string, unknown>;
  if ('data' in v && 'program' in v) return describe(v.data);
  const title =
    typeof v.n === 'string' ? v.n : typeof v.title === 'string' ? v.title : '';
  const date = typeof v.t === 'number' ? new Date(v.t).toLocaleString() : '';
  return (
    [
      title,
      date,
      typeof v.v === 'string' || typeof v.v === 'number' ? `Value: ${v.v}` : '',
      typeof v.day === 'number' ? `Weekday: ${v.day}` : '',
      Array.isArray(v.ex) ? `${v.ex.length} exercises` : '',
    ]
      .filter(Boolean)
      .join(' · ') || 'Saved values'
  );
}
function readable(value: unknown, names: Map<string, string>): string {
  if (typeof value === 'string' && value.startsWith('data:image/'))
    return '[photo retained]';
  if (typeof value === 'string') return names.get(value) ?? value;
  if (Array.isArray(value))
    return value.map((v) => readable(v, names)).join('\n');
  if (
    value &&
    typeof value === 'object' &&
    'data' in value &&
    'program' in value
  )
    return readable(value.data, names);
  if (value && typeof value === 'object')
    return Object.entries(value)
      .filter(([k]) => !['id', 'programId'].includes(k))
      .map(
        ([k, v]) =>
          `${names.get(k) ?? ({ n: 'Name', ex: 'Exercises', vals: 'Set values', kg: 'Weight', reps: 'Reps', t: 'Date', v: 'Value', img: 'Photo', day: 'Weekday' } as Record<string, string>)[k] ?? k}: ${k === 't' && typeof v === 'number' ? new Date(v).toLocaleString() : readable(v, names)}`,
      )
      .join('\n');
  return String(value);
}
export default function SyncPanel() {
  const sync = useSync();
  const local = useLocal();
  const names = new Map(
    (local.snapshot?.data.ex ?? []).map((e) => [e.id, e.n]),
  );
  for (const p of local.snapshot?.data.prog ?? []) {
    names.set(p.id, p.n);
    for (const r of p.routines) names.set(r.id, r.n);
  }
  const heading = (record: string) => {
    const [kind, id] = JSON.parse(record) as string[];
    return kind === 'measure'
      ? `${id} measurement`
      : ((
          {
            prog: 'program',
            routine: 'routine',
            wk: 'workout',
            ph: 'progress photo',
            ex: 'exercise',
            root: 'saved preference',
            order: 'list order',
          } as Record<string, string>
        )[kind!] ?? 'saved');
  };
  const [recovery, setRecovery] = useState<
    {
      key: IDBValidKey;
      reason: string;
      at: number;
      data: LocalData | null;
      document?: Document;
    }[]
  >([]);
  useEffect(() => {
    void initializeSync();
  }, []);
  return (
    <section className="card sync-panel" aria-label="Dropbox and recovery">
      <h2>
        <Cloud size={22} aria-hidden="true" /> Dropbox and recovery
      </h2>
      <p aria-live="polite">{sync.status}</p>
      {sync.error && <p role="alert">{sync.error}</p>}
      {sync.candidate ? (
        <section className="card" aria-label="Review Dropbox account">
          <h3>Review Dropbox account</h3>
          <p>Selected account: …{sync.candidate.account.slice(-8)}</p>
          <p>{sync.accountPreview || 'Reading cloud data for preview…'}</p>
          <p>
            Continuing shares this device’s saved content with this Dropbox
            account and merges its cloud content. Conflicting versions are
            retained for review. A local recovery point is required before
            continuing.
          </p>
          <button
            disabled={sync.busy || !sync.accountPreview}
            onClick={() => {
              void approveAccount();
            }}
          >
            Connect and merge this account
          </button>
          <button
            onClick={() => {
              void cancelAccount();
            }}
          >
            Cancel account connection
          </button>
          <button
            disabled={sync.busy}
            onClick={() => {
              void refreshAccountPreview();
            }}
          >
            Refresh account preview
          </button>
        </section>
      ) : (
        <div className="sync-actions">
          <button
            onClick={() => {
              void connectDropbox();
            }}
          >
            {sync.connected ? 'Change Dropbox account' : 'Connect Dropbox'}
          </button>
          {sync.connected && (
            <>
              <button disabled={sync.busy} onClick={requestSync}>
                Sync now
              </button>
              <button
                onClick={() => {
                  void disconnectDropbox();
                }}
              >
                <Unplug size={17} /> Disconnect Dropbox
              </button>
            </>
          )}
        </div>
      )}
      {sync.legacy && (
        <section className="card" aria-label="Review legacy cloud migration">
          <h3>Legacy cloud data found</h3>
          <p>{sync.legacy.counts}</p>
          <p>
            The original cloud file stays intact. Import into the upgraded file
            and retain overlapping versions for review. Close the old app on
            every device before continuing; later old-app edits require another
            migration review.
          </p>
          <button
            onClick={() => {
              void approveLegacy();
            }}
          >
            Import legacy cloud safely
          </button>
        </section>
      )}
      {Object.entries(sync.doc?.records ?? {})
        .filter(([, v]) => v.length > 1)
        .map(([key, variants]) => (
          <section key={key} className="card" aria-label="Review sync conflict">
            <h3>Review conflicting {heading(key)} values</h3>
            <p>
              Choose the values to keep. All alternatives remain in a local
              recovery point. Device versions may originate from any of your
              devices.
            </p>
            {variants.map((variant, index) => (
              <div key={canonical(variant)} className="conflict-alternative">
                <h4>
                  Version {index + 1}:{' '}
                  {variant.deleted ? 'Deleted' : describe(variant.value)}
                </h4>
                <pre>{readable(variant.value, names)}</pre>
                {(JSON.parse(key) as string[])[0] === 'ph' &&
                variant.value &&
                typeof variant.value === 'object' &&
                'img' in variant.value &&
                typeof variant.value.img === 'string' &&
                variant.value.img.startsWith('data:image/') ? (
                  <img
                    className="conflict-photo"
                    src={variant.value.img}
                    alt={`Progress photo version ${index + 1}`}
                  />
                ) : null}
                <button
                  disabled={sync.busy}
                  onClick={() => {
                    void reviewConflict(key, canonical(variants), index);
                  }}
                >
                  Use version {index + 1}
                </button>
              </div>
            ))}
            {['measure', 'ph'].includes((JSON.parse(key) as string[])[0]!) &&
              variants.every((v) => !v.deleted) && (
                <button
                  disabled={sync.busy}
                  onClick={() => {
                    void reviewConflict(key, canonical(variants), 'both');
                  }}
                >
                  Keep both as separate {heading(key)} records
                </button>
              )}
          </section>
        ))}
      <h3>Complete backup</h3>
      <p>
        Includes saved content, photos and conflict alternatives. Connection
        credentials stay on this device. Download before clearing browser
        storage.
      </p>
      <button
        onClick={() => {
          void exportBackup();
        }}
      >
        <Download size={17} /> Download complete backup
      </button>
      <label>
        Preview a backup to restore <Upload size={17} />
        <input
          type="file"
          accept="application/json,.json"
          onChange={(e) => {
            const file = e.target.files?.[0];
            if (file) void previewBackup(file);
            e.target.value = '';
          }}
        />
      </label>
      {sync.restorePreview && (
        <section className="card" aria-label="Review backup restore">
          <h3>Review backup restore</h3>
          <p>{sync.restorePreview.description}</p>
          <p>
            This replaces current content as a new saved change. Current content
            is captured in a recovery point first; other devices will receive
            the new intent on sync.
          </p>
          <button
            onClick={() => {
              void restorePreview();
            }}
          >
            Restore with recovery point
          </button>
          <button onClick={() => useSync.setState({ restorePreview: null })}>
            Cancel restore
          </button>
        </section>
      )}
      <button
        onClick={() => {
          void getRepository().recoveryPoints().then(setRecovery);
        }}
      >
        Show local recovery points
      </button>
      {recovery
        .slice()
        .reverse()
        .map((point) => (
          <div key={String(point.key)}>
            <p>
              {point.reason} · {new Date(point.at).toLocaleString()}{' '}
              {point.data && `· ${counts(point.data)}`}
            </p>
            {point.data && (
              <button
                onClick={async () => {
                  const snapshot = await getRepository().read();
                  useSync.setState({
                    restorePreview: {
                      data: point.data!,
                      ...(point.document ? { document: point.document } : {}),
                      revision: snapshot.revision,
                      description: `Recovery: ${counts(point.data!)}. Current: ${counts(snapshot.data)}.`,
                    },
                  });
                }}
              >
                Preview this recovery point
              </button>
            )}
          </div>
        ))}
    </section>
  );
}
