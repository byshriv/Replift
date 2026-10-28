# Third-party sources

Phase 5 adds no dependencies. PWA icons are unchanged copies from the sole original deployment. Rethink Sans stays bundled locally with the same licence; Latin font files and OS fallback replace the broader font imports. Lucide remains the icon system. Final artwork/legal approval is a release gate.

Phase 2 adds `fake-indexeddb` (Apache-2.0) as a test-only dependency. No new runtime dependencies or major ESLint/TypeScript upgrades.

The only application baseline is the owner's `Old Replift Deployment/Replift-PWA`, copied unchanged under `reference/Replift-PWA`. Its README contains historical statements contradicted by its current code (for example, the public Dropbox key is present); current source plus the inventory takes precedence. The new exercise catalogue is derived exclusively from the baseline's `LIB` tuples and original slug function.

New dependencies: React (MIT), Vite (MIT), TypeScript (Apache-2.0), ESLint (MIT), typescript-eslint (MIT), Vitest (MIT), Playwright (Apache-2.0), Zustand (MIT), Zod (MIT), Lucide (ISC), Prettier (MIT), fflate (MIT). Rethink Sans is packaged by Fontsource under SIL OFL-1.1; its package licence is retained in dependencies. Lockfile captures installed versions. No code from AGPL Liftosaur or Sailor Logbook is copied. Dependencies retain their own licences; MIT/Shriv covers the project code.
