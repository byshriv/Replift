# Replift

Free, open-source, local-first workout logger. Copyright Shriv.

Phase 1 foundation preview. **Not a replacement for the live logger.** Logging,
IndexedDB migration, Dropbox sync and production PWA behavior are later phases.
The preview never reads or writes existing workout data. No deployment is configured.

## Run locally

Use Node 24 (pinned in `.node-version`):

```sh
npm ci
npm run dev
```

Open the printed localhost URL. Home explains the preview, Library shows the 420
preserved exercises with read-only search, and other tabs state their implementation
status. Fonts ship locally. There are no accounts, analytics or Replift backend.

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

`check` runs baseline integrity, lint, formatting, strict types, unit tests, three
seeded 5,000-action stress runs and build. Browser checks use the production build
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
