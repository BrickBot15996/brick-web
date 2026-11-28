/** Shown while the session loads, while redirecting to auth, and when there is nothing to show yet. */
export function Boot({ children }: { children?: React.ReactNode }) {
  return (
    <div className="boot" role="status">
      <span className="mark boot__mark" style={{ '--logomark': 'url(/preview/brand/logo.svg)' } as React.CSSProperties} aria-hidden="true" />
      <p className="boot__text">{children ?? 'Loading…'}</p>
    </div>
  );
}
