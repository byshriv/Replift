# Cross-chat handoff

## Latest session - Phase 5 implementation, 2026-10-28

Started from fetched main `c05615684d9ea817f912a585387236d18658233a` (Phase 4 PR #10 merged), clean checkout, on `phase-5-pwa-polish` in repository/. User explicitly authorized implementation, routine choices, verification, continuity and a reviewable branch/PR. Implemented PWA packaged offline caching/install/waiting update notices, mobile/accessibility/bundle polish, PNG/native-share fallbacks, fourth-workout support notice, GitHub drafts, explicit link placeholders and local deletion/legal review. Reuse existing persistence/sync; no schema/protocol change or baseline/data replacement.

Local checks passed: 94 unit/integration, 15 seeded stress tests (22,500 actions), 99 browser cases, lint/format/strict types/build and both ten-file baseline SHA-256 sets. Current evidence and test limitations: repository/docs/phase-5-verification.md; device checklist: repository/docs/pwa.md. Test update lifecycle uses real workers; WebKit additionally closes/relaunches a disposable persistent browser offline. Chromium full process restart helper timed out, so only standard-context offline window reopening is claimed there. Provider-route mocks block workers separately. No real phones, installed native-share sheet or user-credential Dropbox verification.

[PR #11](https://github.com/byshriv/Replift/pull/11) is open and unmerged. Published implementation: `72b8b16dea360cf47dba0ca5bbf46e775188440d`, verified tree `335915a7b88a134c680a5a560d4aeb6b7545666a`. See the Phase 5 verification document for CI/artifact evidence. Final documentation follow-up preserves application/test source; inspect the PR current head before merge. Production/Cloudflare/DNS unchanged; no merge/deployment. Original Old Replift Deployment remains untouched; E2EE/other demo/new intro MP4 excluded. Missing assets/URLs, final icon/legal approval, physical/live and capacity release gates remain explicit. The broader privacy link failed HEAD 404 and GET timeout and is awaiting owner confirmation.

Next: owner reviews Phase 5 PR/evidence and actual final-head CI. Do not merge/deploy automatically. Phase 6 needs a separate implementation request; Phase 7 corrections/parity acceptance remains mandatory before Phase 8 release. Parent and repository continuity are updated together.

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
