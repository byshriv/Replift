# Phase 2 local storage contract

## Phase 3 update — 2026-10-28

Database version 2 adds the `blobs` store without replacing existing stores or
schema-2 snapshots. A sync document in `state/sync` is updated in the same
transaction as each local command. The `private` store holds credentials,
single-use OAuth state, per-account staged migration/transfer metadata and invalid
remote quarantine. Full recovery snapshots include causal alternatives. Backup
and explicit restore are implemented; see [sync/recovery protocol](sync-protocol.md).
Historical Phase 2 statements below about no cloud acknowledgements, no blob
transport or no export UI describe that earlier phase. No automatic retention
pruning or production migration is introduced.

This is a development preview. Production, the old deployment and Dropbox files are unchanged. It is not a full feature port or a release candidate.

## Database and transactions

`replift.local.v2` uses IndexedDB database version 1 with `state`, `pending`, `undo`, `recovery` and `private` stores. The application envelope has `schema: 2`. Unsupported/damaged envelopes block editing without clearing anything. A strict-durability transaction reads current data, applies a command, validates it, increments a persistent device counter, and writes data, pending operation, record version, removal marker and any required recovery/Undo entries atomically. Completion is reported only after the transaction completes. There are no unload-dependent saves and no cloud acknowledgements.

The stable database device UUID plus monotonically increasing revision identifies local operations. Program/routine versions and removal operation markers are preparatory metadata, **not a completed cloud merge protocol**. Undo creates a new operation; prior removal markers are retained. Phase 3 must translate these intents into a causal merge protocol, scope provider identities and acknowledge only uploaded snapshots. No tombstone or recovery compaction is implemented.

Tabs serialize writes through IndexedDB transactions against fresh state, avoiding stale whole-snapshot replacement. BroadcastChannel updates other tabs; focus refresh is a fallback. Independent edits are preserved. Same-field concurrent local edits follow transaction order; cross-device alternatives/conflict review are Phase 3 work. Stable set IDs prevent index shifts from redirecting field edits to another set. Missing historical exercise references stay intact and are labelled unavailable in the editor.

## Migration

The sole migration input is `localStorage['replift.v1']` on the current origin. The key is never rewritten or deleted. No reference demo is executed to transform real data. No cross-origin data can be accessed from this preview.

1. Parse and validate known containers and nested exercise/program/routine/workout/set/measurement/photo shapes. Preserve unknown fields. Duplicate identities and unsupported explicit versioned imports block migration. Existing incomplete raw input is allowed.
2. Retain the exact source string and parsed original in the local-only `recovery/legacy-original` record. These records may contain legacy credentials; never share or directly export them.
3. Separate `st.dbx*` connection values into `private/legacy-connection`, keeping the original recovery copy intact. Do not activate old tokens, connection state, merge base or OAuth pending state. The old localStorage connection keys remain untouched.
4. Verify all nested values and collections against the original before adding set IDs. Create default empty routine sets only for missing defaults, using the legacy configured count (1–20, otherwise 3); explicit empty arrays and existing values are preserved. Assign permanent IDs to routine set instances without changing exercise/routine/program identities.
5. Commit data, original recovery, private metadata and a pending migration intent together. Read back and validate the committed state before enabling editing. Abort/quota failures do not leave a partly migrated state. Invalid source bytes are quarantined locally, including prior invalid copies; no empty-data fallback occurs.
6. Repeated startup uses the existing database. If the legacy source string changed after migration, block editing and retain both copies for recovery; do not rerun migration over new edits. A storage event blocks an active tab too. This detects old-client divergence but does not reconcile it. An already-running transaction may finish before that event; its committed data remains retained.

Embedded progress photos, custom exercise images, workout/draft attachments and all unknown content remain byte-preserved in their original payload. Blob extraction/compression, portable full backup/restore and photo transport are later work. This phase deliberately introduces no replacement/import UI. Local recovery entries are not a portable backup.

## Editor and failures

Names, weekdays, picker selections and raw set input issue a save immediately. Picker Done/X closes only. Back/tab navigation does not commit or cancel edits. Incomplete/invalid numeric strings remain drafts with a visible hint and never acquire completion/PR flags when edited. Defaults are displayed in canonical kg/km and labelled seconds/minutes/reps as appropriate; display-unit settings are preserved for the later feature port.

Exercise and set removals retain exact values, position, custom fields and a full pre-removal recovery snapshot in the same transaction. Persistent Removal Undo survives reload. Undo preserves intervening edits and refuses to overwrite an exercise added again or a restored set. It cannot restore a set until its containing exercise is restored.

The in-memory queue retains failed edits and raw input, shows Not saved, offers Retry, and requests a browser leave warning while unsaved work remains. Closing a tab after a failed write can lose those **unsaved** edits; previously committed data is intact. Discard unsaved edits requires explicit confirmation and touches only this tab's failed/pending queue. Saving cannot be guaranteed when storage is unavailable/full, the process is killed, or the browser evicts its origin. Structural controls wait for writes; text input can continue queueing.

No automatic retention pruning is performed. Pending intent logs and full recovery snapshots can grow, particularly with embedded photos; quota failures block further commits visibly and retain prior data. Large real-data capacity/performance and recovery tooling must be rehearsed before release. Do not clear browser site storage to fix a failure.

## Verification boundary

See [Phase 2 verification](phase-2-verification.md). Synthetic fixtures cover every legacy collection and unknown fields; no personal backups or real credentials are fixtures. Simulated quota/abort checks and browser emulation cannot prove hardware power-loss durability, physical phone behavior, large real-data migration or live Dropbox behavior. All launch gates still apply.
