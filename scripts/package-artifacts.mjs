import { execFileSync } from 'node:child_process';
import { readFile, readdir, mkdir, writeFile } from 'node:fs/promises';
import { resolve, relative, sep } from 'node:path';
import { createHash } from 'node:crypto';
import { zipSync } from 'fflate';
await mkdir('artifacts', { recursive: true });
execFileSync('git', [
  'archive',
  '--format=zip',
  '--output=artifacts/replift-source.zip',
  'HEAD',
]);
const files = {};
async function visit(dir) {
  for (const entry of await readdir(dir, { withFileTypes: true })) {
    const path = resolve(dir, entry.name);
    if (entry.isDirectory()) await visit(path);
    else
      files[relative(resolve('dist'), path).split(sep).join('/')] =
        new Uint8Array(await readFile(path));
  }
}
await visit('dist');
await writeFile('artifacts/replift-preview.zip', zipSync(files));
const hashes = [];
for (const name of ['replift-source.zip', 'replift-preview.zip'])
  hashes.push(
    `${createHash('sha256')
      .update(await readFile('artifacts/' + name))
      .digest('hex')}  ${name}`,
  );
await writeFile('artifacts/SHA256SUMS', hashes.join('\n') + '\n');
console.log(
  'Created source-at-HEAD and preview ZIPs; preview is not a production replacement.',
);
