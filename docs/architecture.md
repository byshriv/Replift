# Foundation architecture

Phase 1 establishes the agreed React / strict TypeScript / Vite stack. `src/domain/exercise.ts` validates the bundled catalogue through Zod; it is pure and independent of React or storage. `src/data/catalogue.ts` loads the baseline-derived tuples. `src/state/navigation.ts` uses transient Zustand state. `src/App.tsx` is a preview shell with Lucide icons and a read-only library. Fonts are bundled locally through Fontsource.

Future boundaries, not implemented modules: data/persistence owns IndexedDB transactions and migrations; sync/core owns deterministic merges and retained alternatives; sync/dropbox owns OAuth/HTTP/revisions; sync/scheduler owns serialized discovery/retry; features owns vertical UI slices; platform owns PWA/Android behavior. The unavailable engine must be rebuilt, not represented by placeholder implementations. No borrowed Sailor/Liftosaur engine code is included.

The preview never reads `replift.v1`, never registers a worker and never connects to Dropbox. Navigation/search reset at refresh. Catalogue IDs match the original slug identities. Serials 1–420 follow the baseline tuple order; identity changes are forbidden. JSON content is validated and frozen at startup. The CSV/image artwork pipeline is deferred; no illustrative assets or intro MP4 are added.

Only the Vite root `index.html` and imported assets enter `dist`. `reference/` is outside `public` and denied by the dev server; the dedicated reference server uses port 4174. This prevents archived code and its worker from shipping inside the preview build. Domain data is not a production storage schema. No user-data migration or export contract is introduced in Phase 1.
