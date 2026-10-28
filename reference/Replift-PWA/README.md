# Replift PWA demo

A static installable Progressive Web App workout tracker with local-first storage and optional Dropbox account-owned backup/sync.

## Files

- `index.html` — Replift app and Dropbox OAuth/sync client.
- `manifest.webmanifest` — install metadata.
- `sw.js` — app-shell offline cache.
- `icons/` — PWA and Apple touch icons.
- `_headers` — example hosting security headers.
- `DEPLOY.md` — deployment instructions.
- `DROPBOX-SETUP.md` — Dropbox app registration and sync configuration.

## Dropbox sync

Dropbox requires one-time setup by the app owner. Follow `DROPBOX-SETUP.md` to register a Dropbox App Folder app, configure the exact HTTPS redirect URI and enable `files.content.read` + `files.content.write`. Each user connects their own Dropbox account from **Settings → Dropbox sync**. Users can restore on a new device and the app detects Dropbox revision conflicts instead of silently overwriting them.

The static ZIP does not include an app secret (none is needed for PKCE) or a registered Dropbox app key. Real Dropbox sign-in will not work until the owner creates the app and supplies its App key. This is a demo implementation and should be thoroughly tested before public production use; it does not currently offer end-to-end encryption or automatic merge of concurrent offline edits.

For normal end-user experience, configure the one public Dropbox App key once in `index.html` as described in `DROPBOX-SETUP.md`; users then only need to authorize their own Dropbox account.
