# Sync design — proposal and safety contract

Updated: 2026-10-28. Not implemented. See DECISIONS for unresolved choices, especially encryption.

## Existing source

Demo B uses `/replift-data.json`, localStorage `replift.v1`, merge base `replift.dbx.base.v1`, OAuth pending key `replift.dbx.oauth`, PKCE/refresh tokens, three-way merge and revision-checked normal upload. Overlaps/no matching base lead to whole-copy restore/upload choices. Photos are embedded. Timer checks dirty state only. Do not describe this as production-safe conflict review.

## Proposed boundaries

- Core: deterministic version comparison/merge, deletion and conflict representation. No React, Dropbox requests or DOM.
- Provider: OAuth, HTTP, revisions, errors and photo transfer; no UI state mutation.
- Scheduler: meaningful changes, Done, launch/reconnect, ten-minute polling, best-effort hide.
- Host: validated data mapping, transactional persistence, credentials, active-editor protection and UI.

## Data contract

- User edits save locally before sync. Record data and pending/version metadata commit atomically.
- Stable IDs for all independently editable records, including measurements and set/routine instances where needed. Library exercise IDs/serials remain stable; display-name edits do not change identity.
- Per-device counters detect causal order/concurrency; wall clocks are not the only winner rule.
- Tombstones are durable. No time-only purge that can resurrect an offline device's deletes; any compaction requires an explicit safe protocol.
- One structured versioned cloud file initially, separate immutable photo files. Exact record/field granularity to be proved before committing protocol.
- Exclude tokens, local OAuth state, device capabilities and transient UI state from shared data. Decide separately which preferences/layouts sync.
- Distinguish canonical mutable data from recomputable stats/PR summaries.

## Sync cycle

1. Flush committed local operations and capture a consistent snapshot.
2. Download remote data/revision; distinguish absent file from permission/network failure.
3. Validate format/version/size/reference relationships before applying anything.
4. Merge independent edits using explicit rules; preserve incompatible alternatives.
5. Capture recovery point before replacement; abort replacement if required recovery persistence fails.
6. Upload with compare-and-set revision (strict create when absent), not unconditional overwrite.
7. On race, download latest and recompute with bounded retries/backoff.
8. Persist acknowledgement for exactly the uploaded snapshot. Edits made during requests remain pending.

Serialize sync per instance and coordinate tabs. Cancel stale callbacks on disconnect/account change using connection identity/generation. Lost upload responses retry safely without duplicating records. A cloud acknowledgement plus local persistence failure must not report a fully committed success.

## Conflict UX

Show exercise/workout/date/values rather than JSON paths. Persist alternatives and review decisions, including delete-versus-edit. Allow use current/use alternative; Keep both only where semantically valid. Avoid inaccurately calling an old third-device edit “this device.” Check reviewed versions are still current before applying a decision. Permit independent nonconflicting work to progress while conflicts remain, subject to valid references.

Never use whole-copy overwrite as the routine conflict solution. Explicit restore/replacement is a separate previewed recovery operation with backup, not seamless sync.

## Triggers

- Workout logged; measurement/photo added or changed/deleted; program/exercise changed: save + mark pending + schedule.
- Settings: save locally immediately; Done requests sync.
- Every ten minutes while running: discover remote changes even when locally clean.
- Launch/reconnect: recover local data/pending work and check cloud.
- Hide/close: best effort only. Never rely on unload to save local edits or complete network work.
- Respect rate limits, bounded exponential backoff and offline status. Manual retry does not launch duplicate requests.

## OAuth and connections

Public key `gs2p3dras9gv94g`; no secret. Redirect PKCE with state/expiry validation and refresh tokens. Verify exact production redirect including path/trailing slash in Dropbox console; likely root `https://replift.shriv.work/`, currently unverified. Required existing scopes: files.content.read, files.content.write, files.metadata.read; verify minimum requirements during setup. No pasted-code UI.

Strip OAuth parameters before app history routing. Handle cancel, revoked/expired grants, restart-return and refresh failures. Keep connection-specific metadata scoped to the Dropbox identity. Never combine a new account with old-account sync bases without a previewed decision. Disconnect preserves local history and cloud files. Logout is a different destructive local action requiring warning.

## Photos and backups

Store blobs in IndexedDB, upload immutable files before publishing references as complete. Persist transfer queue; retain source through verified compression and transfer. Separate essential metadata sync from photo progress. Defer garbage collection until retention/reference rules are proved. Complete export must include photos, not just metadata JSON.

Validate old cloud/local formats into staging. Keep old data/snapshots; verify collection counts/references and representative values. Restore old backup as explicit new intent with version semantics, not resetting clocks to an ancient state. Protocol transition must protect against still-open legacy clients; choose versioned namespace/path if needed after compatibility review. Block unsupported versions without wiping local data.

## Encryption

Optional end-to-end encryption is unresolved. Sailor reference support does not mean Replift implements it. If approved, design photo encryption, passphrase/recovery UX, locked-state sync and format migration together. Never claim Dropbox transport/storage security equals Replift E2EE.
