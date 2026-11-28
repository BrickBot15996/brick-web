import { useEffect, useState } from 'react';
import { useNavigate } from '@tanstack/react-router';
import { auth } from '../lib/auth';
import { readFlow, clearFlow } from '../lib/flow';
import { hostOf, safeRedirect } from '../lib/redirect';
import { Heading } from '../components/form';
import { Arrow } from '../components/icons';

/** The moment between a good sign-in and the app: the strip says so, then we leave. */
export function Done() {
  const navigate = useNavigate();
  const [redirect] = useState(() => readFlow()?.redirect); // read once: the flow is cleared below
  const target = redirect ? safeRedirect(redirect) : null; // no ?redirect= means the app launcher

  useEffect(() => {
    clearFlow();
    if (auth.preview) return; // no real session in preview, so stay here
    const t = setTimeout(() => (target ? window.location.assign(target) : navigate({ to: '/apps' })), 900);
    return () => clearTimeout(t);
  }, [target, navigate]);

  return (
    <div className="step">
      <Heading title="You’re in">{target ? <>Taking you to <strong>{hostOf(target)}</strong>…</> : 'Opening your apps…'}</Heading>
      <div className="form">
        <a className="btn btn--primary" href={target ?? '/apps'}>Continue<Arrow /></a>
        {auth.preview && <p className="fine">Preview: no real session was created, so nothing opens on its own.</p>}
      </div>
    </div>
  );
}
