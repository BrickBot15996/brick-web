/** Shown while a module's code loads the first time it is visited. Quiet: a few skeleton bars where the page will be. */
export function RouteLoading() {
  return (
    <div className="rl" role="status" aria-live="polite">
      <span className="sr-only">Loading…</span>
      <div className="rl__bars" aria-hidden="true">
        {[0, 1, 2, 3].map((i) => <div key={i} className="skeleton" style={{ height: i === 0 ? 48 : 64, width: i === 0 ? '38%' : '100%', opacity: 1 - i * 0.2 }} />)}
      </div>
    </div>
  );
}
