import { useEffect, useRef, useState, type FormEvent } from 'react';
import { Link, Navigate, useNavigate } from '@tanstack/react-router';
import { useMutation } from '@tanstack/react-query';
import { auth, errorCode, AuthError, CODE_LENGTH, RESEND_AFTER } from '../lib/auth';
import { readFlow, clearFlow, maskEmail } from '../lib/flow';
import { Heading, Notice, Submit } from '../components/form';
import { Arrow } from '../components/icons';

export function Code() {
  const flow = readFlow();
  if (!flow) return <Navigate to="/" />;
  return <CodeStep email={flow.email} />;
}

function CodeStep({ email }: { email: string }) {
  const navigate = useNavigate();
  const [value, setValue] = useState('');
  const [focused, setFocused] = useState(false);
  const [wait, setWait] = useState(RESEND_AFTER);
  const input = useRef<HTMLInputElement>(null);

  useEffect(() => {
    if (wait <= 0) return;
    const t = setTimeout(() => setWait((w) => w - 1), 1000);
    return () => clearTimeout(t);
  }, [wait]);

  const verify = useMutation({
    mutationFn: (code: string) => auth.verifyCode(email, code),
    onSuccess: () => navigate({ to: '/done' }),
    onError: () => { setValue(''); input.current?.focus(); },
  });
  const resend = useMutation({
    mutationFn: () => auth.sendCode(email),
    onSuccess: () => { setWait(RESEND_AFTER); verify.reset(); input.current?.focus(); },
    onError: (e) => { if (e instanceof AuthError && e.code === 'rate-limited') setWait(e.retryAfter ?? RESEND_AFTER); },
  });
  const err = verify.isError ? errorCode(verify.error) : resend.isError ? errorCode(resend.error) : null;


  function change(next: string) {
    const digits = next.replace(/\D/g, '').slice(0, CODE_LENGTH);
    setValue(digits);
    if (verify.isError) verify.reset();
    if (digits.length === CODE_LENGTH && !verify.isPending) verify.mutate(digits);
  }
  function submit(e: FormEvent) {
    e.preventDefault();
    if (value.length === CODE_LENGTH && !verify.isPending) verify.mutate(value);
    else input.current?.focus();
  }

  const active = Math.min(value.length, CODE_LENGTH - 1);
  return (
    <div className="step">
      <Heading title="Check your email">
        We sent a 6-digit code to <strong>{maskEmail(email)}</strong>. It works for 10 minutes.
      </Heading>
      <form className="form" onSubmit={submit}>
        {err === 'wrong-code' && <Notice>That code isn’t right. Check the latest email from BrickBot and try again.</Notice>}
        {err === 'code-expired' && <Notice>That code has expired. Send a new one below.</Notice>}
        {err === 'rate-limited' && <Notice>Too many codes requested. Wait a moment, then send a new one.</Notice>}
        {err === 'session-expired' && <Notice>This sign-in timed out. <Link to="/" onClick={() => clearFlow()}>Start again</Link>.</Notice>}
        {err === 'network' && <Notice>Can’t reach the server. Check your connection and try again.</Notice>}
        {resend.isSuccess && !err && <Notice tone="ok">New code sent. Only the latest one works.</Notice>}
        <div className="field">
          <label className="field__label" htmlFor="code">Code</label>
          <div className="code" data-invalid={err ? '' : undefined}>
            {Array.from({ length: CODE_LENGTH }, (_, i) => (
              <span key={i} className="code__cell" data-on={focused && i === active ? '' : undefined} aria-hidden="true">{value[i] ?? ''}</span>
            ))}
            <input ref={input} id="code" className="code__input" name="code" value={value} autoFocus
              inputMode="numeric" autoComplete="one-time-code" pattern="[0-9]*" maxLength={CODE_LENGTH}
              aria-invalid={err ? true : undefined} aria-describedby="code-hint"
              onChange={(e) => change(e.target.value)} onFocus={() => setFocused(true)} onBlur={() => setFocused(false)} />
          </div>
          <p id="code-hint" className="field__hint">Once it’s right, this browser skips the code for 30 days.</p>
        </div>
        <Submit busy={verify.isPending} busyLabel="Checking">Verify</Submit>
        <div className="row">
          <span className="fine">
            {wait > 0 ? <>Didn’t get it? Send again in 0:{String(wait).padStart(2, '0')}</> : 'Didn’t get it? Check spam, or'}
          </span>
          {wait <= 0 && (
            <button type="button" className="link" disabled={resend.isPending} onClick={() => resend.mutate()}>
              {resend.isPending ? 'Sending…' : 'Send a new code'}
            </button>
          )}
        </div>
      </form>
      <p style={{ marginTop: 32 }}>
        <Link className="back back--left" to="/" onClick={() => clearFlow()}><Arrow back />Use a different account</Link>
      </p>
    </div>
  );
}
