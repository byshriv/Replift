# Replift — project context

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
