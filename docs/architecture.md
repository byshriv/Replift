# Foundation architecture

## Phase 4 update — 2026-10-28

The React feature port now uses pure `workout.ts`, `metrics.ts`, `reconstruct.ts` and `port.ts` commands through the existing Phase 2 transactional save queue. Phase 3 synchronization remains the only transport/conflict/backup engine. Domain commands apply against the transaction's latest snapshot; draft/item/set targets reject stale UI actions. Destructive commands capture recovery atomically. No database or sync version change. New photo previews retain original image bytes in their record. See [current parity map](phase-4-parity.md) and [verification](phase-4-verification.md). Earlier missing-feature statements below are historical. PWA/Android/production release remain later phases.

## Phase 3 update — 2026-10-28

Optional Dropbox transport, causal record merging, retained conflicts, scheduling,
immutable photo transfers, account review and portable backup/recovery are implemented.
See [sync protocol](sync-protocol.md). `src/sync/core.ts` is UI/provider independent;
`dropbox.ts` owns OAuth/HTTP; `engine.ts` owns the cycle/scheduler; `photos.ts` owns
transfers. Host transactions acknowledge exact documents and preserve recovery
before changed data is applied. `src/state/sync.ts` protects active editors and owns
preview coordination; `src/features/Sync.tsx` presents account/migration/conflict/restore
review. Historical statements below about transport being unimplemented are superseded.
There is still no worker, deployment, E2EE, backend or full feature port.

## Phase 2 update — 2026-10-28

The historical Phase 1 description below is superseded for storage/UI behavior. `src/domain/local.ts` owns pure legacy validation and routine commands; `src/data/local.ts` owns migration and native IndexedDB transactions; `src/state/local.ts` owns the save queue, visible failure/retry state and tab refresh; `src/features/Routines.tsx` owns inline routine editing and picker closure. The app now reads legacy data once for verified migration without rewriting it. See [local storage contract](local-storage.md). No provider transport, worker or full feature port is implemented.

Phase 1 establishes the agreed React / strict TypeScript / Vite stack. `src/domain/exercise.ts` validates the bundled catalogue through Zod; it is pure and independent of React or storage. `src/data/catalogue.ts` loads the baseline-derived tuples. `src/state/navigation.ts` uses transient Zustand state. `src/App.tsx` is a preview shell with Lucide icons and a read-only library. Fonts are bundled locally through Fontsource.

Future boundaries, not implemented modules: data/persistence owns IndexedDB transactions and migrations; sync/core owns deterministic merges and retained alternatives; sync/dropbox owns OAuth/HTTP/revisions; sync/scheduler owns serialized discovery/retry; features owns vertical UI slices; platform owns PWA/Android behavior. The unavailable engine must be rebuilt, not represented by placeholder implementations. No borrowed Sailor/Liftosaur engine code is included.

The preview never reads `replift.v1`, never registers a worker and never connects to Dropbox. Navigation/search reset at refresh. Catalogue IDs match the original slug identities. Serials 1–420 follow the baseline tuple order; identity changes are forbidden. JSON content is validated and frozen at startup. The CSV/image artwork pipeline is deferred; no illustrative assets or intro MP4 are added.

Only the Vite root `index.html` and imported assets enter `dist`. `reference/` is outside `public` and denied by the dev server; the dedicated reference server uses port 4174. This prevents archived code and its worker from shipping inside the preview build. Domain data is not a production storage schema. No user-data migration or export contract is introduced in Phase 1.
