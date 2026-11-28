// Sending mail through the Resend HTTP API. EMAIL_MODE=log prints the message instead (local development only).
import { HttpError } from './http.ts';

export interface Mail { to: string; subject: string; html: string; text: string; /** Only printed in log mode. */ debug?: string }

export async function sendMail(mail: Mail): Promise<void> {
  if (Deno.env.get('EMAIL_MODE') === 'log') {
    console.log(`[email:log] to=${mail.to} subject="${mail.subject}" ${mail.debug ?? ''}`.trim());
    return;
  }
  const key = Deno.env.get('RESEND_API_KEY');
  if (!key) {
    console.error('RESEND_API_KEY is not set');
    throw new HttpError(502, 'send-failed', 'We couldn’t send the email. Try again in a moment.');
  }
  let res: Response;
  try {
    res = await fetch('https://api.resend.com/emails', {
      method: 'POST',
      headers: { Authorization: `Bearer ${key}`, 'Content-Type': 'application/json' },
      body: JSON.stringify({
        from: Deno.env.get('EMAIL_FROM') || 'BrickBot <noreply@brickbot.ro>',
        to: [mail.to],
        subject: mail.subject,
        html: mail.html,
        text: mail.text,
      }),
    });
  } catch {
    console.error('resend: network error');
    throw new HttpError(502, 'send-failed', 'We couldn’t send the email. Try again in a moment.');
  }
  if (!res.ok) {
    console.error(`resend: HTTP ${res.status}`);
    throw new HttpError(502, 'send-failed', 'We couldn’t send the email. Try again in a moment.');
  }
}

const FONT = "'Anek Latin','Segoe UI',Helvetica,Arial,sans-serif";

/** The sign-in code email. No names: it greets nobody. The logo is text until brand/logo.svg is uploaded to the CDN. */
export function codeMail(to: string, code: string, minutes: number): Mail {
  const spaced = `${code.slice(0, 3)} ${code.slice(3)}`;
  const html = `<!doctype html>
<html lang="en"><head><meta charset="utf-8"><meta name="viewport" content="width=device-width,initial-scale=1">
<meta name="color-scheme" content="dark"><meta name="supported-color-schemes" content="dark">
<title>Your BrickBot sign-in code</title></head>
<body style="margin:0;padding:0;background:#000000;">
<table role="presentation" width="100%" cellpadding="0" cellspacing="0" bgcolor="#000000" style="background:#000000;"><tr><td align="center" style="padding:32px 16px;">
<table role="presentation" width="100%" cellpadding="0" cellspacing="0" style="max-width:480px;">
<tr><td style="font-family:${FONT};font-size:14px;font-weight:800;letter-spacing:0.28em;color:#FFEC17;padding-bottom:28px;">BRICKBOT</td></tr>
<tr><td style="font-family:${FONT};font-size:26px;line-height:1.1;font-weight:800;color:#f4f1e8;padding-bottom:12px;">Your sign-in code</td></tr>
<tr><td style="font-family:${FONT};font-size:16px;line-height:1.5;color:#bdb9ad;padding-bottom:20px;">Type this code on the sign-in page to finish signing in.</td></tr>
<tr><td style="background:#121210;border:1px solid #3a3933;border-radius:8px;padding:20px 24px;font-family:${FONT};font-size:36px;line-height:1;font-weight:800;letter-spacing:0.18em;color:#FFEC17;" align="center">${spaced}</td></tr>
<tr><td style="font-family:${FONT};font-size:14px;line-height:1.5;color:#8e8b81;padding-top:20px;">The code works for ${minutes} minutes. If you didn’t try to sign in, ignore this email and your account stays safe. Never share this code with anyone.</td></tr>
</table></td></tr></table></body></html>`;
  const text = `Your BrickBot sign-in code: ${spaced}\n\nType it on the sign-in page. It works for ${minutes} minutes.\nIf you didn't try to sign in, ignore this email. Never share this code with anyone.\n`;
  return { to, subject: 'Your BrickBot sign-in code', html, text, debug: `code=${code}` };
}
