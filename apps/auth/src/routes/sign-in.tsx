import { useEffect, useState, type FormEvent } from 'react';
import { Link, useNavigate, useSearch } from '@tanstack/react-router';
import { useMutation } from '@tanstack/react-query';
import { auth, errorCode, AuthError } from '../lib/auth';
import { saveFlow } from '../lib/flow';
import { safeRedirect } from '../lib/redirect';
import { emailProblem, usePausedCheck } from '../lib/check';
import { Heading, Notice, PasswordField, Submit, TextField } from '../components/form';

const passwordProblem = (v: string) => (v ? undefined : 'Enter your password.');

export function SignIn() {
  const { redirect } = useSearch({ strict: false }) as { redirect?: string };
  const navigate = useNavigate();
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const emailCheck = usePausedCheck(email, emailProblem);
  const passwordCheck = usePausedCheck(password, passwordProblem);

  // Already signed in and verified (e.g. the CMS sent them here with a stale link): go straight on.
  useEffect(() => {
    let live = true;
    auth.session().then((s) => {
      if (!live || !s) return;
      if (redirect) window.location.assign(safeRedirect(redirect));
      else navigate({ to: '/apps' });
    });
    return () => { live = false; };
  }, [redirect, navigate]);

  const signIn = useMutation({
    mutationFn: () => auth.signIn(email.trim(), password),
    onSuccess: (res) => {
      saveFlow({ email: email.trim(), redirect });
      navigate({ to: res.status === 'signed-in' ? '/done' : '/code' });
    },
  });
  const code = signIn.isError ? errorCode(signIn.error) : null;
  const retry = signIn.error instanceof AuthError ? signIn.error.retryAfter ?? 60 : 60;

  function submit(e: FormEvent<HTMLFormElement>) {
    e.preventDefault();
    emailCheck.reveal(true);
    passwordCheck.reveal(true);
    if (!emailCheck.ok || !passwordCheck.ok) {
      (e.currentTarget.elements.namedItem(emailCheck.ok ? 'password' : 'email') as HTMLInputElement | null)?.focus();
      return;
    }
    if (!signIn.isPending) signIn.mutate();
  }

  return (
    <div className="step">
      <Heading title="Sign in" />
      <form className="form" onSubmit={submit} noValidate>
        {code === 'invalid-credentials' && (
          <Notice>
            That email and password don’t match. Check both, or <Link to="/forgot" search={{ email }}>reset your password</Link>.
          </Notice>
        )}
        {code === 'rate-limited' && <Notice>Too many tries. Wait {retry} seconds, then try again.</Notice>}
        {code === 'network' && <Notice>Can’t reach the server. Check your connection and try again.</Notice>}
        <TextField label="Email" type="email" name="email" autoComplete="username" inputMode="email" required autoFocus
          value={email} onChange={(e) => setEmail(e.target.value)} onBlur={() => emailCheck.reveal()} error={emailCheck.error} />
        <PasswordField label="Password" name="password" autoComplete="current-password" required
          value={password} onChange={(e) => setPassword(e.target.value)} error={passwordCheck.error} />
        <div className="row row--end">
          <Link className="link" to="/forgot" search={{ email: email || undefined }}>Forgot password?</Link>
        </div>
        <Submit busy={signIn.isPending} busyLabel="Signing in">Sign in</Submit>
      </form>
    </div>
  );
}
