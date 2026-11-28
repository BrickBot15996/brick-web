import { useEffect, useState, type FormEvent } from 'react';
import { Link, useSearch } from '@tanstack/react-router';
import { useMutation } from '@tanstack/react-query';
import { auth, errorCode, RESEND_AFTER } from '../lib/auth';
import { emailProblem, usePausedCheck } from '../lib/check';
import { Heading, Notice, Submit, TextField } from '../components/form';
import { Arrow } from '../components/icons';

export function Forgot() {
  const search = useSearch({ strict: false }) as { email?: string };
  const [email, setEmail] = useState(search.email ?? '');
  const [wait, setWait] = useState(0);
  const emailCheck = usePausedCheck(email, emailProblem);
  const send = useMutation({ mutationFn: () => auth.requestReset(email.trim()), onSuccess: () => setWait(RESEND_AFTER) });
  const err = send.isError ? errorCode(send.error) : null;

  useEffect(() => {
    if (wait <= 0) return;
    const t = setTimeout(() => setWait((w) => w - 1), 1000);
    return () => clearTimeout(t);
  }, [wait]);

  function submit(e: FormEvent<HTMLFormElement>) {
    e.preventDefault();
    emailCheck.reveal(true);
    if (!emailCheck.ok) { (e.currentTarget.elements.namedItem('email') as HTMLInputElement | null)?.focus(); return; }
    if (!send.isPending) send.mutate();
  }

  const back = <Link className="back back--left" to="/"><Arrow back />Back to sign in</Link>;

  if (send.isSuccess) {
    return (
      <div className="step" key="sent">
        {/* the same answer whether or not the email belongs to a member */}
        <Heading title="Check your email">
          If <strong>{email.trim()}</strong> belongs to a member, a link to set a new password is on its way. It works once, for 1 hour.
        </Heading>
        <div className="form">
          <div className="row">
            <span className="fine">{wait > 0 ? `Didn’t get it? Send again in 0:${String(wait).padStart(2, '0')}` : 'Didn’t get it? Check spam, or'}</span>
            {wait <= 0 && <button type="button" className="link" onClick={() => send.mutate()}>Send it again</button>}
          </div>
          <p>{back}</p>
        </div>
      </div>
    );
  }

  return (
    <div className="step">
      <Heading title="Forgot password">Enter your email and we’ll send you a link to set a new password.</Heading>
      <form className="form" onSubmit={submit} noValidate>
        {err === 'rate-limited' && <Notice>Too many requests. Wait a minute, then try again.</Notice>}
        {err === 'network' && <Notice>Can’t reach the server. Check your connection and try again.</Notice>}
        <TextField label="Email" type="email" name="email" autoComplete="username" inputMode="email" required autoFocus
          value={email} onChange={(e) => setEmail(e.target.value)} onBlur={() => emailCheck.reveal()} error={emailCheck.error} />
        <Submit busy={send.isPending} busyLabel="Sending">Send reset link</Submit>
        <p>{back}</p>
      </form>
    </div>
  );
}
