# Launch plan and release gates

## Mandatory owner review gate — v1.0.0

Before any v1.0.0 production deployment, complete ROADMAP Phase 7 and record the owner's explicit completion confirmation and reviewed revision in `areas/v1-owner-feedback.md`. Every accepted v1.0.0 feedback item must have verification evidence and owner acceptance, or an explicit owner-approved deferral with reason and release impact recorded. No unresolved data-loss or other release blockers may remain. Feedback includes previously unreported bugs, UI/UX corrections, requested additions and parity with only Old Replift Deployment.

Phase 8 performs beta, migration rehearsal and release. New findings reopen affected review items and require renewed acceptance before cutover. Phase 7 acceptance supplements all gates below and does not authorize deployment. GitHub feedback/issues remain the approved feedback integration; older Forms references are superseded.

Updated: 2026-10-28. All gates pending. This file is a release checklist, not evidence of completion.

## Gate 1 — scope and parity

- Every demo feature inventoried and mapped to implementation plus verification.
- Approved demo changes included; additional requests triaged with owner.
- Design tokens, exercise serials and app ID preserved.
- Placeholders identified; no hidden promise of unimplemented Healthify or encryption.

## Gate 2 — local data safety

- Legacy localStorage migration verified on realistic copies; original retained.
- IndexedDB transaction failure, quota failure and damaged data handled visibly.
- Back/reload/app restart preserve drafts and routine edits.
- Portable export includes photos and user content, excludes credentials.
- Import validates before mutation; recovery snapshot failure blocks destructive replacement.
- Restore drill succeeds; damaged data preserved for recovery rather than silently reset.

## Gate 3 — Dropbox

- Redirects/scopes, PKCE, refresh/revoke/reconnect and account switching verified.
- Remote-only discovery and offline retry work.
- Two-device additions, overlapping edits, deletes, stale backups and upload races tested.
- Conflict versions and resolution decisions survive restart/sync.
- Photo transfers recover from interruption without dangling successful state.
- Old clients cannot corrupt upgraded data; migration/cutover documented.
- Production app access reviewed in Dropbox console; do not assume current cap/approval status.
- Real Dropbox evidence separate from mocks.

## Gate 4 — PWA/platform

- Offline cold start after install, update and cache compatibility checked.
- No forced upgrade reload loses active input.
- Fonts/assets offline; safe areas, keyboard and touch controls checked.
- Android/iOS browser installation, sharing and gestures tested where supported.
- APK signed; same-key upgrade and OAuth return tested if APK is included.

## Gate 5 — quality, privacy and owner assets

- Lint/types/unit/integration/stress/build/browser checks pass on release revision.
- Open blockers resolved; limitations recorded.
- No secrets, personal fixtures, analytics or accidental data in logs/repository.
- Dependency/code licence review and attribution complete.
- Forms and external links verified; owner reviews Privacy/Terms.
- Icons, exercise illustrations, animation and required links approved or explicitly deferred.

## Gate 6 — deployment and recovery

- Preserve `https://replift.shriv.work` origin; preview origin has separate local storage.
- Current Cloudflare project mode and rollback method known.
- Rehearse backup, legacy upgrade and restore with copies of data.
- Tag known-good build and retain previous static build.
- Define compatible rollback: old code may not understand upgraded IndexedDB/cloud schemas. Do not assume a static rollback reverses migrations.
- Obtain user release/cutover authorization after a reviewable build and results.
- Publish release assets and beginner instructions; monitor only through user feedback/local diagnostics, no tracking.

## Cost boundary

Use free standard CI, static hosting, optional user Dropbox storage and direct APK distribution. Respect service quotas; no paid backend or required subscription. Domain renewal, Dropbox quota expansion and app-store publication are separate optional/existing costs, not silently promised free.
