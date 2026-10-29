import {
  readFile,
  realpath,
  copyFile,
  mkdir,
  writeFile,
} from 'node:fs/promises';
import { resolve, relative, isAbsolute, join } from 'node:path';
import { spawnSync } from 'node:child_process';
import { createHash } from 'node:crypto';

const root = await realpath('.');
function outside(path) {
  const rel = relative(root, path);
  return rel.startsWith('..') || isAbsolute(rel);
}
const configPath = process.env.REPLIFT_SIGNING_CONFIG;
if (!configPath || !outside(await realpath(configPath)))
  throw new Error(
    'Set REPLIFT_SIGNING_CONFIG to an existing JSON file outside the repository.',
  );
const config = JSON.parse(await readFile(configPath, 'utf8'));
if (!isAbsolute(config.keystore) || !outside(await realpath(config.keystore)))
  throw new Error(
    'Signing key must be an absolute path outside the repository.',
  );
for (const key of ['storePassword', 'alias', 'keyPassword'])
  if (typeof config[key] !== 'string' || !config[key])
    throw new Error(`Missing signing field: ${key}`);
const code = process.env.REPLIFT_VERSION_CODE ?? '1';
if (!/^[1-9]\d*$/.test(code) || Number(code) > 2100000000)
  throw new Error(
    'REPLIFT_VERSION_CODE must be a positive Android version code.',
  );
const command = process.platform === 'win32' ? 'cmd.exe' : './gradlew';
const args =
  process.platform === 'win32'
    ? ['/d', '/c', 'gradlew.bat', '--no-daemon', 'assembleRelease']
    : ['--no-daemon', 'assembleRelease'];
const result = spawnSync(command, args, {
  cwd: resolve('android'),
  stdio: 'inherit',
  env: {
    ...process.env,
    REPLIFT_VERSION_CODE: code,
    REPLIFT_KEYSTORE: config.keystore,
    REPLIFT_STORE_PASSWORD: config.storePassword,
    REPLIFT_KEY_ALIAS: config.alias,
    REPLIFT_KEY_PASSWORD: config.keyPassword,
  },
});
if (result.error || result.status !== 0)
  throw new Error('Android release build failed.');
const apk = resolve('android/app/build/outputs/apk/release/app-release.apk');
const destination = resolve('artifacts', `replift-phase6-${code}.apk`);
await mkdir(resolve('artifacts'), { recursive: true });
await copyFile(apk, destination);
const hash = createHash('sha256')
  .update(await readFile(destination))
  .digest('hex');
await writeFile(
  join(resolve('artifacts'), `replift-phase6-${code}.apk.sha256`),
  `${hash}  replift-phase6-${code}.apk\n`,
);
console.log(`Signed APK: ${destination}\nSHA-256: ${hash}`);
