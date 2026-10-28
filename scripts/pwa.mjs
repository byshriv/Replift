import { createHash } from 'node:crypto';
import { readFile, readdir, writeFile } from 'node:fs/promises';
import { resolve, relative } from 'node:path';

// Precache only build outputs: never runtime responses, OAuth or user content.
export async function buildWorker(folder) {
  const files = [];
  async function visit(dir) {
    for (const item of await readdir(dir, { withFileTypes: true })) {
      const path = resolve(dir, item.name);
      if (item.isDirectory()) await visit(path);
      else if (!['_headers', 'sw.js'].includes(item.name)) files.push(path);
    }
  }
  await visit(folder);
  files.sort();
  const hash = createHash('sha256');
  for (const path of files) {
    hash.update(relative(folder, path));
    hash.update(await readFile(path));
  }
  const assets = files.map(
    (path) => '/' + relative(folder, path).replaceAll('\\', '/'),
  );
  const template = await readFile(
    new URL('./worker-template.js', import.meta.url),
    'utf8',
  );
  await writeFile(
    resolve(folder, 'sw.js'),
    template
      .replace('__VERSION__', hash.digest('hex').slice(0, 20))
      .replace('__ASSETS__', JSON.stringify(assets)),
  );
}

await buildWorker(resolve('dist'));
