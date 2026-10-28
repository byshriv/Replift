# Repository workflow

The repository was empty when rechecked on 2026-10-28. A README-only `main` bootstrap creates the PR base. The full implementation goes on `phase-1-foundation`; no application is merged or deployed by this task.

CI defines `quality` (baseline checksum, lint, formatting, strict types, units, seeded stress, build) and `browser` (desktop/mobile Chromium and mobile WebKit). CodeQL scans new JavaScript/TypeScript, excluding immutable historical reference code. Action SHAs were resolved from official release tags on 2026-10-28; checkout v7.0.1, setup-node v7.1.0 and upload-artifact v7.0.2 use the Node 24 runtime. CodeQL is pinned to the current v4 tag commit, not its unrelated bundle release tag. Dependabot maintains npm and action pins; ESLint/TypeScript major upgrades are excluded.

After check contexts exist, protect `main`: require PR, required `quality`, `browser` and `analyze` checks, resolved conversations, no force-push/deletion, linear history. Allow Squash and merge; disable merge commits/rebase if owner policy requires squash exclusively. Do not require another approving human by default for this solo-maintained repo. Settings evidence and whether protections were actually applied belong in STATUS, not assumed here.

If API access cannot configure protection: GitHub → byshriv/Replift → Settings → Branches → Add branch protection rule → `main` → Require a pull request before merging → Require status checks → select the three contexts after their first run → Require linear history → Do not allow bypassing → Save. Under Settings → General → Pull Requests, retain Allow squash merging. Do not merge until checks are green and the owner reviews the PR.
