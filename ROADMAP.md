# Replift roadmap

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

Latest scope overrides (2026-10-28): Phase 1 uses only Old Replift Deployment; archive/preserve that baseline and inventory it, without consulting Demo A. Rebuild engine later. Use Lucide, GitHub feedback/issue integration instead of Forms, no new intro MP4, E2EE excluded. Top bar all tabs and inline/autosaved routine editing with removal Undo approved. Data/sync decisions delegated. Phase 1 includes foundation/CI/docs and a reviewable branch/PR where authorized by the next implementation request; no production cutover. Existing Direct Upload → Git hosting transition is later work requiring project-mode verification.

Updated: 2026-10-28. Status: Phase 1 implementation and checks complete; PR #1 open, owner review and branch protection pending.

Phase numbers here replace ambiguous historical Zip numbers. Phase scope remains proposed until the user gives go. Each phase produces a source zip, test report, updated context, and deployable build when relevant. Publish/push/deploy only within the user's authorization.

| Phase | Outcome                                            | Status                                        |
| ----- | -------------------------------------------------- | --------------------------------------------- |
| 1     | Preserved baseline and repository foundation       | Complete — PR #1 merged                       |
| 2     | Durable local saving, routine editor and top bar   | Complete — PR #8 merged                       |
| 3     | Optional Dropbox sync and conflict management      | Implemented; PR review and live gates pending |
| 4     | Complete React production port with feature parity | Not started                                   |
| 5     | PWA, feedback, assets and polish                   | Not started                                   |
| 6     | Android APK                                        | Not started                                   |
| 7     | Beta, migration rehearsal and release              | Not started                                   |

## Phase 1 — foundation

- Recheck empty repository and preserve only Old Replift Deployment with checksums; never consult or copy the other demo.
- Inventory screens, flows, data fields, feature rules and known defects. Map every feature to a test or manual acceptance check.
- Initialize React/strict TypeScript/Vite, ESLint 9, TypeScript 5.9, Prettier, Vitest, Playwright, Zustand, Zod and lockfile.
- Preserve a runnable reference demo separately; foundation app is not a feature-complete port.
- Add MIT/Shriv licence, README, CONTRIBUTING, SECURITY, env example and architecture notes.
- Configure CI for lint/types/tests/build/browser tests, CodeQL and dependency maintenance. Verify current action compatibility rather than blindly copying historical action versions.
- Bootstrap initial commit/branch, then establish PR/check/squash workflow and branch protection. Do not claim old rulesets survived repository recreation.
- Document Cloudflare setup/rollback options without replacing the current deployment.

Acceptance: reproducible install/build; actual check results; preserved originals; complete initial feature inventory; reviewable repository foundation. No production cutover.

## Phase 2 — local reliability and routine UX

- IndexedDB schemas and transactional writes; preserve legacy `replift.v1` during verified migration.
- Durable pending/version metadata and recovery points.
- Exercise cards with set rows, weights/reps, set controls and removal Undo.
- Commit routine selection immediately; picker Done closes rather than commits.
- Persist names/weekdays/values without relying on Back or close events.
- Date/sync/profile top bar with truthful local/connection states.
- Preserve invalid/incomplete editor input without accepting it as a finished set.

Acceptance: Back/sheet close/reload preserve committed edits; failures are visible; migration checks all collections and photos; unrelated history survives routine changes.

## Phase 3 — safe Dropbox demo

- Implement SYNC-DESIGN.md with pure core, provider and scheduler boundaries.
- Versioned import of legacy Dropbox file, safe cutover and old-client protection.
- Revision-checked upload, remote-only discovery, durable pending changes, retries and cancellation.
- Conflict alternatives, review UI, delete markers and record identities.
- Photo blobs, transfer queue, connection/account-change handling, backup/recovery.
- Test via fake Dropbox and multi-device simulations; user then tests real Dropbox with disposable data.

Acceptance: sync invariants pass; incompatible versions remain recoverable; live results reported separately. Deliver improved demo for ongoing user feedback.

## Phase 4 — production UI and domain parity

Port vertical slices reusing Phase 2/3 modules:

1. App shell, navigation, sheets, draft bar and error boundary.
2. Exercise library, custom exercises, images, programs, routine editing and templates.
3. Workout logging, prior values, autofill, validation, menus and reconstruction.
4. Finish/history, PR recomputation, routine updates, cards and sharing.
5. Home/Stats layouts, charts, calendar, muscles, recovery, measures and photos.
6. Settings/profile/units, onboarding/walkthrough, logout/deletion.

Acceptance: FEATURE-SPEC and inventory mapped to implementation and actual tests; no reference feature silently dropped. Benchmark source behaviour against explicit requirements where they disagree; requirements win.

## Phase 5 — PWA and polish

- Offline shell/fonts/assets; installation and approved icons.
- Safe SW update prompts, no forced reload during logging/editing; only delete app-owned caches.
- Keyboard/safe-area/small-screen/accessibility/performance review.
- GitHub feedback/issues, external links, donation, email and Dropbox help video (latest user override).
- Share images/fallback downloads; Terms/Privacy for owner review.
- Review unsent-change warnings before logout and deletion; failed feedback submission cannot trap deletion.

Acceptance: offline/update/install/share tests; agreed real-device checklist; outstanding placeholders explicit.

## Phase 6 — Android

- Prove wrapper and external-browser OAuth return; Capacitor is provisional.
- Keep `io.github.byshriv.replift`; implement back hierarchy, haptics, sharing.
- Treat APK/PWA storage as separate until tested; import/Dropbox migration path.
- Signed APK build, signing-key backup, install/update docs and free direct distribution.

Acceptance: real-device install plus same-key upgrade preserves data; OAuth returns successfully; signing key safely retained outside repo.

## Phase 7 — release

- Complete LAUNCH-PLAN gates.
- Beta, two-device sync, migration/restore/upgrade/rollback rehearsal.
- Review Dropbox production access requirements before broad distribution.
- Owner approves assets, legal text and actual release.
- Tag release with source zip, static build, APK/checksums as applicable and known limitations.

Acceptance: no unresolved data-loss blockers; evidence attached; user authorizes production cutover. Rollback must respect database/cloud schema compatibility.
