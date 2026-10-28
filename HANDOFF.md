# Cross-chat handoff

## Current Phase 1 start prompt

> Start Replift Phase 1. Read AGENTS.md, PROJECT-CONTEXT.md, STATUS.md, DECISIONS.md, ROADMAP.md and areas/replift-open-items.md, prioritizing the latest user decisions. Use only Old Replift Deployment as the baseline. Build the repository foundation in byshriv/Replift with the agreed stack, preserve the baseline, inventory its features, add CI/tests/docs, and prepare a reviewable branch/PR. Keep the live site unchanged. Make routine technical decisions, run available checks, update the handoff files and give exact manual steps only where needed. Proceed with implementation.

This replaces the older planning-only template below for the user's next Phase 1 chat. User has delegated scope; do not repeat resolved questions. Current chat made documentation updates only.

## Start a new phase chat

Use this project folder as the workspace. Paste:

> Work on Replift in this folder. Read AGENTS.md, PROJECT-CONTEXT.md, STATUS.md, DECISIONS.md, areas/replift-open-items.md and ROADMAP.md, then the specs for Phase [number]. Tell me the verified current state, unresolved decisions and exact scope before implementation. Preserve both original demos and all user data. Do not assume historical tests passed on current files. This request is for planning the phase; wait for my go before building.

If already ready to authorize, replace the final sentence with an explicit go for the agreed phase. New chats must check actual repository/files before resuming. Do not create a new repository or rewrite finished phases merely because the chat changed.

## End a phase/chat

Update STATUS with implementation evidence, revision/branch/PR, tests actually run, skipped checks, data/schema changes, deployment state and next action. Update ROADMAP statuses, DECISIONS for user answers and open items. Link generated artifacts by actual path/release URL. Record only completed work as complete; keep blockers visible.

Do not run multiple chats editing the same files/branch simultaneously without an explicit coordination plan. These documents carry context but do not merge conflicting edits.

## Latest session — 2026-10-28 Phase 1 implementation

- User explicitly authorized implementation, branch and PR. Production remains unchanged; no merge.
- Separate checkout `repository/` in parent workspace; baseline only from Old Replift Deployment, copied unchanged with 10 checksums. Non-Dropbox demo not consulted or included.
- React/strict TS/Vite, Lucide, local fonts, transient Zustand shell and Zod catalogue; 420 original slug IDs/order. No user storage migration, sync or worker.
- Added inventory P01–P40, CI/CodeQL/Dependabot, issue template, MIT/docs and ZIP packaging.
- Local lint/format/strict types/build passed; 3 unit + 3 seeded stress tests (15,000 actions) passed; 9 browser tests passed; audit 0 vulnerabilities. See docs/phase-1-verification.md for exact coverage, corrected attempts and untested areas.
- Branch `phase-1-foundation`; main is README-only bootstrap. Final PR/remote check/protection evidence goes in STATUS/verification report. Git credential helper was not authenticated; connector used for publication.
- No live Dropbox/physical phone/install/APK/migration/full parity verification. All future release gates remain open.
- Next: owner reviews foundation PR; Phase 2 rebuilds persistence and routine UX under separate implementation authorization. Preserve legacy data and baseline; never deploy this preview over the live site.
