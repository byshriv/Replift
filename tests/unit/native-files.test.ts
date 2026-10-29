import { afterEach, expect, it, vi } from 'vitest';
import { Capacitor } from '@capacitor/core';
import { nativeShare } from '../../src/platform/native-files';

const mocks = vi.hoisted(() => ({
  mkdir: vi.fn(),
  stat: vi.fn(),
  readdir: vi.fn(),
  writeFile: vi.fn(),
  deleteFile: vi.fn(),
  share: vi.fn(),
}));
vi.mock('@capacitor/filesystem', () => ({
  Filesystem: mocks,
  Directory: { Cache: 'CACHE' },
}));
vi.mock('@capacitor/share', () => ({ Share: { share: mocks.share } }));
afterEach(() => {
  vi.restoreAllMocks();
  vi.unstubAllGlobals();
  vi.resetAllMocks();
});
function setup() {
  vi.spyOn(Capacitor, 'getPlatform').mockReturnValue('android');
  mocks.mkdir.mockRejectedValue(new Error('Already exists'));
  mocks.stat.mockResolvedValue({ type: 'directory' });
  mocks.readdir.mockResolvedValue({
    files: [
      { name: 'old.png', mtime: Date.now() - 90000000 },
      { name: 'current.png', mtime: Date.now() },
    ],
  });
  mocks.writeFile.mockImplementation(async (options: { path: string }) => ({
    uri: `file:///cache/${options.path}`,
  }));
  mocks.share.mockResolvedValue({});
  vi.stubGlobal(
    'FileReader',
    class {
      result = 'data:image/png;base64,AQ==';
      onload = () => {};
      readAsDataURL() {
        this.onload();
      }
    },
  );
}
it('shares multiple native PNGs, tolerates existing folder and cleans only old app share files', async () => {
  setup();
  const result = await nativeShare(
    [new File(['1'], 'one.png'), new File(['2'], 'two.png')],
    'Workout',
  );
  expect(result).toContain('Shared');
  expect(mocks.deleteFile).toHaveBeenCalledExactlyOnceWith({
    path: 'replift-share/old.png',
    directory: 'CACHE',
  });
  expect(mocks.writeFile).toHaveBeenCalledTimes(2);
  const options = mocks.share.mock.calls[0]![0] as { files: string[] };
  expect(options.files).toHaveLength(2);
  expect(
    options.files.every((v) => v.startsWith('file:///cache/replift-share/')),
  ).toBe(true);
});
it('retains originals and reports chooser cancellation without starting a download', async () => {
  setup();
  mocks.share.mockRejectedValue(new Error('Share canceled'));
  expect(await nativeShare([new File(['1'], 'backup.json')], 'Backup')).toBe(
    'Sharing cancelled.',
  );
  expect(mocks.deleteFile).toHaveBeenCalledTimes(1); // Only the expired cache file.
});
it('fails visibly before opening the chooser when writing cache fails', async () => {
  setup();
  mocks.writeFile.mockRejectedValue(new Error('Storage full'));
  await expect(
    nativeShare([new File(['1'], 'backup.json')], 'Backup'),
  ).rejects.toThrow('Storage full');
  expect(mocks.share).not.toHaveBeenCalled();
});
it('leaves web sharing to its existing browser implementation', async () => {
  vi.spyOn(Capacitor, 'getPlatform').mockReturnValue('web');
  expect(await nativeShare([], 'Web')).toBeNull();
  expect(mocks.mkdir).not.toHaveBeenCalled();
});
