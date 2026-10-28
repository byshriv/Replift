# Verification plan

Updated: 2026-10-28. No application checks have run in this session.

## Per-phase delivery

Run lint, formatting check, strict types, relevant unit/integration tests, seeded random-action stress tests and production build. Run meaningful Playwright workflows locally where supported and in GitHub CI. Record exact revision, commands, results, seeds and skipped checks. Do not invent scripts/results before the foundation defines them.

## Domain checks

- Previous-value order, empty/unchanged later-set autofill, exercise-type validation.
- Record exclusions, running best and final recomputation; duplicate/edited historical workouts.
- Required duration/future clamp, routine updates limited to existing weights/reps.
- Units, week boundaries/streaks, calories/recovery constants, templates.
- Estimator golden fixtures for exact formulas and exclusion of estimates/warmups as specified.
- Fourth-workout donation prompt and first-week-workout streak card.

## Data checks

- Legacy migration across all keys; repeated migration is safe.
- Corrupt/truncated/unsupported files preserved; invalid import doesn't mutate live data.
- IndexedDB abort/quota failure, interrupted persistence, multi-tab contention.
- Photo export/import roundtrip, missing blob and failed compression.
- Recovery capture failure aborts replacement; restore itself preserves a recovery point.

## Sync checks

Use fake Dropbox with controllable revisions, delays and errors; separate state for two/three devices. Test clean-device download, offline additions, same-record edits, field coupling, delete/edit, reorder, old backup restore, missing base, old clients, corrupt cloud, interrupted photos, lost responses, edits during upload, refresh/revoke, account switch/disconnect during requests, 409/429/timeouts and pending work after restart.

Invariants: no acknowledged local edit disappears; unresolved alternatives stay recoverable; repeated delivery does not duplicate; deletes don't resurrect; failures keep work pending; safe independent edits converge regardless of sync order; credentials never enter shared/exported payloads.

## Random-action stress

Deterministic seeds; generate valid and invalid user actions plus network events and process restarts. Assert invariants after each step, capture minimal reproductions for failures, and retain fixture seeds. Exercise navigation, routine/set edits, logging/finish, measurements, photos, import/restore and sync. A no-crash loop alone is insufficient.

## Browser/manual checks

- Routine select → Back → reopen; reload during edit; Undo removal.
- Onboarding choose then Continue; all major feature flows from inventory.
- Offline cold launch, service-worker update during a draft, storage separation across origins.
- Small screens/keyboard/safe areas/focus/contrast, swipe sheets/tabs and reduced motion.
- Install, real share sheet, sound/haptics and Android back/exit.
- Real Dropbox two-device/revoke/reconnect test using disposable data first.
- APK install/update same signing key and explicit PWA/APK data transfer.

Mocks/CI are not proof of real-phone or live Dropbox behaviour. Report user-provided manual evidence with device, browser, build and date.
