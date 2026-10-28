# Phase 3 verification — 2026-10-28

Branch: `phase-3-dropbox-sync`, based on fetched main
`2760a167e81e2acc4ec371d18e1b24ac28f02f3c` (Phase 2 PR #8 merged).
This report records checks run in this phase, not inherited Phase 2 results.
Final source revision and PR/CI evidence are recorded below at delivery.

## Implementation

Optional redirect-PKCE Dropbox connection with account/content preview; schema-1
cloud migration into a separate v3 path; causal records, retained alternatives and
deletion markers; revision-checked writes; clean-device discovery; durable pending
work; cancellation/generation checks; retries and same-origin tab coordination;
immutable photos with durable source/queue and partial metadata progress; full
backup/previewed restore and recovery alternatives. See [protocol](sync-protocol.md).

The original `Old Replift Deployment/Replift-PWA` and repository reference remain
unchanged. No non-Dropbox demo, copied third-party engine, E2EE, backend, worker,
merge or deployment is included. Production is unchanged.

## Checks

Final local results on the implementation source:

| Command/check                          | Result                                                                |
| -------------------------------------- | --------------------------------------------------------------------- |
| `npm run check`                        | Passed: baseline, lint, format, strict types, tests, stress and build |
| `npm test`                             | 64 unit/integration tests passed                                      |
| `npm run test:stress`                  | Nine tests / 17,100 seeded actions passed                             |
| `npx playwright test --workers=2`      | All 42 cases passed across all three browser projects                 |
| Original deployment SHA-256 comparison | All ten original files match the preserved manifest                   |
| `git diff --check`                     | Passed                                                                |

The mobile screenshot was visually inspected for readable controls/conflict values
and narrow-screen wrapping. It uses only synthetic fixture content. Source ZIP,
static preview ZIP and SHA256SUMS are generated locally after the commit; they do
not constitute a deployed preview or production release.

The unit/integration suite covers:

- Lossless collection/ordering/unknown/null-field handling, stable measurement and
  set identities, atomic routine fields, independent edits, concurrency, durable
  tombstones/delete-edit conflicts, stale review, valid Keep both and old-backup intent.
- Two/three isolated fake-provider devices, remote-only discovery, repeated delivery,
  upload revision races, lost responses, edits during upload, restart recovery,
  authentication/rate/network failures, disconnect/account change and invalid cloud.
- OAuth state/expiry/single-use and refresh, strict HTTP create/update, exact absence
  handling, Retry-After, bounded streams, clean discovery scheduling and cancellation.
- Photos through interrupted responses, missing/corrupt sources, independent metadata
  acknowledgement, full export bytes, restore alternatives, active-editor deferral,
  failed recovery capture and failed local acknowledgement after cloud success.

Stress seeds: `7303`, `20261028`, `912559` for 300 actions each across three isolated
devices, including independent/conflicting edits, review, provider failure, restart,
lost responses and repeated delivery. Assertions run after each action: causal merge
commutativity/associativity/idempotence, data/document agreement, unrelated history,
photo/unknown content preservation, failure atomicity and final convergence. These
supplement existing 15,000 navigation and 1,200 persistence actions (17,100 total).

Browser suite: 42 cases across desktop Chromium, Pixel 7 Chromium and iPhone 13
WebKit emulation, including the 33 existing cases plus nine sync cases: optional
OAuth return/account/legacy review, photo publication, backup download and actual
previewed restore; two isolated profiles with offline edits/conflict decisions and
failure/reload recovery; and same-origin tabs holding one Web Lock with another
request pending. All provider requests are intercepted with synthetic data; this
is not a live Dropbox test. Mobile screenshot: `artifacts/phase-3-mobile.png`.

Earlier check attempts found and corrected a false conflict from per-device initial
ancestry, unrelated edits blocked by order conflicts, missing exposed revision headers
in the HTTP fake, an outdated status-text assertion, a Node/Vite environment lookup,
and WebKit photo-source persistence. IndexedDB sources now use byte buffers and are
reconstructed as Blobs; the corrected WebKit sync flows pass. These attempts are
not counted as final successful checks. Build warnings about dependency PURE
annotations are nonfatal; no toolchain major versions were changed.

## Live testing and remaining gates

**No live Dropbox requests with user credentials and no physical-phone testing
were performed.** Dropbox console scope/redirect/app-access settings remain
uninspected. Synthetic OAuth interception and WebKit emulation prove neither
real-provider authorization nor physical Safari/Android behavior.

Before release: disposable live two-device/revoke/refresh/reconnect/account-switch
and legacy cutover trials, complete photo backup/restore drill on real devices,
large real-data capacity/performance, hardware interruption/eviction behavior and
the rest of LAUNCH-PLAN. No production cutover is authorized. A preview origin has
separate local storage from production. Files over 32 MiB are refused without
replacement; no compression, multipart transfer or automatic retention pruning.
Missing parent-program relationships block application and require recovery rather
than silently discarding routines. Full logging/measurement/photo screens and PR
recomputation remain Phase 4.

## Delivery evidence

Publication and final-head CI evidence will be added after the final local checks.
