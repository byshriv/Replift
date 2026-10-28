# Replift

Free, open-source, local-first workout logger. Copyright Shriv.

Phase 3 optional Dropbox preview. **Not a replacement for the live logger.**
IndexedDB migration, autosaved routine editing, optional Dropbox sync, conflict
review and complete backup/restore are available. Legacy `replift.v1` and the old
cloud file are retained. Workout logging, full feature parity and production PWA
behavior remain later work. No deployment is configured.

## Run locally

Use Node 24 (pinned in `.node-version`):

```sh
npm ci
npm run dev
```

Open the printed localhost URL. Workout contains programs and inline routine defaults;
Library contains the preserved 420-exercise catalogue. A date/storage/profile top bar
appears on every main tab. Use synthetic data first; the preview has separate storage
from the live origin. See [local storage and recovery](docs/local-storage.md) before
testing migration with copies. Fonts ship locally. No accounts, analytics or Replift backend.

Settings → Connect Dropbox uses redirect PKCE, then an account/content preview.
Close old clients before approving legacy migration. Register the **exact** preview
redirect and required scopes before disposable live testing. See the
[sync and recovery protocol](docs/sync-protocol.md) for the format, account-change
rules, photo queue, backup/restore procedure and 32 MiB import/transfer limit.
Automated provider tests do not establish live Dropbox or real-phone behavior.

The sole baseline is preserved byte-for-byte under `reference/Replift-PWA`.
Run `npm run baseline:verify` to verify the 10 SHA-256 entries. Run `npm run reference`
to inspect it separately at `http://127.0.0.1:4174` with disposable data. The reference
is excluded from the preview build; do not test its Dropbox client with real data.
The other demo is neither included nor used.

## Checks and artifacts

```sh
npm run check
npx playwright install chromium webkit
npm run test:browser
npm run artifacts
```

`check` runs baseline integrity, lint, formatting, strict types, unit/integration tests,
three seeded 5,000-action navigation runs, three seeded 400-action persistence runs,
three seeded 300-action multi-device sync runs
and build. Browser checks use the production build
on desktop/mobile Chromium and mobile WebKit emulation. Run `npm run build` before
browser checks/artifacts. ZIPs in `artifacts/` contain source at committed HEAD and
the preview static build, plus SHA-256 sums. Do not deploy this preview to production.

Read [STATUS](STATUS.md) for actual evidence and limitations,
[feature inventory](docs/feature-inventory.md) for source/acceptance mapping,
[architecture](docs/architecture.md), [hosting plan](docs/deployment.md),
[repository workflow](docs/repository-workflow.md) and [CONTRIBUTING](CONTRIBUTING.md).
See PROJECT-CONTEXT's latest decisions before historical specifications.

Feedback: [GitHub issues](https://github.com/byshriv/Replift/issues/new/choose).
Issues are public: exclude personal data, backups, photos and credentials.
Private security reports: support@shriv.work. Broader policy: https://shriv.work/privacy.
