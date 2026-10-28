# Cross-chat handoff

## Latest session — Phase 3 implementation, 2026-10-28

The user explicitly authorized Phase 3 implementation, routine technical decisions, required checks, continuity updates and a reviewable branch/PR. Work started from fetched main `2760a167e81e2acc4ec371d18e1b24ac28f02f3c`: Phase 2 PR #8 is merged. This carries forward the latest parent handoff closure and supersedes historical open/unmerged/not-started statements below.

Implementation is in the separate `repository/` checkout on `phase-3-dropbox-sync`. Optional Dropbox now has redirect PKCE and account preview, staged legacy migration to `/replift-v3.json`, causal record alternatives/tombstones, revision-checked publication, remote-only discovery, durable pending work, retries/cancellation/tab coordination, conflict review, immutable photo transfers with independent metadata progress, and complete backup/previewed recovery. IndexedDB version 2 adds byte-buffer photo sources without replacing schema-2 local data. Existing legacy local/cloud files remain intact. Only Old Replift Deployment was used; no non-Dropbox demo, E2EE, worker, backend, merge or production deployment.

Current phase checks: baseline integrity, lint, formatting, strict types, 64 unit/integration tests, nine seeded stress tests (17,100 actions) and build passed. Original deployment and repository reference both match all ten SHA-256 entries. All 42 browser cases passed across desktop/mobile Chromium and mobile WebKit emulation, including real backup restore and same-origin tab coordination against a fake provider. PR #9 is open and unmerged: https://github.com/byshriv/Replift/pull/9. Published implementation commit `6af4b82cb113ffe9a677c39bac77cdaabca0a8b5` exactly matches the locally tested tree `b6c687053aa7e102a5c5bfcc02e619d591c3ad26`. GitHub CI/CodeQL are running; check the current PR head before merge. See docs/phase-3-verification.md and docs/sync-protocol.md inside repository/ for exact evidence and protocol limits.

Live testing is separate: no user-credential Dropbox or physical-phone checks were performed. Exact console redirects/scopes/app access, disposable live multi-device/revoke/account-switch trials, large real-data capacity, hardware interruption, full feature parity and release gates remain open. Import/transfer files above 32 MiB are retained but refused; no lossy compression or automatic retention pruning. Missing parent-program relationships block application for recovery. Production is unchanged.

Next: review the Phase 3 PR and its checks, then use disposable data for the documented live rehearsal before any release. Do not merge or deploy automatically. Phase 4 requires its own implementation request; preserve this branch/artifacts and existing user data.

## Latest session — Phase 2 implementation, 2026-10-28

The user explicitly authorized Phase 2 implementation, routine technical decisions and branch/PR publication. Work starts from fetched main `192e5caa7bf0785f40122a97226d4d451781147a` (Phase 1 PR #1 merged). Owner-reported protection/Dependabot settings remain uninspected. This entry supersedes historical planning-only and Phase 1 open/unmerged statements below.

Implementation in `repository/` on `phase-2-local-reliability`: native IndexedDB atomic data/pending/version writes; non-destructive legacy migration with all collections/embedded photos and unknown fields retained; private connection metadata isolation; recovery snapshots and persistent removal Undo; immediately saved routine names/weekdays/selections/raw set drafts; all-main-tab date/storage/profile bar. Old-client divergence and invalid/unsupported data block editing without resetting it. No Dropbox transport, E2EE, worker, merge or deployment. Only the Old Replift Deployment baseline was used; originals remain untouched.

Checks: lint, format, strict types, 29 unit/integration tests, six seeded stress runs (15,000 navigation + 1,200 persistence actions), build and baseline checksums passed locally. All 33 browser checks passed across desktop/mobile Chromium and mobile WebKit emulation. PR [#8](https://github.com/byshriv/Replift/pull/8) is open, unmerged. Final source revision `352b7378c81926a4636bcfcf3673ffe8e2e90101` passed the local checks; the final evidence commit changes documentation only. Initial GitHub quality/browser/CodeQL passed; check final-head CI in the PR; see [Phase 2 evidence](docs/phase-2-verification.md). Physical devices, live Dropbox, hardware interruption, large real-data migration, full portable backup/restore and complete feature parity remain untested/later gates. Failed writes remain visibly unsaved in memory; never promise survival after closing a failed-write tab.

Next: review Phase 2 PR #8 and actual CI evidence before merge. See its final branch head; local source/preview ZIPs and SHA256SUMS are generated in repository/artifacts (ignored). Phase 3 is optional Dropbox transport/conflict work under its own implementation authorization. Production is unchanged.

## Current Phase 1 start prompt

> Start Replift Phase 1. Read AGENTS.md, PROJECT-CONTEXT.md, STATUS.md, DECISIONS.md, ROADMAP.md and areas/replift-open-items.md, prioritizing the latest user decisions. Use only Old Replift Deployment as the baseline. Build the repository foundation in byshriv/Replift with the agreed stack, preserve the baseline, inventory its features, add CI/tests/docs, and prepare a reviewable branch/PR. Keep the live site unchanged. Make routine technical decisions, run available checks, update the handoff files and give exact manual steps only where needed. Proceed with implementation.

This replaces the older planning-only template below for the user's next Phase 1 chat. User has delegated scope; do not repeat resolved questions. Current chat made documentation updates only.

## Start a new phase chat

Use this project folder as the workspace. Paste:

> Work on Replift in this folder. Read AGENTS.md, PROJECT-CONTEXT.md, STATUS.md, DECISIONS.md, areas/replift-open-items.md and ROADMAP.md, then the specs for Phase [number]. Tell me the verified current state, unresolved decisions and exact scope before implementation. Preserve both original demos and all user data. Do not assume historical tests passed on current files. This request is for planning the phase; wait for my go before building.

If already ready to authorize, replace the final sentence with an explicit go for the agreed phase. New chats must check actual repository/files before resuming. Do not create a new repository or rewrite finished phases merely because the chat changed.

## End a phase/chat

Update STATUS with implementation evidence, revision/branch/PR, tests actually run, skipped checks, data/schema changes, deployment state and next action. Update ROADMAP statuses, DECISIONS for user answers and open items. Link generated artifacts by actual path/release URL. Record only completed work as complete; keep blockers visible.

Do not run multiple chats editing the same files/branch simultaneously without an explicit coordination plan. These documents carry context but do not merge conflicting edits.

## Latest session — 2026-10-28 Phase 1 implementation

- User explicitly authorized implementation, branch and PR. Production remains unchanged; no merge.
- Separate checkout `repository/` in parent workspace; baseline only from Old Replift Deployment, copied unchanged with 10 checksums. Non-Dropbox demo not consulted or included.
- React/strict TS/Vite, Lucide, local fonts, transient Zustand shell and Zod catalogue; 420 original slug IDs/order. No user storage migration, sync or worker.
- Added inventory P01–P40, CI/CodeQL/Dependabot, issue template, MIT/docs and ZIP packaging.
- Local lint/format/strict types/build passed; 3 unit + 3 seeded stress tests (15,000 actions) passed; 9 browser tests passed; audit 0 vulnerabilities. See docs/phase-1-verification.md for exact coverage, corrected attempts and untested areas.
- Branch `phase-1-foundation`; main is README-only bootstrap. PR #1: https://github.com/byshriv/Replift/pull/1. GitHub quality/browser/CodeQL all passed on implementation commit `cae7b67aa4db9b90aaceba6c4a60e1d7a78ac005`; docs-only evidence update follows. Protection remains manual because no settings API/authenticated browser is available; see docs/repository-workflow.md. Git credential helper was not authenticated; connector used for publication.
- No live Dropbox/physical phone/install/APK/migration/full parity verification. All future release gates remain open.
- Next: owner enables documented main-branch protections/squash settings and reviews foundation PR; Phase 2 rebuilds persistence and routine UX under separate implementation authorization. Preserve legacy data and baseline; never deploy this preview over the live site.
