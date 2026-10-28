# Decisions and proposals

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
