export const githubFeedback = 'https://github.com/byshriv/Replift/issues/new';
export function feedbackUrl(reason: string, note: string) {
  const params = new URLSearchParams({
    title: `Feedback: ${reason || 'Replift'}`,
    body: `Reason: ${reason}\n\n${note.slice(0, 4000)}\n\nPlease exclude private workout data, backups and credentials.`,
  });
  return `${githubFeedback}?${params}`;
}
export function publicLink(value: unknown): string | null {
  if (typeof value !== 'string' || !value.trim()) return null;
  try {
    const url = new URL(value);
    return url.protocol === 'https:' && !url.username && !url.password
      ? url.href
      : null;
  } catch {
    return null;
  }
}
export const optionalLinks = [
  ['WhatsApp community', import.meta.env.VITE_LINK_WHATSAPP],
  ['X', import.meta.env.VITE_LINK_X],
  ['Instagram', import.meta.env.VITE_LINK_INSTAGRAM],
  ['Strava', import.meta.env.VITE_LINK_STRAVA],
  ['Donate', import.meta.env.VITE_LINK_DONATE],
  ['Dropbox help video', import.meta.env.VITE_LINK_DROPBOX_VIDEO],
  ['Shriv Privacy Policy', import.meta.env.VITE_LINK_PRIVACY],
].map(([label, value]) => ({ label: String(label), url: publicLink(value) }));
