import { ExternalLink } from 'lucide-react';
import { optionalLinks } from '../platform/links';
export function PrivacyLink() {
  const link = optionalLinks.find((x) => x.label === 'Shriv Privacy Policy');
  return link?.url ? (
    <a href={link.url} target="_blank" rel="noreferrer">
      Shriv Privacy Policy
    </a>
  ) : (
    <span>Broader Shriv Privacy Policy: URL awaiting owner confirmation.</span>
  );
}
export function DropboxHelp() {
  const link = optionalLinks.find((x) => x.label === 'Dropbox help video');
  return link?.url ? (
    <a href={link.url} target="_blank" rel="noreferrer">
      Watch Dropbox help video
    </a>
  ) : (
    <p>
      Dropbox help video URL not supplied. Use Settings → Dropbox for connection
      details and retry controls.
    </p>
  );
}
export default function Links() {
  return (
    <section className="card" aria-label="Links and support">
      <h2>Links and support</h2>
      <p>
        External links open another service. GitHub issues are public and may
        require a GitHub account. Nothing is submitted automatically.
      </p>
      <p>
        <a
          href="https://github.com/byshriv/Replift"
          target="_blank"
          rel="noreferrer"
        >
          <ExternalLink size={16} aria-hidden="true" /> Source code
        </a>
      </p>
      {optionalLinks.map(({ label, url }) => (
        <p key={label}>
          {url ? (
            <a href={url} target="_blank" rel="noreferrer">
              {label}
            </a>
          ) : (
            `${label}: URL not supplied.`
          )}
        </p>
      ))}
      <p>
        Exercise illustrations are not supplied. Existing user images are
        retained. Installation icons reuse the original deployment artwork;
        final owner approval remains pending.
      </p>
    </section>
  );
}
