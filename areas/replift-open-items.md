# Replift open items

## Latest session — Phase 3 implementation, 2026-10-28

The user explicitly authorized Phase 3 implementation, routine technical decisions, required checks, continuity updates and a reviewable branch/PR. Work started from fetched main `2760a167e81e2acc4ec371d18e1b24ac28f02f3c`: Phase 2 PR #8 is merged. This carries forward the latest parent handoff closure and supersedes historical open/unmerged/not-started statements below.

Implementation is in the separate `repository/` checkout on `phase-3-dropbox-sync`. Optional Dropbox now has redirect PKCE and account preview, staged legacy migration to `/replift-v3.json`, causal record alternatives/tombstones, revision-checked publication, remote-only discovery, durable pending work, retries/cancellation/tab coordination, conflict review, immutable photo transfers with independent metadata progress, and complete backup/previewed recovery. IndexedDB version 2 adds byte-buffer photo sources without replacing schema-2 local data. Existing legacy local/cloud files remain intact. Only Old Replift Deployment was used; no non-Dropbox demo, E2EE, worker, backend, merge or production deployment.

Current phase checks: baseline integrity, lint, formatting, strict types, 64 unit/integration tests, nine seeded stress tests (17,100 actions) and build passed. Original deployment and repository reference both match all ten SHA-256 entries. All 42 browser cases passed across desktop/mobile Chromium and mobile WebKit emulation, including real backup restore and same-origin tab coordination against a fake provider. PR publication and final-head CI evidence follow local verification. See docs/phase-3-verification.md and docs/sync-protocol.md inside repository/ for exact evidence and protocol limits.

Live testing is separate: no user-credential Dropbox or physical-phone checks were performed. Exact console redirects/scopes/app access, disposable live multi-device/revoke/account-switch trials, large real-data capacity, hardware interruption, full feature parity and release gates remain open. Import/transfer files above 32 MiB are retained but refused; no lossy compression or automatic retention pruning. Missing parent-program relationships block application for recovery. Production is unchanged.

Next: review the Phase 3 PR and its checks, then use disposable data for the documented live rehearsal before any release. Do not merge or deploy automatically. Phase 4 requires its own implementation request; preserve this branch/artifacts and existing user data.

## Latest session — Phase 2 implementation, 2026-10-28

The user explicitly authorized Phase 2 implementation, routine technical decisions and branch/PR publication. Work starts from fetched main `192e5caa7bf0785f40122a97226d4d451781147a` (Phase 1 PR #1 merged). Owner-reported protection/Dependabot settings remain uninspected. This entry supersedes historical planning-only and Phase 1 open/unmerged statements below.

Implementation in `repository/` on `phase-2-local-reliability`: native IndexedDB atomic data/pending/version writes; non-destructive legacy migration with all collections/embedded photos and unknown fields retained; private connection metadata isolation; recovery snapshots and persistent removal Undo; immediately saved routine names/weekdays/selections/raw set drafts; all-main-tab date/storage/profile bar. Old-client divergence and invalid/unsupported data block editing without resetting it. No Dropbox transport, E2EE, worker, merge or deployment. Only the Old Replift Deployment baseline was used; originals remain untouched.

Checks: lint, format, strict types, 29 unit/integration tests, six seeded stress runs (15,000 navigation + 1,200 persistence actions), build and baseline checksums passed locally. All 33 browser checks passed across desktop/mobile Chromium and mobile WebKit emulation. PR [#8](https://github.com/byshriv/Replift/pull/8) is open, unmerged. Final source revision `352b7378c81926a4636bcfcf3673ffe8e2e90101` passed the local checks; the final evidence commit changes documentation only. Initial GitHub quality/browser/CodeQL passed; check final-head CI in the PR; see [Phase 2 evidence](docs/phase-2-verification.md). Physical devices, live Dropbox, hardware interruption, large real-data migration, full portable backup/restore and complete feature parity remain untested/later gates. Failed writes remain visibly unsaved in memory; never promise survival after closing a failed-write tab.

Next: review Phase 2 PR #8 and actual CI evidence before merge. See its final branch head; local source/preview ZIPs and SHA256SUMS are generated in repository/artifacts (ignored). Phase 3 is optional Dropbox transport/conflict work under its own implementation authorization. Production is unchanged.

## Phase 1 current resolution — 2026-10-28

- [x] Explicit user go and scope: foundation/baseline inventory/CI/tests/docs/branch/PR, production unchanged.
- [x] Sole baseline preserved with checksums; 420 original exercise identities; initial P01–P40 feature/data/defect inventory.
- [x] Local toolchain/build/unit/stress checks; 9 automated browser cases across Chromium/mobile Chromium/mobile WebKit; dependency audit 0 vulnerabilities.
- [x] Support email, Lucide, no intro MP4, GitHub instead of Forms, E2EE excluded — settled decisions.
- [x] PR #1 opened; GitHub quality/browser/CodeQL passed on implementation commit.
- [ ] Enable main protection and squash-only workflow: settings API unavailable and browser signed out. See docs/repository-workflow.md for exact steps.
- [x] Phase 2 implemented with synthetic migration/atomicity/Undo/top-bar evidence; PR review remains.
- [ ] Live Dropbox, physical devices, installed/offline PWA, full feature parity and production equivalence remain unverified.
- [ ] Cloudflare account/project/domain migration rehearsal; actual settings untouched.
- [ ] Later content and detailed feedback/deletion UX still pending.

Historical checklist below is not current authorization or an instruction to use the other demo, recover Zip 2, add Forms/E2EE/MP4, or repeat resolved questions.

## Resolutions after initial checklist — 2026-10-28

The unchecked historical list below is retained for traceability, NOT as a request to ask answered questions again. Use this resolution record and PROJECT-CONTEXT first.

Resolved: Phase 1 scope delegated; top bar all main tabs; inline routine editing/immediate save/removal Undo approved; conflict and data/sync design delegated; E2EE excluded; use only Old Replift Deployment, confirmed current; rebuild engine; Cloudflare Direct Upload now and Git later; Dropbox configuration verified by user; support@shriv.work; GitHub feedback/issues instead of Google Forms; socials/WebP later; no new intro MP4; Lucide; existing legal text accepted, broader privacy at https://shriv.work/privacy.

Still actionable: actual test-device availability; exact GitHub feedback UX; Cloudflare Git migration mechanics; record granularity/migration/retention design; automated and live verification; later social links and exercise images. Affirmative answers to the remaining planning items authorize proceeding with their investigation/design, not claiming them implemented or tested.

Updated: 2026-10-28. Canonical local open-items file. Checked means resolved, not merely discussed.

## Before implementation

- [ ] User go for Phase 1 and its exact scope.
- [ ] Top bar: Home only or all main tabs? Proposed all main tabs.
- [ ] Routine sets/weights/reps editable inline? Proposed yes, immediate save and removal Undo.
- [ ] Conflict options: use current/use alternative/Keep both where suitable? Proposed yes with retained versions.
- [ ] Optional end-to-end encryption before launch, later, or excluded? Not implemented.
- [ ] Available test phones/browsers and existing real data needing protection.

## Source and infrastructure

- [ ] Complete feature parity inventory and runtime comparison of A/B.
- [ ] Confirm local Demo B equals currently deployed build; web retrieval failed.
- [ ] Recover any Zip 2 source if user has another copy; unavailable path is not proof none exists elsewhere.
- [ ] Inspect Cloudflare project type (Direct Upload/Git), settings and deploy/rollback method.
- [ ] Verify exact Dropbox registered redirect, app-folder access, scopes and production access status.
- [ ] Bootstrap new empty repo and establish protections/required checks.
- [ ] Check local browser/runtime tooling; CI fallback if needed.

## Data and sync design

- [ ] Stable IDs and record/field granularity, coupled-field/reorder rules.
- [ ] Legacy local/cloud schema migration with preserved originals and old-client protection.
- [ ] Tombstone/retention policy and safe compaction.
- [ ] Account switching/first connection reconciliation UX.
- [ ] Photo compression targets, full backup format and conservative cleanup.
- [ ] Decide synced versus device-local preferences and in-progress drafts.
- [ ] Backups/recovery retention and storage-quota handling.
- [ ] Live uploads/downloads/conflicts/background/offline/refresh verification.
- [ ] Android OAuth redirect and wrapper feasibility.

## Owner-provided content

- [ ] Support email.
- [ ] Delete-feedback and issue-report Google Form links and field mapping.
- [ ] WhatsApp, X, Instagram, Strava links.
- [ ] Donation link and Dropbox how-to video link.
- [ ] Exercise WebP illustrations (serials 1–420) and bench-press style reference as needed.
- [ ] Intro MP4, about 3 MB, 3–4 seconds, #121010 background.
- [ ] Icon approval and optional cleaned muscle SVG.
- [ ] Owner review of Terms and Privacy.

## Ongoing feedback

User will use the improved demo and add requests. For each: describe reproduction/desired behaviour, priority, user approval, phase and acceptance check. Additional inspiration features are not approved by default.
