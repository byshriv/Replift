# Phase 5 verification — 2026-10-28

Started from fetched `origin/main` at `c05615684d9ea817f912a585387236d18658233a`, the merged Phase 4 PR #10. Branch: `phase-5-pwa-polish`. This evidence supersedes historical Phase 5-not-started statements; it does not waive physical-device, Dropbox, owner-review or deployment gates.

## Implementation

The existing local repository, save queue, migrations, recovery, sync engine, protocol and schema are reused without changes. Added a generated precache-only worker, manifest/original icons, install guidance, offline/update status and scope-specific cache cleanup. Waiting updates cannot take over existing windows; close all windows after completing edits and saving to activate. See [PWA contract and physical-device checklist](pwa.md).

Mobile/accessibility changes retain zoom, add safe-area padding/focus/large-text/reduced-motion rules, keep set buttons at least 44px wide on small screens, exclude text areas and links from tab-swipe detection and reliably focus dialog opener buttons in Safari. Settings and program editing are lazy chunks; optional program loading has its own boundary so the workout/library remains visible. Fonts remain local, using Latin files with system fallback. React/validation chunks avoid the previous large-chunk warning. Largest JS output is approximately 420.3 kB raw / 120.2 kB gzip, compared with the recorded Phase 4 approximately 534 kB single chunk. This is bundle-size evidence, not a measured startup or hardware benchmark. Build still emits upstream Zod annotation warnings.

PNG cards wrap long text, paginate long lists, support explicit downloads and fall back from rejected/unavailable native sharing. Cancellation does not download. The fourth-workout support notice persists dismissal with existing `st.ds`. Optional links are validated HTTPS configuration with explicit missing states. Feedback prepares a public GitHub draft only from entered reason/text. Local deletion remains independent of feedback, blocks unsaved writes and warns about pending changes/drafts and retained Dropbox files. Existing Terms remain; additional Privacy text explains caching, sharing and erasure.

## Automated evidence

- `npm run check`: baseline integrity, ESLint 9, Prettier, strict TypeScript 5.9, unit/integration, seeded stress and production build. Passed locally; final documentation and test-harness-only edits were checked again with lint, formatting and strict types.
- Unit/integration: 94 tests, including worker asset isolation, failed precache retaining the earlier cache, cleanup limited to the exact app/scope, link validation, feedback encoding, text wrapping and cancelled native sharing.
- Stress: 15 tests / 22,500 seeded actions. Existing 19,500 domain/navigation/persistence/sync actions are rerun; new share/link boundary runs add 1,000 actions each with seeds `505`, `20261028`, `0xabc123`. Assertions cover exact text retention, bounds, safe URL schemes and feedback encoding.
- Browser: desktop Chromium, Pixel 7 Chromium emulation and iPhone 13 WebKit emulation. The 99-case suite covers existing data/sync/feature behavior plus real-worker offline reload/edit/draft recovery/lazy chunks/local fonts, manifest/icons/manual install guidance and simulated native prompt, two-tab waiting update/activation/persistent-browser closure and offline relaunch/unrelated-cache retention, 320px/large text/reduced motion/dialog focus, PNG/native-rejection fallback, public feedback/missing URLs and one-time support notice. Emulation is not a physical installation test.
- SHA-256: original `../Old Replift Deployment/Replift-PWA` and repository `reference/Replift-PWA` each match all ten recorded entries. Public installation icon copies use the original bytes.
- Synthetic screenshots are kept in ignored `artifacts/`, including `phase-5-mobile-legal.png`; the 320px large-text dialog was visually inspected. No personal data is used.

Initial failures were investigated rather than counted as passes. Safari tap focus was corrected. Update tests explicitly wait for activation and cache visibility, serve an immutable build snapshot, and use disposable disk-backed WebKit profiles to verify full browser closure/offline relaunch. Chromium verifies all controlled tabs closing and reopening offline with the standard test context; its separate persistent launcher timed out locally, so full Chromium process restart is not claimed. Earlier temporary WebKit contexts lost all cache bodies after closing their Replift pages, including unrelated sentinel bodies; those failures are not counted as app passes. Cache names/cleanup include registration scope. The old foundation assertion of zero workers was replaced with verification of the expected worker. Provider mocks block workers because Playwright routing can miss controlled requests; the no-worker two-device test warms its lazy editor before going offline. Real worker/offline/update tests remain enabled separately. Installed-worker OAuth against real Dropbox still needs the live rehearsal. No real user credentials were used; an early WebKit run bypassed the token mock and received an error using a synthetic code, which is not successful live Dropbox evidence.

## Links, assets and live evidence

Public HTTP checks: GitHub source returned 200; issue creation redirected to GitHub login and returned 200. No issue or email was submitted. The previously supplied broader policy URL `https://shriv.work/privacy` returned 404 for HEAD; a normal GET timed out after 20 seconds. It is explicitly pending confirmation in the app; `VITE_LINK_PRIVACY` is blank until the owner supplies/confirms an available URL. The in-app Terms/Privacy remain available offline.

Missing owner content remains explicit: WhatsApp community, X, Instagram, Strava, donation and Dropbox-help URLs, exercise illustrations, final icon approval and final legal acceptance. Existing user images remain intact. No new MP4, E2EE, other demo, backend, accounts or analytics.

No physical phone, installed Safari/Chrome home-screen launch, actual native share sheet, VoiceOver/TalkBack, keyboard hardware/virtual-keyboard interruption, real two-device Dropbox, capacity/hardware interruption, signed APK, Cloudflare/DNS change, merge or production deployment was performed. The existing 32 MiB transfer/import limit and large-data/storage release gates remain. Phase 6 Android and mandatory Phase 7 owner review precede Phase 8 release.

## Final delivery record

Local check pipeline passed: 94 unit/integration tests and 15 stress tests (22,500 actions). Final full browser run passed 99/99. Two additional concurrent persistent-profile WebKit update/offline-relaunch trials passed. Source commit, PR, final-head CI and artifacts are recorded after publication below.
