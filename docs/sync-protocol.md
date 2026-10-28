# Phase 3 Dropbox protocol and recovery

This is an optional development-preview connection. Production remains unchanged. No Replift server, analytics, secret, E2EE, worker or hosting change is introduced. Use disposable data first. The original deployment/reference is untouched.

## Boundaries and format

`src/sync/core.ts` owns validation, deterministic causal records, merging and review decisions. `dropbox.ts` owns redirect PKCE, refresh, HTTP error classification and revision checks. `engine.ts` owns serialized cycles and the scheduler. `photos.ts` owns immutable transfers. `src/data/local.ts` commits documents, data, pending work and required recovery points transactionally. `src/state/sync.ts` connects these boundaries to the React preview and protects active inputs/review previews.

- `/replift-v3.json`: `format: replift-sync`, `version: 3`, imported legacy revisions, and records containing causal alternatives. Never write the legacy path.
- Record identities are JSON-encoded tuples: exercises, program metadata, routines, workouts, measurement readings, photos, shared root collections and ordering. Routines are atomic coupled records, including selection/order and all set values; workouts are atomic, including their sets. Different routines/program metadata can merge independently. Same-routine concurrent edits require review rather than manufacturing a weight/reps combination.
- Existing IDs are retained. Missing legacy measurement IDs derive from measure name, timestamp and duplicate occurrence, then persist with the reading. Routine set IDs from Phase 2 are retained; cloud legacy set IDs/defaults are deterministic. A difference between independently assigned old IDs is retained as a conflict, never silently reconciled by array position.
- Identical initial records use SHA-256 content ancestry. Subsequent edits use per-device causal counters with the known context. Wall clocks provide display dates only. Null content is distinct from an explicit durable deletion marker. No tombstone compaction occurs.
- Ordering is separate from membership. Concurrent order alternatives remain reviewable. Independent new members appear in a stable fallback order and remain editable while an order dispute is unresolved.
- Draft workout, onboarding, walkthrough and backup timestamp stay device-local. Shared settings/layout/profile/content and unknown recoverable fields are retained. Legacy `st.dbx*`/`ls` are isolated, and private credential-shaped fields are rejected from shared documents/backups. Cached PR fields embedded in legacy workouts are retained for lossless migration; Phase 4 must recompute them rather than treating them as authoritative.

## Cycle and failures

1. Read a committed document; download and validate remote version, alternatives and identities. Only Dropbox's specific `path/not_found` means absent. Permission, authentication, size and network failures never authorize create/overwrite.
2. Hydrate referenced photos before applying remote content. Merge causal records. Preserve incompatible alternatives and deletion/edit disputes. A missing routine parent blocks replacement, retaining both the remote file and current local state for recovery; historical missing exercise references are preserved.
3. Before changed content/document is applied, persist the prior snapshot and causal document in the same IndexedDB transaction. Failure aborts replacement. Clean discovery/acknowledgement does not accumulate duplicate full recovery points.
4. Capture the latest durable document. Transfer immutable photo sources and verify them by readback. A photo-containing record with failed transfer retains its previous cloud version or stays local; independent metadata can still be published. Never publish an unverified photo reference. Pending sources and per-account transfer entries survive restart.
5. Strict-create absent files with autorename off and `strict_conflict: true`; update existing files with the downloaded revision. Never use overwrite mode. A revision race re-downloads/re-merges, with at most three immediate attempts. Lost responses are discovered on retry.
6. Acknowledge only the captured, published document. Merge in-flight local edits transactionally; clear pending work only when the latest document equals the acknowledged document. Cloud success plus failed local acknowledgement remains visibly uncommitted. Partial photo success retains pending state.

Web Locks serialize same-origin tabs and each engine serializes calls. Browsers without Web Locks retain local saving and refuse cloud writes. Connection generation/account checks gate requests and transactional application; disconnect cancels this tab's work and removes credentials without deleting local/cloud content. An already dispatched request cannot be recalled; its stale result cannot acknowledge or alter a new connection.

Committed edits request sync after a short delay. Launch, reconnect, online/focus/visibility and manual Sync now also request it. Ten-minute discovery runs even with no local edits. Offline/errors back off exponentially up to ten minutes; rate limits honor Retry-After. Authentication/unsupported formats require attention. Hide is best effort, never the persistence mechanism. Input editing or a restore/account preview defers application; it cannot replace an active editor's contents.

## Connection and legacy cutover

1. Settings → Connect Dropbox opens the public app's redirect PKCE S256 flow. OAuth verifier/state/redirect and ten-minute expiry are local IndexedDB metadata, survive a redirect restart, and are consumed once. Callback parameters are removed before app routing. No pasted-code UI or frontend app secret.
2. Verify account identity using `users/get_current_account`. Preview cloud record/conflict counts (or legacy collection counts) beside local counts. No merge/upload occurs before Connect and merge this account.
3. On account change, capture a recovery point and reset the account-specific causal base/acknowledgement from current local content. Credentials, staged imports and transfer status are scoped to the selected account. Cancel retains the prior connection. Old-account bases are never reused in a new Dropbox.
4. Legacy schema-1 `/replift-data.json` is validated and staged byte-for-byte. Show counts and require Import legacy cloud safely. Import is additive/causal; overlapping alternatives remain reviewable. Retain original file and local legacy storage. Close every legacy client before cutover.
5. Each upgraded cycle checks the legacy revision against imported revisions carried in the upgraded file. Later old-client writes trigger another migration review. Re-import is idempotent for the same revision; unsupported/damaged legacy files block instead of being bypassed.

## Conflict review and backups

Settings or the top-bar storage panel shows named records, exercise names, dates, set values and photo previews. Choose a version only if its reviewed causal alternatives are still current. Before a decision, retain a recovery snapshot with **all** alternatives. Keep both is limited to separate measurement readings/photos without deletion alternatives; duplicated workouts/programs are not offered as a routine resolution.

Download complete backup produces `replift-backup` version 1, with saved data and the causal document, including all inline photo bytes and unresolved alternatives. It excludes credentials/account identities/OAuth metadata. Local recovery originals that may contain legacy credentials are never exported directly.

Preview a backup to restore validates before mutation and shows backup/current counts. Restore with recovery point is an explicit replacement/new causal intent, after persisting the current recovery point. Restored alternatives receive new causal versions; ancient clocks cannot accidentally reverse a current deletion. Stale previews are rejected if local content changes. Local recovery-point previews include their causal alternatives when available, allowing a previously resolved version to be recovered. No automatic pruning or cloud deletion.

## Limits and release gates

- Transfers/imports are bounded to 32 MiB per file; larger files remain intact and are refused. Complete exports are available, but datasets over the import limit need future streaming tooling before a supported restore rehearsal. Blob source is stored without recompression; no lossy transformation, compression claim, multipart transfer or garbage collection is implemented.
- Recovery and causal histories can grow; quota errors remain visible and preserve committed data. Large real datasets, storage eviction and hardware power loss are not proved by synthetic tests.
- Full workout/measurement/photo editing screens remain Phase 4. Their retained data is synchronized and backed up through this engine; this preview does not claim feature parity.
- Live Dropbox, real devices and production access remain separate release gates. Check registered exact redirect URI, scopes and app access before a disposable live trial. The implementation requests `account_info.read` for identity checks in addition to `files.content.read`, `files.content.write` and `files.metadata.read`. The existing app's console configuration has not been independently inspected in this phase.

Official API references checked for implementation: [OAuth/PKCE](https://docs.dropboxapi.com/dropbox-api/docs/oauth), [download](https://docs.dropboxapi.com/dropbox-api/api-reference/user-endpoints/files/download), and [Dropbox API schema for strict write modes](https://github.com/dropbox/dropbox-api-spec/blob/main/files.stone). These establish API behavior, not evidence that this app passed live testing.

For a live rehearsal: use a disposable Dropbox account and a local preview redirect registered for this app; connect two clean browser profiles, approve previews, add independent/concurrent edits, review conflicts, interrupt photo transfers, revoke/reconnect and switch accounts, then export/restore a complete backup. Record build SHA, date, browser/device, scenario and actual outcome. Keep production unchanged.
