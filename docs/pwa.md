# PWA, updates and platform checks

Phase 5 development implementation. Production remains unchanged. Hosting is at the origin root; the current build does not support a subdirectory base. HTTPS is required outside localhost.

`npm run build` generates a content-versioned `dist/sw.js` from the worker template. Its explicit precache list includes the shell, every JavaScript chunk, local fonts, manifest and the original deployment's three installation icons. No runtime responses are written to CacheStorage. Dropbox, OAuth response bodies, user images and backups are excluded. Callback query parameters still reach the existing PKCE handler; the cached response is the public shell, without callback parameters. The worker has no IndexedDB/localStorage access or data migration logic.

Cache names include the worker registration scope and build digest. Activation deletes only earlier caches with that exact app/scope prefix. Unrelated applications, legacy caches, other scopes and all user storage are retained. Failed precaching rejects installation while the active build remains usable. Browser eviction can still remove application caches or local data; a PWA is not a backup.

Updates use the browser's waiting lifecycle. There is no `skipWaiting`, `clients.claim`, activation message, automatic reload or button that forces another tab to upgrade. An update notice instructs the user to finish editing, resolve failed writes, wait for Saved on this device, close every Replift tab/installed window, then reopen. Persisted drafts resume through the existing local repository. Open sheets may contain unsaved transient input, so the instructions say to finish editing even when the persistence queue is empty. An inactive tab may keep an update waiting. Explicit update checks and focus checks do not reload the app.

Installation uses a user-triggered native prompt where offered; other browsers receive menu instructions. Icons are byte-identical copies of the sole baseline artwork, with purpose `any`; maskable artwork and final owner approval are not assumed. No splash video is added. The original folders remain untouched. `_headers` is prepared in the build for later static hosting; no hosting configuration was changed remotely.

Share cards use local fonts and wrap long text into numbered PNGs. Native sharing is attempted only after the user asks. Cancellation stops; unavailable or rejected sharing falls back to downloads. Each card also offers Download PNG. Some browsers may request multiple-download approval for long record lists. The fourth-workout support notice uses existing `st.ds`; dismissal is persisted through the existing save queue. Missing donation URLs do not block continuation.

GitHub feedback opens a public issue draft with only the reason and optional text the user entered. No submission, diagnostics, workout, backup or credential upload occurs automatically. GitHub may require sign-in. Deletion works independently of this external page and retains typed confirmation, Other-text validation, pending-change warnings and local-only scope. A failed local write blocks erasure until resolved. Exported backups and Dropbox files are not deleted.

Optional HTTPS owner URLs are documented in `.env.example`; blank, malformed, non-HTTPS and credential-bearing links render as URL not supplied. Email remains `support@shriv.work`. The previously supplied broader privacy URL returned HEAD 404 and its normal GET timed out during review; `VITE_LINK_PRIVACY` is explicitly pending owner confirmation. Existing Terms are retained, with Privacy clarifications for caching, sharing, external services and deletion. Final legal text and icon approval remain owner release checks.

## Physical-device rehearsal — pending evidence

Use only disposable synthetic data and record device, OS, browser version, revision, origin, date and results. This checklist requires owner agreement and actual results before release; automated emulation does not satisfy it.

1. Android Chrome: install from the menu/native prompt; cold launch in airplane mode; open every main screen and exercise picker. Repeat in iPhone/iPad Safari with Share → Add to Home Screen. Check original icon cropping and launch appearance.
2. Save an unfinished workout and a raw invalid routine value; navigate, close, reopen and verify both. Try storage failure on disposable data: retain the tab and verify the warning/retry before closing.
3. On a disposable preview origin with build A, open a browser tab and installed window, edit in each, publish preview B and check for an update. Verify neither reloads. Finish and save, close both, reopen B, then cold launch offline and compare all synthetic collections/drafts.
4. Interrupt a preview update download. The earlier build must still open. Resume online and repeat successfully. Verify another application's cache remains intact.
5. Check virtual keyboard, safe areas, portrait/landscape, 320px layout, large text/zoom, keyboard/switch navigation, visible focus, VoiceOver/TalkBack and reduced motion. Pinch zoom remains available; no zoom lock is introduced.
6. Share a short card and a long multi-image record card; cancel, reject permissions and use PNG download. Verify image text/pages and that no unintended content is shared.
7. Try feedback while offline or signed out. Cancel the external page and complete local deletion with disposable data; verify Dropbox and unrelated origin storage remain unchanged. Separately test logout warnings and complete backup/restore.
8. Rehearse real two-device Dropbox, revocation and reconnect with the installed worker enabled. The route-based provider mock suite deliberately blocks workers per [Playwright guidance](https://playwright.dev/docs/network); it cannot establish live installed-PWA OAuth behavior.

Signed APK, wrapper back handling and native haptics belong to Phase 6. Phase 7 owner parity/corrections acceptance and Phase 8 release/cutover gates remain mandatory.
