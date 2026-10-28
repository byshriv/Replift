# Decisions and proposals

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
