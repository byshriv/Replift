import { createServer } from 'node:http';
import { readFile } from 'node:fs/promises';
import { resolve, extname, sep } from 'node:path';
import { fileURLToPath } from 'node:url';
const root = fileURLToPath(
  new URL('../reference/Replift-PWA/', import.meta.url),
);
const types = {
  '.html': 'text/html',
  '.js': 'text/javascript',
  '.png': 'image/png',
  '.webmanifest': 'application/manifest+json',
};
// Dedicated localhost origin: never share reference storage or worker scope with the preview.
createServer(async (request, response) => {
  try {
    const pathname = decodeURIComponent(
      new URL(request.url, 'http://localhost').pathname,
    );
    const file = resolve(
      root,
      '.' + (pathname === '/' ? '/index.html' : pathname),
    );
    if (!file.startsWith(root.endsWith(sep) ? root : root + sep))
      throw new Error('Outside reference');
    response.setHeader(
      'Content-Type',
      types[extname(file)] || 'application/octet-stream',
    );
    response.setHeader('Cache-Control', 'no-store');
    response.end(await readFile(file));
  } catch {
    response.writeHead(404).end('Not found');
  }
}).listen(4174, '127.0.0.1', () =>
  console.log(
    'Reference only: http://127.0.0.1:4174 — disposable data; Dropbox not verified.',
  ),
);
