# Contributing

Use Node 24 and `npm ci`. Work on a branch and open a PR. Run `npm run check`, install Playwright browsers (`npx playwright install chromium webkit`), then `npm run test:browser`. Keep ESLint 9 and TypeScript 5.9 until an upgrade is agreed. CI uses standard free Linux runners.

Read AGENTS, PROJECT-CONTEXT's latest decisions, STATUS and ROADMAP first. Preserve `reference/` byte-for-byte. Never use the non-Dropbox demo. Domain rules belong in `src/domain`; data adapters must not silently reset invalid user content. Add behavior tests for functional work and document manual acceptance checks. Synthetic fixtures only.

Use PR checks and Squash and merge after review. Phase 1 must not be deployed to the live origin. Deployment, schema cutover and merging are separate authorizations. See `docs/repository-workflow.md` for protection setup and `docs/feature-inventory.md` for parity acceptance checks.
