# Replift Dropbox sync setup

Replift uses Dropbox OAuth 2.0 Authorization Code + PKCE. Users sign in directly with Dropbox; the app never asks for their Dropbox password. Each user stores their own `replift-data.json` in the Replift app folder in their Dropbox account.

## One-time setup for the app owner

1. Deploy this folder to your final HTTPS domain first (for example `https://replift.example.com/`). Dropbox OAuth redirect URIs must match exactly, including path and trailing slash.
2. Open the [Dropbox App Console](https://www.dropbox.com/developers/apps) and create an app with **Scoped access** and **App folder** access.
3. In the app's Settings, add the exact deployed app URL as an OAuth 2 redirect URI. For a root deployment this is `https://YOUR-DOMAIN/`; if hosted in a subfolder, include that path, e.g. `https://YOUR-DOMAIN/replift/`.
4. In Permissions, enable `files.content.read` and `files.content.write`. Save the permission changes.
5. Copy the app's **App key** (not the app secret). The app key is public client configuration and is entered by the user in Replift Settings → Dropbox sync. Do not put an app secret in this static client.
6. Test using a non-production Dropbox account first: connect, upload, refresh the page, and restore on a second device.

## User setup

1. Open Replift → Settings → Dropbox sync.
2. Paste the Dropbox app key supplied by the Replift app owner.
3. Tap Connect Dropbox and authorize Replift on Dropbox's website.
4. On the first sync, choose **Upload this device** if no backup exists. If a backup already exists, choose **Restore from Dropbox** to use that data or **Upload this device (overwrite)** only if you intentionally want to replace the cloud copy.
5. On a second device, deploy/open the same Replift URL, connect the same Dropbox account, then choose **Restore from Dropbox** if this device has no copy yet.

## Sync and safety behavior

- Data is kept locally for offline use and uploaded to the user's Dropbox app folder.
- Once initialized, local changes schedule an automatic upload after a short debounce.
- The client checks Dropbox's file revision before writing. If another device has changed the file, it stops instead of silently overwriting; the user must choose restore or explicit overwrite.
- This is revision-checked file sync, not a CRDT or automatic field-level merge. Avoid editing the same account on multiple devices while offline at the same time.
- OAuth tokens remain in this browser's local app storage and are not included in the uploaded workout file. Anyone with access to the browser profile may still be able to access its stored app data; use device security.
- The data file is not end-to-end encrypted in this demo. Dropbox account security protects it in transit and at rest, but Dropbox is not blind to the file contents. Do not describe this build as E2EE.
- A Dropbox app key and a registered redirect URL are required. The ZIP cannot complete real OAuth until the app owner creates/configures the Dropbox app.

## Before public launch

Test OAuth on iOS Safari, Android Chrome, desktop Chrome/Firefox, standalone PWA launch, token refresh, revoked access, empty Dropbox, existing backup, conflicting revisions, offline edits, and restore after browser data loss. Consider adding client-side encryption, import/export validation, and more granular merge/conflict UI before promising seamless multi-device sync.

### Recommended: configure the app key once for all users

After creating your Dropbox app, open `index.html` and find `const DBX_APP_KEY=''` inside the Dropbox sync section. Put your app's **App key** between the quotes, for example `const DBX_APP_KEY='your-public-app-key'`, then redeploy. This is a public client ID, not the app secret. With it configured, users only tap **Connect Dropbox** and sign in to their own account; they do not need to type the key themselves. The settings input is only shown as a fallback when the app owner has not preconfigured a key.
