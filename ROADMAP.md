# Replift roadmap

## Latest session — Phase 4 React UI/domain port, 2026-10-28

The user explicitly authorized complete Phase 4 implementation, routine technical decisions, checks, continuity updates and a reviewable branch/PR. Work started from fetched main `7ba12150f17610b4b55be89e41a221bdabc8b11b` (Phase 3 PR #9 merged), with existing owner-review planning edits preserved. Implementation is on `phase-4-react-port` in the separate `repository/` checkout. This entry supersedes older Phase 4-not-started and planning-only statements below.

Implemented the React UI/domain port: workout drafts/logging/all eight types, previous/default values/autofill, set menus/RPE, exact reconstruction, finish/history/edit/delete/PR recomputation and share cards; all 18 templates, custom library/favourites/filters/images, routine CRUD with existing autosave/Undo; configurable Home/Stats, charts/calendar/muscles/recovery, measures/photos; profile/units/onboarding/walkthrough, GitHub feedback and explicitly confirmed local logout/deletion. Phase 2 persistence and Phase 3 sync/conflict/backup modules are reused. No schema/protocol version bump; existing originals and unknown content are retained. New image previews retain original bytes, and stale workout commands check draft/item/set identities.

Current local evidence: lint/format/strict types/build and 89 unit/integration tests passed; 12 stress tests cover 19,500 seeded actions; 81 browser cases passed across desktop Chromium, mobile Chromium and mobile WebKit emulation. Original deployment and repository reference each match all 10 SHA-256 entries. The final full browser rerun passed 81/81, followed by nine repeated conflict/reconnect cases. The stale acknowledgement race was corrected by showing requested sync immediately and waiting for persisted conflict resolution in the test. See `docs/phase-4-verification.md` and `docs/phase-4-parity.md` in repository/. PR publication and final-head CI are pending in this snapshot.

Live evidence is separate: no real Dropbox credentials or physical-phone checks. Native sharing/audio/haptics, installed/offline PWA, real two-device Dropbox/configuration/revocation, large-data capacity and hardware interruption remain release gates. Vite warns about the roughly 534 kB JavaScript chunk; the existing 32 MiB import/provider limit remains. No automatic retention cleanup. Only Old Replift Deployment was used; its originals are untouched. No E2EE, other demo, intro MP4, merge, Cloudflare/DNS change or production deployment.

Next: publish the review branch/PR, review its actual CI, then owner review. Phase 5 still needs its own implementation request. Phase 7 owner correction/parity acceptance remains mandatory before Phase 8 release; implementation and automated tests do not replace that acceptance.

## Latest planning decision — owner review before v1.0.0, 2026-10-28

The user requested a dedicated phase for dictating previously unreported errors, bugs, UI/UX corrections, additions and differences from the demo. Phase 7 is now **owner review, corrections and demo parity**; the former Phase 7 release work moves to **Phase 8 — beta, migration rehearsal and v1.0.0 release**. Phases 1–6 keep their scope and numbering. This decision supersedes older references to Phase 7 as release.

Feedback can be captured now and throughout development in [the owner feedback log](areas/v1-owner-feedback.md). During Phase 7, provide a reviewable preview, record the owner's requests in their own terms, agree on expected behaviour, implement authorized batches, verify them and repeat owner review. Compare only with `Old Replift Deployment/Replift-PWA`; preserve that baseline and all user data. Existing explicit requirements override demo behaviour.

Do not deploy v1.0.0 until the owner explicitly confirms the review is complete and every accepted v1.0.0 item is verified and accepted, or explicitly deferred by the owner with its reason and release impact recorded. Data-loss and other release blockers cannot be waived through a routine deferral. New findings during Phase 8 reopen the relevant review items before cutover. New feature or architecture proposals still need agreement; collecting feedback does not authorize unspecified implementation.

This session updates planning documents only, in both the parent workspace and `repository/`. No application implementation, push, merge or deployment is authorized by this request. Phase 4 remains the next implementation phase under its own go. Historical test results below are unchanged; no application tests ran for this documentation update. Live Dropbox and physical-phone evidence remain separate release gates.

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

Latest scope overrides (2026-10-28): Phase 1 uses only Old Replift Deployment; archive/preserve that baseline and inventory it, without consulting Demo A. Rebuild engine later. Use Lucide, GitHub feedback/issue integration instead of Forms, no new intro MP4, E2EE excluded. Top bar all tabs and inline/autosaved routine editing with removal Undo approved. Data/sync decisions delegated. Phase 1 includes foundation/CI/docs and a reviewable branch/PR where authorized by the next implementation request; no production cutover. Existing Direct Upload → Git hosting transition is later work requiring project-mode verification.

Updated: 2026-10-28. Status: Phase 1 implementation and checks complete; PR #1 open, owner review and branch protection pending.

Phase numbers here replace ambiguous historical Zip numbers. Phase scope remains proposed until the user gives go. Each phase produces a source zip, test report, updated context, and deployable build when relevant. Publish/push/deploy only within the user's authorization.

| Phase | Outcome                                            | Status                                        |
| ----- | -------------------------------------------------- | --------------------------------------------- |
| 1     | Preserved baseline and repository foundation       | Complete — PR #1 merged                       |
| 2     | Durable local saving, routine editor and top bar   | Complete — PR #8 merged                       |
| 3     | Optional Dropbox sync and conflict management      | Implemented; PR review and live gates pending |
| 4     | Complete React production port with feature parity | Implemented; review pending                   |
| 5     | PWA, feedback, assets and polish                   | Not started                                   |
| 6     | Android APK                                        | Not started                                   |
| 7     | Owner review, corrections and demo parity          | Planned; owner review pending                 |
| 8     | Beta, migration rehearsal and v1.0.0 release       | Not started                                   |

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

## Phase 7 — owner review, corrections and demo parity

Purpose: give the owner a dedicated review and correction cycle before v1.0.0 deployment, including issues and desired changes not discussed in earlier phases. Capture feedback earlier whenever it arrives; do not delay known critical fixes until this phase.

- Provide a reviewable preview of the completed flows, with the build/revision identified and safe test data. Keep production unchanged.
- Let the owner dictate errors, bugs, UI improvements, UX changes, missing behaviour and requested additions in small batches. Record them in `areas/v1-owner-feedback.md`; ask focused questions only where expected behaviour is unclear.
- Compare affected screens and flows only with `Old Replift Deployment/Replift-PWA`. Restore missing demo behaviour unless an accepted requirement intentionally changes it. Link existing inventory entries where applicable.
- Agree on each item's expected result, v1.0.0 scope and acceptance check before implementation. Separate accepted requests from proposals; discuss new features and architecture changes before adding them.
- Implement authorized batches, run the required lint/strict types/unit/integration/seeded stress/build/browser checks, record actual evidence and return the preview for owner review. Verify data preservation and affected flows.
- Repeat until the owner explicitly says the review is complete. Mark items accepted only with owner confirmation; deferrals require the owner's explicit decision and recorded reason/release impact.

Acceptance: owner confirms review completion; every accepted v1.0.0 item has implementation and verification evidence plus owner acceptance, or an explicit owner-approved deferral; no unresolved release blockers. Carry the accepted revision and review outcome into Phase 8. Phase 8 findings reopen affected items and require renewed acceptance before cutover. This sign-off does not replace LAUNCH-PLAN gates or final deployment authorization.

## Phase 8 — beta, migration rehearsal and v1.0.0 release

- Confirm Phase 7 owner sign-off and accepted review revision, then complete all LAUNCH-PLAN gates.
- Beta, two-device sync, migration/restore/upgrade/rollback rehearsal.
- Review Dropbox production access requirements before broad distribution.
- Owner approves assets, legal text and actual release.
- Tag release with source zip, static build, APK/checksums as applicable and known limitations.

Acceptance: no unresolved data-loss blockers; evidence attached; user authorizes production cutover. Rollback must respect database/cloud schema compatibility.
