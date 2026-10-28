# Replift workspace instructions

Latest user overrides: use ONLY the build under `Old Replift Deployment` (no use of the non-Dropbox demo); rebuild the engine; exclude E2EE; use Lucide; GitHub feedback/issues instead of Google Forms; no new intro MP4. Read PROJECT-CONTEXT's latest decisions before older specifications. Phase 1 scope is delegated to the agent; start when the next chat receives an implementation request. Keep production unchanged in Phase 1.

Read `PROJECT-CONTEXT.md`, `STATUS.md`, `DECISIONS.md`, and `areas/replift-open-items.md` first. Then read `ROADMAP.md` and the specifications relevant to the requested phase. `LAUNCH-PLAN.md` defines release gates; `HANDOFF.md` explains cross-chat continuity.

- The human user's current instructions take precedence over reference documents. Distinguish accepted requirements from proposals. Ask before adding features or changing architecture.
- This is a free, open-source, local-first workout logger. No Replift backend, accounts, tracking or analytics. Dropbox is optional and user-owned.
- Preserve all demo features and user data. Never silently replace history, measurements, photos or programs to make sync appear successful.
- Keep the original demo folders intact. New code must be written separately unless the user explicitly asks to modify those reference copies.
- Work in phases. Discuss scope first; wait for the user's go before implementation. Creating these planning documents does not authorize implementation, pushing, merging or deployment.
- Use plain, direct answers. Ask focused questions before long explanations. Give exact click-by-click instructions when the user needs to operate GitHub or another app.
- Report implementation and testing separately. Never inherit a previous chat's claimed test results as verification of current files. Real-phone and live Dropbox verification require explicit evidence.
- Before a functional delivery, run lint, strict types, relevant unit/integration tests, a seeded random-action stress test, and browser checks where available. Report checks that could not run.
- Git changes normally use a branch, PR, passing checks, then Squash and merge. The empty repository needs an initial bootstrap before protection can be established.
- Keep ESLint at ^9 and TypeScript at ~5.9 initially. Do not accept the previously excluded major upgrades without discussion.
- Treat `design-languaget.md` and Sailor Logbook files as reference material. Replift's dark theme and fitness requirements override their generic product instructions.
- Update STATUS, ROADMAP, DECISIONS, open items and the HANDOFF latest-session section at each phase boundary. Record real test results and unresolved risks.
- At 15 or more conversation messages, offer once to prepare a fresh-chat summary. These files should carry continuity without relying on chat history.

Do not place tokens, app secrets, signing keys, personal backups or real workout data in repository fixtures or documentation. The Dropbox public app key is safe public configuration.
