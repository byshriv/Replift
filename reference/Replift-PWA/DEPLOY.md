# Replift PWA demo — deployment guide

This package turns the supplied Replift demo into an installable Progressive Web App (PWA), using the supplied Replift logo for the app icons.

## Included

- `index.html` — supplied gym app demo with install prompt and service-worker registration added
- `manifest.webmanifest` — app name, colors, display mode, and icon metadata
- `sw.js` — app-shell caching and offline reload support
- `icons/` — 192px, 512px, and Apple touch icons
- `_headers` — optional security/cache headers for Cloudflare Pages-compatible hosting

## Deploy

1. Upload the **contents** of this folder to a static HTTPS host (Cloudflare Pages, Netlify, or another host that serves static files).
2. Keep the folder structure intact; `index.html`, `manifest.webmanifest`, and `sw.js` must be at the same site root.
3. Use HTTPS. Service workers and installability generally do not work from ordinary HTTP hosts (localhost is the development exception).
4. Open the deployed site in Chrome/Edge on Android or desktop and choose **Install** when prompted. On iPhone/iPad, open the site in **Safari**, tap **Share**, then **Add to Home Screen**.
5. After deploying updates, bump the `CACHE` version in `sw.js` (for example `replift-shell-v2`) so installed clients refresh the app shell.

## Demo limitations to know before public launch

- This is a static front-end demo. Workout data is stored in the browser's local storage on that device; there is no account system, server database, cloud sync, or recovery if browser storage is cleared.
- Some optional integrations/features in the supplied app may be placeholders. Review the UI and test core flows on target devices before promoting it as a production service.
- Google Fonts is loaded from an external CDN when online; the app shell and icons are cached for offline reopening, but the first visit must be online to load the site.
- The included `_headers` file is recognized by Cloudflare Pages. Other hosts may need equivalent header configuration in their own dashboard/config.

## Quick validation checklist

- [ ] Site is served over HTTPS
- [ ] Manifest loads without errors and icon paths return HTTP 200
- [ ] Service worker is active (browser DevTools → Application)
- [ ] Install flow works in Chrome/Edge; iOS Safari instructions are visible
- [ ] App reopens after first successful visit while offline
- [ ] Workout creation, completion, and local data persistence tested on Android and iOS
- [ ] Privacy notice and backup/data-loss expectations are clear before real-user release

## Dropbox setup

Dropbox sync needs an app registration and the final HTTPS URL. Complete `DROPBOX-SETUP.md` before testing account connection. The Dropbox redirect URI must exactly match the URL users open. Use an App Folder app and enable `files.content.read` and `files.content.write`; enter the Dropbox App key in Replift Settings → Dropbox sync. Do not use an app secret in the static client.
