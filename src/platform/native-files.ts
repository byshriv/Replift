import { isAndroid } from './android';

// Only app-created temporary share files are exposed through FileProvider.
export async function nativeShare(
  files: File[],
  title: string,
): Promise<string | null> {
  if (!isAndroid()) return null;
  const { Filesystem, Directory } = await import('@capacitor/filesystem');
  const { Share } = await import('@capacitor/share');
  const root = 'replift-share';
  try {
    await Filesystem.mkdir({
      path: root,
      directory: Directory.Cache,
      recursive: true,
    });
  } catch {
    // Android mkdir reports an existing directory as an error. Verify it rather
    // than swallowing permission/storage failures or breaking the second share.
    const existing = await Filesystem.stat({
      path: root,
      directory: Directory.Cache,
    });
    if (existing.type !== 'directory')
      throw new Error('Share folder is unavailable. Saved data is retained.');
  }
  // Keep recipients' URI grants useful after the chooser returns. Remove only our
  // own files older than a day on the next share; never touch database/user files.
  const prior = await Filesystem.readdir({
    path: root,
    directory: Directory.Cache,
  });
  for (const file of prior.files) {
    if (file.mtime && Date.now() - file.mtime > 86_400_000)
      await Filesystem.deleteFile({
        path: `${root}/${file.name}`,
        directory: Directory.Cache,
      });
  }
  const uris: string[] = [];
  for (const file of files) {
    const data = await new Promise<string>((resolve, reject) => {
      const reader = new FileReader();
      reader.onload = () => resolve(String(reader.result).split(',')[1]!);
      reader.onerror = () =>
        reject(new Error('Could not prepare file. Saved data is retained.'));
      reader.readAsDataURL(file);
    });
    const path = `${root}/${crypto.randomUUID()}-${file.name.replace(/[^a-zA-Z0-9._-]/g, '_')}`;
    const result = await Filesystem.writeFile({
      path,
      data,
      directory: Directory.Cache,
    });
    uris.push(result.uri);
  }
  try {
    await Share.share({ title, files: uris, dialogTitle: title });
    return 'Shared. Check the receiving app saved the file.';
  } catch (error) {
    if (error instanceof Error && /cancel/i.test(error.message))
      return 'Sharing cancelled.';
    throw new Error('Could not share. Saved data is retained; try again.');
  }
}
