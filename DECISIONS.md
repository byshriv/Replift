# Decisions and proposals

## Phase 5 technical decisions - 2026-10-28

Authorized by the user's Phase 5 implementation request: retain the current persistence/sync/schema; generate an exact packaged-asset precache; scope cache names and cleanup to each registration; never cache runtime/provider/OAuth payloads. Updates use the waiting lifecycle, with instructions to finish editing/save/close every window. No skipWaiting, clients.claim or automatic reload.

Reuse original installation icon bytes with final artwork approval pending. Preserve zoom, add safe-area/focus/reduced-motion/small-screen rules and separate optional lazy program loading. Use local fonts and PNG pagination/download fallback; cancel native sharing without downloading. Reuse `st.ds` for the fourth-workout notice. Prepare public GitHub drafts from entered feedback only; feedback availability cannot block local deletion.

Optional owner links require HTTPS and remain explicit when absent. The old broader privacy URL returned HEAD 404 and GET timeout; leave VITE_LINK_PRIVACY pending owner confirmation while retaining in-app Terms/Privacy. Final legal acceptance remains a release gate. Route-based provider mocks block workers; independent PWA tests use actual workers and persistent WebKit restart checks. No physical-device/live Dropbox claims. No architecture, schema, E2EE, production or baseline change.

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

## Phase 1 implementation decisions — 2026-10-28

- Explicit user build request authorizes implementation and branch/PR publication; no merge/deployment.
- Separate checkout `repository/`; preserve only deployed baseline under `reference/Replift-PWA` with 10 SHA-256 entries. Never use/copy the other demo.
- Foundation is a clearly labelled, nonpersistent preview plus read-only baseline catalogue, not a partial replacement for the live logger. Rebuilt engine starts in Phase 2; no E2EE or new gym features.
- GitHub issues open explicitly via a public link, without prefilled user data or credentials; public bug template and private security email supplied. Later deletion/feedback UX remains open.
- Use patched Vitest 5.0.5 after audit found vulnerabilities in the initial candidate; verified Node 24 and Vite 7 compatibility. Retain ESLint ^9 / TypeScript ~5.9 despite ESLint support deprecation warning.
- Bundle Rethink Sans locally, use Lucide; no new intro MP4 or illustration assets.
- Cloudflare official docs confirm Direct Upload cannot become Git-connected in place; later new-project/domain migration requires actual project inspection and release authorization. No hosting mutation now.

## User resolutions — 2026-10-28

These supersede the earlier table/proposals:

- Sole baseline: deployed build under Old Replift Deployment. Do not use Demo A anywhere in future work; leave it untouched.
- Rebuild engine. Top bar all main tabs; immediate routine saving, inline editing, removal Undo approved.
- Agent chooses safe conflict/data/sync design; proposed version retention and appropriate per-record review may proceed. E2EE excluded.
- Cloudflare Direct Upload now; Git deployment desired later. Migration mechanics require inspection, not assumed in-place conversion.
- Dropbox configuration verified by user; independent console evidence not collected.
- support@shriv.work. GitHub integration replaces Google Forms. Social links/illustrations later.
- Keep current intro; no new MP4. Lucide icons.
- Existing legal text accepted by owner; broader privacy URL https://shriv.work/privacy.
- Agent chooses Phase 1 scope and routine technical decisions. No more generic go question is needed when the next chat is instructed to build Phase 1.
- Real-device availability unconfirmed; user delegation does not constitute manual-test evidence.

Updated: 2026-10-28. A proposal is not approval. Record user answers here with dates.

## Accepted requirements

| Decision                                                                                   | Basis           |
| ------------------------------------------------------------------------------------------ | --------------- |
| Free, open-source, local-first; no Replift backend/accounts/tracking                       | User handoff    |
| Preserve demo features and user history/data                                               | User handoff    |
| React/TypeScript/Vite stack and original strict toolchain                                  | User handoff    |
| Optional Dropbox with redirect PKCE; no pasted code or frontend secret                     | User handoff    |
| IndexedDB production storage and legacy migration                                          | User handoff    |
| kg/km/cm stored internally; display unit conversion                                        | User handoff    |
| Permanent exercise serial numbers and Android app ID                                       | User handoff    |
| Use recreated byshriv/Replift repository                                                   | User response E |
| Demo B in Old Replift Deployment is current source                                         | User response C |
| Fix sync/conflicts; date/sync/profile top bar                                              | User request A1 |
| Immediate routine selection saving and exercises shown with sets/removal                   | User request A2 |
| More feedback will arrive during demo use                                                  | User request A3 |
| Architecture inspiration from Super Productivity, optional product research from Liftosaur | User request B  |
| Plan first; implement phases after go                                                      | User process    |

## Proposed, awaiting confirmation or implementation proof

- Demo B as working baseline, Demo A as preserved comparison reference; full parity requires inventory/tests.
- Top bar on every main tab; date left, sync text and profile right.
- Editable routine set rows, immediate local persistence, removal Undo; picker button becomes Done.
- One versioned structured Dropbox data file, separate photo blobs, per-record causal versions and durable tombstones. Exact schema/granularity to prove with tests.
- Conflict review retains incompatible versions; offer Keep both only for suitable records.
- Keep Cloudflare production origin; automate deployment after inspecting existing project type. Do not assume Git integration can be enabled in-place.
- Share tested storage/sync modules with the demo and later React UI to avoid parallel engines.
- Optional encryption remains undecided. Reference code supporting it is not approval.
- Capacitor Android wrapper is provisional until OAuth/platform feasibility is proved.
- New gym features remain out of scope until specifically approved.

## Architecture references

- https://github.com/super-productivity/super-productivity/blob/master/docs/sync-and-op-log/package-boundaries.md — generic sync / provider / host boundaries.
- https://github.com/super-productivity/super-productivity/blob/master/docs/sync-and-op-log/conflict-journal-and-review.md — field merge limitations; current source uses deterministic resolution and retired its journal. Replift's retained conflict-review policy is our own stricter proposal.
- https://github.com/super-productivity/super-productivity/blob/master/docs/sync-and-op-log/local-recovery-points.md — recovery points; documented implementation targets hosted SuperSync, not its Dropbox path.
- https://github.com/astashov/liftosaur — product/testing reference; repository identifies AGPL. No code copied or relicensing decision made.

## Hosting/free-route references

Checked during planning on 2026-10-28; recheck when configuring services:

- https://docs.github.com/en/billing/concepts/product-billing/github-actions — public repos using standard hosted runners have free usage; storage and nonstandard resources still require care.
- https://developers.cloudflare.com/pages/platform/limits/ — free tier has build and asset limits.
- https://docs.dropboxapi.com/dropbox-api/docs/oauth — public-client PKCE and refresh-token flow.

## Future decision entry

Date / question / user answer or evidence / resulting decision / affected files and compatibility implications.
