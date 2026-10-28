import { createHash } from 'node:crypto';
import { readFile, readdir } from 'node:fs/promises';
import { fileURLToPath } from 'node:url';
import { resolve, relative, sep } from 'node:path';
const root = fileURLToPath(new URL('../', import.meta.url));
export async function checksums(folder) {
  const entries = [];
  async function visit(dir) {
    for (const item of await readdir(dir, { withFileTypes: true })) {
      const path = resolve(dir, item.name);
      if (item.isDirectory()) await visit(path);
      else
        entries.push({
          path: relative(folder, path).split(sep).join('/'),
          sha256: createHash('sha256')
            .update(await readFile(path))
            .digest('hex'),
        });
    }
  }
  await visit(folder);
  return entries.sort((a, b) => a.path.localeCompare(b.path, 'en'));
}
const expected = JSON.parse(
  await readFile(resolve(root, 'docs/baseline-checksums.json'), 'utf8'),
);
const actual = await checksums(resolve(root, 'reference/Replift-PWA'));
if (JSON.stringify(actual) !== JSON.stringify(expected))
  throw new Error(
    'Preserved baseline changed. Restore original bytes; do not regenerate checksums to hide changes.',
  );
console.log(`Verified ${actual.length} baseline files (SHA-256).`);
