import { useRouterState } from '@tanstack/react-router';
import type { CSSProperties, ReactNode } from 'react';
import { cdn } from '../lib/cdn';
import { auth } from '../lib/auth';

const WEBSITE = import.meta.env.VITE_WEBSITE_URL;
const brand = { '--logomark': `url(${cdn('brand/logo.svg')})`, '--wordmark': `url(${cdn('brand/wordmark.svg')})` } as CSSProperties;

/** Floodlit Split: the team at Worlds on the left, the desk with the current step on the right. */
export function Shell({ children }: { children: ReactNode }) {
  // The invite-only note is for people without an account; the signed-in launcher doesn't need it.
  const signedIn = useRouterState({ select: (s) => s.location.pathname }).startsWith('/apps');
  return (
    <div className="split" style={brand}>
      <aside className="arena" aria-label="BrickBot">
        <div className="arena__photo">
          <img
            src={cdn('gallery/decode/worlds-practice-field.webp')}
            alt="BrickBot members around their robot on a practice field at the 2026 FIRST Championship"
            fetchPriority="high"
          />
          <a className="arena__mark mark" href={WEBSITE} aria-label="BrickBot website" />
          <div className="arena__cap">
            <span className="arena__word word" role="img" aria-label="BrickBot" />
            <p className="arena__line">
              Team access, <em>members only.</em>
            </p>
          </div>
        </div>
      </aside>
      <main className="desk">
        <div className="desk__main">{children}</div>
        <div className="desk__foot">
          {!signedIn && <p>No account? Accounts are invite-only. Ask a team admin.</p>}
          {auth.preview && (
            <p className="preview-note">
              <b>Preview, no real accounts.</b> Password “wrong” fails, an email with “limit” is rate-limited, code 000000 is wrong and
              111111 expired. Links: <a href="/reset?token=demo">reset</a>, <a href="/invite?token=demo">invite</a>,{' '}
              <a href="/invite?token=expired">expired invite</a>.
            </p>
          )}
        </div>
      </main>
    </div>
  );
}
