import { nativeShare } from './native-files';

export function wrapText(
  text: string,
  measure: (text: string) => number,
  width: number,
) {
  const lines: string[] = [];
  let line = '';
  for (const character of text) {
    if (character === '\n' || (line && measure(line + character) > width)) {
      lines.push(line.trimEnd());
      line = '';
    }
    if (character !== '\n') line += character;
  }
  if (line) lines.push(line.trimEnd());
  return lines;
}
export async function cardFiles(title: string, lines: string[]) {
  await document.fonts.ready;
  const canvas = document.createElement('canvas');
  canvas.width = 1080;
  canvas.height = 1350;
  const ctx = canvas.getContext('2d');
  if (!ctx) throw new Error('Image sharing unavailable.');
  ctx.font = '800 52px "Rethink Sans", sans-serif';
  const heading = wrapText(title, (s) => ctx.measureText(s).width, 930);
  ctx.font = '500 38px "Rethink Sans", sans-serif';
  // Keep the full title in the body when it cannot fit the two-line header.
  const wrapped = [...(heading.length > 2 ? [title] : []), ...lines].flatMap(
    (line) => wrapText(line, (s) => ctx.measureText(s).width, 930),
  );
  const pages = Math.max(1, Math.ceil(wrapped.length / 13));
  const files: File[] = [];
  for (let page = 0; page < pages; page++) {
    ctx.fillStyle = '#121010';
    ctx.fillRect(0, 0, 1080, 1350);
    ctx.fillStyle = '#c4bca8';
    ctx.font = '700 30px "Rethink Sans", sans-serif';
    ctx.fillText('REPLIFT · LOG AFTER YOUR SETS', 70, 90);
    ctx.fillStyle = '#f7f5e4';
    ctx.font = '800 52px "Rethink Sans", sans-serif';
    heading
      .slice(0, 2)
      .forEach((line, i) => ctx.fillText(line, 70, 200 + i * 65));
    ctx.font = '500 38px "Rethink Sans", sans-serif';
    wrapped
      .slice(page * 13, (page + 1) * 13)
      .forEach((line, i) => ctx.fillText(line, 70, 370 + i * 60));
    ctx.fillStyle = '#c4bca8';
    ctx.font = '500 28px "Rethink Sans", sans-serif';
    ctx.fillText(`${page + 1} / ${pages}`, 70, 1280);
    const blob = await new Promise<Blob>((resolve, reject) =>
      canvas.toBlob(
        (b) =>
          b ? resolve(b) : reject(new Error('Could not create share image.')),
        'image/png',
      ),
    );
    files.push(
      new File(
        [blob],
        pages === 1 ? 'replift-card.png' : `replift-card-${page + 1}.png`,
        { type: 'image/png' },
      ),
    );
  }
  return files;
}
export function downloadImage(file: File) {
  const url = URL.createObjectURL(file),
    a = document.createElement('a');
  a.href = url;
  a.download = file.name;
  a.click();
  setTimeout(() => URL.revokeObjectURL(url), 10000);
}
export async function shareImages(files: File[], title: string) {
  const native = await nativeShare(files, title);
  if (native !== null) return native;
  try {
    if (navigator.share && navigator.canShare?.({ files })) {
      await navigator.share({ files, title });
      return 'Shared.';
    }
  } catch (error) {
    if (error instanceof Error && error.name === 'AbortError')
      return 'Sharing cancelled.';
    // Unsupported/policy-blocked native sharing still permits a local download.
  }
  files.forEach(downloadImage);
  return files.length === 1
    ? 'PNG downloaded.'
    : `${files.length} PNGs downloaded. Your browser may ask to allow multiple downloads.`;
}
