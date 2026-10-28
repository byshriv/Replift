# v1.0.0 owner feedback log

Updated: 2026-10-28. Phase 7 is planned; owner review and sign-off are pending. No individual feedback items have been dictated in this planning request.

Use this log now and throughout development, then complete the dedicated Phase 7 review before Phase 8 release. The owner can describe issues in plain language or dictate them in batches; the agent records and clarifies them. Do not require the owner to fill out a technical form or file a GitHub issue. Link GitHub issues/PRs when they exist; do not create or publish them without authorization.

## Item record

For each real item, assign `V1-001`, `V1-002`, etc. and record:

- Owner's wording and category: error/bug, UI, UX, demo parity or requested addition.
- Affected screen/flow, observed result, reproduction steps where relevant, and preview build/revision/device/browser if known.
- Expected behaviour and, for parity issues, reference to `Old Replift Deployment/Replift-PWA` or an existing inventory item. Do not use the non-Dropbox demo.
- Priority/release impact, agreed v1.0.0 scope, acceptance check and any question awaiting an answer. New features and architecture changes remain proposals until agreed.
- Status: captured → needs clarification/agreed → in progress → ready for owner review → accepted. Use deferred only with the owner's explicit decision, reason, target and release impact recorded. Reopen items when verification or owner review finds a problem.
- Implementation revision/PR, actual automated/manual verification evidence, unresolved limitations and owner acceptance/date. Do not equate passing automated checks with owner acceptance.

Do not put credentials, private workout records, personal backups or identifying screenshots in this log. Use synthetic examples.

## Recorded items

None yet. Planning this phase does not claim any bug is fixed or any screen matches the demo.

## Phase 7 completion and release handoff

- [ ] Owner has finished dictating and reviewing the intended v1.0.0 changes.
- [ ] Each accepted v1.0.0 item is verified and accepted, or explicitly deferred by the owner with reason and release impact recorded.
- [ ] No data-loss or other release blockers remain; outstanding limitations are visible.
- [ ] Reviewed preview revision and verification evidence are recorded.
- [ ] Owner explicitly confirms Phase 7 completion (date and reviewed revision pending).

Phase 8 must still satisfy every LAUNCH-PLAN gate and obtain final production cutover authorization. Findings during beta or rehearsal reopen affected items and require renewed owner acceptance before deployment.
