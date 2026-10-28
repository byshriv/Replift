# Replift — project context

## Latest session — Phase 4 React UI/domain port, 2026-10-28

The user explicitly authorized complete Phase 4 implementation, routine technical decisions, checks, continuity updates and a reviewable branch/PR. Work started from fetched main `7ba12150f17610b4b55be89e41a221bdabc8b11b` (Phase 3 PR #9 merged), with existing owner-review planning edits preserved. Implementation is on `phase-4-react-port` in the separate `repository/` checkout. This entry supersedes older Phase 4-not-started and planning-only statements below.

Implemented the React UI/domain port: workout drafts/logging/all eight types, previous/default values/autofill, set menus/RPE, exact reconstruction, finish/history/edit/delete/PR recomputation and share cards; all 18 templates, custom library/favourites/filters/images, routine CRUD with existing autosave/Undo; configurable Home/Stats, charts/calendar/muscles/recovery, measures/photos; profile/units/onboarding/walkthrough, GitHub feedback and explicitly confirmed local logout/deletion. Phase 2 persistence and Phase 3 sync/conflict/backup modules are reused. No schema/protocol version bump; existing originals and unknown content are retained. New image previews retain original bytes, and stale workout commands check draft/item/set identities.

Current local evidence: lint/format/strict types/build and 89 unit/integration tests passed; 12 stress tests cover 19,500 seeded actions; 81 browser cases passed across desktop Chromium, mobile Chromium and mobile WebKit emulation. Original deployment and repository reference each match all 10 SHA-256 entries. The final full browser rerun passed 81/81, followed by nine repeated conflict/reconnect cases. The stale acknowledgement race was corrected by showing requested sync immediately and waiting for persisted conflict resolution in the test. See `docs/phase-4-verification.md` and `docs/phase-4-parity.md` in repository/. PR [#10](https://github.com/byshriv/Replift/pull/10) is open and unmerged. Published implementation commit: `6ce13308413e9212ca63eec6473fec15fbaf44ef`; tree `df1a460858ae81cf7fb61741b67b8a2af0b4fb12`, identical to the locally checked index. GitHub [quality/browser CI](https://github.com/byshriv/Replift/actions/runs/40692869018) and [CodeQL](https://github.com/byshriv/Replift/actions/runs/40692869063) passed on that commit. A documentation-only delivery-evidence update follows; application source is unchanged and final-head checks must still be inspected.

Live evidence is separate: no real Dropbox credentials or physical-phone checks. Native sharing/audio/haptics, installed/offline PWA, real two-device Dropbox/configuration/revocation, large-data capacity and hardware interruption remain release gates. Vite warns about the roughly 534 kB JavaScript chunk; the existing 32 MiB import/provider limit remains. No automatic retention cleanup. Only Old Replift Deployment was used; its originals are untouched. No E2EE, other demo, intro MP4, merge, Cloudflare/DNS change or production deployment.

Next: owner reviews PR #10 and the verification/parity map; inspect actual final-head checks before any merge. Phase 5 still needs its own implementation request. Phase 7 owner correction/parity acceptance remains mandatory before Phase 8 release; implementation and automated tests do not replace that acceptance.

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

## Phase 1 implementation — 2026-10-28

The user explicitly authorized Phase 1 implementation, publishing a reviewable branch/PR and routine technical decisions. This supersedes all earlier planning-only/no-go entries below. Implementation lives in the separate `repository/` checkout in the parent workspace; within GitHub, this file is at the repository root. Only Old Replift Deployment was used. No merge or production cutover is authorized. See STATUS and docs/phase-1-verification.md for current evidence.

## Latest user decisions — supersede earlier proposals

Recorded 2026-10-28 after initial planning:

- Use ONLY `Old Replift Deployment/Replift-PWA` as the implementation/reference baseline. Do not use the non-Dropbox demo for comparison, tests or implementation. Leave its files untouched.
- Rebuild the unavailable engine; do not pursue recovery of Zip 2.
- Top bar on all main tabs. Inline routine set editing, immediate saving and removal Undo approved.
- Agent may choose conflict-management/data/sync details within data-preservation constraints. End-to-end encryption excluded from current scope.
- Current Cloudflare project uses Direct Upload. User wants Git-based deployment after GitHub foundation is ready. Verify migration mechanics; a new Pages project/domain reassignment may be necessary, so do not assume in-place conversion or change production during Phase 1.
- User reports Dropbox configuration verified. Exact console settings were not independently inspected; retain a configuration checklist for implementation, not another generic permission request.
- Support email: support@shriv.work.
- Replace Google Forms plans with GitHub integration for feedback and issue reports. Exact UX remains to be designed without exposing credentials or private workout data.
- Social links and exercise WebP illustrations will arrive later.
- Do not add the proposed intro MP4; keep current introduction.
- Use Lucide icons.
- User accepts current Terms/Privacy; broader policy links to https://shriv.work/privacy. This is owner acceptance, not an independent legal review.
- User delegates routine technical choices and Phase 1 scope to agent. Current chat requests a prompt for development in another chat; no application implementation should start here.
- Real-device availability remains unspecified. The agent can choose automated coverage but cannot assume possession of test phones or live verification.

Older source-comparison notes below describe historical inspection only; they do not authorize future use of Demo A. These decisions also supersede older Google Forms, encryption-question, animation and icon-approval entries in other documents.

Updated: 2026-10-28 (Asia/Calcutta). Owner: Swastik, designer; brand/copyright: Shriv.

## Read order

1. AGENTS.md — working rules.
2. This file — product, source files and constraints.
3. STATUS.md — verified state and next action.
4. DECISIONS.md and areas/replift-open-items.md — accepted choices and questions.
5. ROADMAP.md — phase scope and acceptance.
6. FEATURE-SPEC.md, SYNC-DESIGN.md, TESTING.md — implementation contracts.
7. LAUNCH-PLAN.md and HANDOFF.md — release gates and cross-chat procedure.

These local files are the current portable project memory. The old handoff mentioned `/projects/01a13dd8-2c9d-7384-8dc0-5ebe34cd40b4/`; that external project path has not been accessed here. Its local replacement for open items is `areas/replift-open-items.md`.

## Product

Replift is a free, open-source, local-first workout logger. Slogan: “Log after your sets, not between them.” PWA first, Android APK later. No Replift server, accounts, analytics or tracking. A local profile and optional user-owned Dropbox connection replace an account system. Preserve all features of the demo during production migration.

User is a beginner with GitHub/app development. Provide precise steps where manual interaction is required. Build in reviewable phases with a source zip and, when applicable, deployable build. Previous chat downloads failed, so prefer durable GitHub release delivery when publication is authorized.

All required development, hosting and runtime services must have a free route. Existing custom-domain renewal and optional app-store publication are separate costs; free pages.dev hosting and direct APK delivery are the proposed fallbacks.

## Workspace and sources

Workspace: `C:/Users/swast/Downloads/Replift`.

| Source                                                     | Role                                                                                        |
| ---------------------------------------------------------- | ------------------------------------------------------------------------------------------- |
| `Old Replift Deployment/Replift-PWA/`                      | Demo B; user confirms this is the deployed version's source. Working starting point.        |
| `Old Replift Demo (without dropbox connection)/index.html` | Demo A; feature/reference comparison.                                                       |
| `replift-exercise-list.csv`                                | 420-exercise reference library, permanent serial numbers 1–420, 20 columns.                 |
| `Replift.png`, `Replift.svg`                               | Supplied brand assets; approval/usage still to confirm.                                     |
| `design-languaget.md`                                      | Generic visual reference; contains productivity/light-theme text that is not Replift scope. |

Demo B contains `index.html`, `manifest.webmanifest`, `sw.js`, `_headers`, icons and deployment/Dropbox documentation. Preserve original files as a reference baseline.

Dropbox reference files supplied by the user, currently outside this workspace:

- `C:/Users/swast/Downloads/SailorLogbookPush/conflict-review.js`
- `C:/Users/swast/Downloads/SailorLogbookPush/dropbox-sync.js`
- `C:/Users/swast/Downloads/SailorLogbookPush/sync-core.js`
- `C:/Users/swast/Downloads/SailorLogbookPush/oauth-landing.js`
- `C:/Users/swast/Downloads/SailorLogbookPush/sync-scheduler.js`

They were read as implementation references, not instructions to adopt their logbook schema, scheduling, encryption or product rules. Before reusing code, preserve attribution and check its licence and applicability.

## Repository and deployment

- Repository: https://github.com/byshriv/Replift
- Verified through GitHub connector on 2026-10-28: public, size 0, empty contents, default branch main. Recheck before implementation.
- User recreated this repository and wants to use it. Do not delete/recreate it again.
- User-supplied live URL: https://replift.shriv.work
- Public Dropbox app key: `gs2p3dras9gv94g`; present in local Demo B source. Never put a Dropbox app secret in frontend code.
- Cloudflare Pages is the existing host. Project type, configuration and registered OAuth redirects are not verified.
- Permanent Android application ID: `io.github.byshriv.replift`.
- Intended licence: MIT, copyright Shriv.
- Old repository CI, rulesets and foundation are historical facts, not current configuration of the recreated empty repo.

## Agreed stack and boundaries

React + strict TypeScript + Vite; Vitest, Playwright, ESLint 9, TypeScript 5.9, Prettier, Zustand, Zod. IndexedDB for production storage. Pure domain → data/persistence → state → UI; generic sync core separate from Dropbox transport and scheduler. Keep this stack unless a strong reason is discussed.

Suggested folders: `src/domain`, `src/data`, `src/state`, `src/sync/{core,dropbox,scheduler}`, `src/features`, `src/ui`, `src/platform`, `public/{exercises,icons}`, `tests`, `docs`.

The previous Zip 2 engine reportedly had about 96 passing tests and partial UI, but lived at `/home/claude/replift`. That path is unavailable in this Windows workspace. No engine files or test results have been recovered. Rebuild from specifications if no new source is supplied.

## Latest user-authorized scope

Before production: fix Dropbox, introduce conflict management, add a top bar with date left and sync text/button plus profile icon right; make routine exercise selection save immediately and display editable sets instead of names only. User will discover further changes while using the demo. Additional features inspired by other apps require questions and approval.

Latest instruction: create portable planning/context files, then propose the next step. No implementation phase has been authorized yet.
