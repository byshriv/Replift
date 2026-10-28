# Hosting and rollback — no Phase 1 deployment

The user reports production at https://replift.shriv.work uses Cloudflare Pages Direct Upload. This session does not change Pages, DNS, OAuth redirects or production content. Local source equality with the live build is not independently established.

Cloudflare states that Direct Upload projects cannot switch to Git integration later: https://developers.cloudflare.com/pages/get-started/direct-upload/ (checked 2026-10-28). A later Git migration needs a new Git-connected Pages project, a preview deployment and reviewed domain reassignment. See https://developers.cloudflare.com/pages/get-started/git-integration/.

For a later approved preview: build command `npm ci && npm run build`, output `dist`, Node 24. No secrets are required by Phase 1. Preview origins have separate browser storage. Never treat an empty preview as missing production data. Do not point the live domain at this foundation.

Before a future cutover: inspect the actual project/account settings, retain the previous immutable deployment and static assets, export synthetic-test and user-owned backups, rehearse migration/restore and OAuth redirects, confirm domain reassignment/rollback with the owner. After schema changes, static rollback alone may be unsafe; old clients must not overwrite new storage/cloud formats. Preserve the live origin to preserve browser storage. LAUNCH-PLAN remains the release gate.
