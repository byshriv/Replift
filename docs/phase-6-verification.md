# Phase 6 verification — 2026-10-28

Phase 6 started from fetched main `91db66cbf78481838b141eac03d2bdfd77d0a317`
(owner-merged Phase 5 PR #11) on `phase-6-android`. Implementation is committed in
`bea56c5`; final delivery metadata follows after validation. This file records
actual checks from this session, not inherited phase results.

## Implementation

Capacitor 8 Android wrapper (`io.github.byshriv.replift`), packaged local assets,
stable HTTPS localhost origin, browser Custom Tab OAuth/PKCE warm and cold intent
return, account preview, single-use/expiry/state checks, Back hierarchy with
unsaved-exit guard, optional native haptics, PNG/JSON native sharing and explicit
browser/PWA/APK complete-backup transfer. Existing persistence/sync/schema and
original source data are retained. No backend, E2EE, other demo, new MP4, merge,
release publication or production/Cloudflare/DNS change.

Release signing uses the new owner-authorized external RSA-4096 key. The signing
config and key are outside the repository with restricted filesystem access.
Gradle receives credentials through child environment variables. No private key,
password or personal data is included in committed files or source artifacts.
Independent/offline signing-key backups still need owner verification.

## Current local evidence

- `npm run check`: passed baseline integrity (ten repository reference files),
  lint, formatting, strict types, 103 unit/integration tests, 18 stress tests and
  production build. Stress covers 28,500 seeded actions: existing 22,500 plus
  6,000 Android Back/return actions (606, 20261028, 0xa6d01d).
- Original `Old Replift Deployment/Replift-PWA`: all ten SHA-256 entries match the
  repository baseline manifest independently. No original/reference bytes changed.
- `npm audit`: zero vulnerabilities after Capacitor installation.
- First signed APK build passed; `apksigner verify --verbose --print-certs`
  passed and `aapt dump badging` confirmed application ID/min SDK 24/target SDK 36.
  Final-source APK pair, full Android lint/instrumentation compilation and final
  browser rerun are being validated; results below must be updated before delivery.
- ADB `devices -l`: no connected devices. No physical installation, hardware
  haptics, actual chooser destination, on-device upgrade or live Dropbox claim.

## Investigation and harness limits

The first native browser run had two wrong selectors per project (a nonexistent
Profile button and an incorrect restore label); the corrected run passed all 12
then-existing cases. A later haptic toggle test used Playwright's synchronous
`uncheck` assertion against a checkbox whose persisted state commits
asynchronously; it now clicks and waits for the saved checked state.

One full stress run timed out the existing seed-42 catalogue test under concurrent
Gradle compilation (five-second test limit). The same suite passed all 18 cases
in the subsequent isolated run without changing assertions, seeds or timeout.

An intermediate full browser run passed 111/117. The new transfer assertion
compared pre-migration fixture values with the exported snapshot, omitting
generated routine-set IDs. It now checks the actual source export, preserving
IDs rather than stripping them. The run also overlapped a build that rewrote
served assets, making reload/dynamic-import failures ambiguous, and a WebKit
conflict test timed out under load. Final builds and browser validation are run
sequentially against fixed assets. These failed attempts are not claimed as passes.

The Android browser harness injects synthetic Capacitor plugin calls/events into
desktop/mobile Chromium and WebKit. It checks UI integration, cold/warm duplicate
returns against a fake provider, Back, haptic preference, chooser cancellation,
photos/credentials and actual backup restore across separate browser contexts.
It does not execute Android's Java/Kotlin bridge, a real intent resolver, recipient
app, hardware actuator or live provider. Unit tests separately reopen IndexedDB
for persisted PKCE, validate invalid/cancelled/expired returns and inspect native
share cache behavior. Native instrumentation compilation is not device execution.

## Outstanding acceptance

Complete the [Android install/upgrade/OAuth/transfer drill](android.md) on disposable
data, record actual device/Android/WebView versions, both APK hashes and signer,
then verify all history, program IDs, measures, original photos, drafts and pending
sync after same-key upgrade and offline restart. Verify exact Dropbox console
registration, live browser return/process death, two-device sync/revoke/reconnect,
native sharing and haptics. Real storage pressure/interruption, 32 MiB limits,
owner assets/legal approval and independent key backup remain gates. Capacitor
remains provisional for release until device acceptance. Mandatory Phase 7 owner
corrections/parity acceptance remains before Phase 8 release.
