# Security

Send vulnerability details privately to support@shriv.work. Include the affected commit, synthetic reproduction steps and impact; never include tokens, personal backups or real photos. Public issues are for non-sensitive reports.

The Phase 1 preview has no storage migration, OAuth, remote sync or service worker. The archived baseline is historical code with known data/sync defects, not the new production implementation. Keep it on a dedicated disposable localhost origin. Do not test it with real Dropbox data.

All VITE variables are public. Dropbox's app key is public configuration; access/refresh tokens, app secrets and signing keys must never enter source, exports, fixtures, issue URLs or CI logs. There is no Replift backend or analytics. E2EE is excluded from current scope.
