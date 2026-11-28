// CORS, JSON in and out, and one error shape for every function: { error: { code, message, retryAfter? } }.

/** A failure whose message is safe to show to the person using the app. */
export class HttpError extends Error {
  constructor(
    public status: number,
    public code: string,
    message: string,
    public retryAfter?: number,
  ) {
    super(message);
  }
}

const LOCAL_ORIGINS = ['http://127.0.0.1:5173', 'http://127.0.0.1:5174'];

export function allowedOrigins(): string[] {
  const out = [...LOCAL_ORIGINS];
  for (const name of ['CMS_URL', 'AUTH_URL']) {
    const v = Deno.env.get(name)?.trim().replace(/\/+$/, '');
    if (v) out.push(v);
  }
  return out;
}

export function corsHeaders(req: Request): Record<string, string> {
  const origin = req.headers.get('origin');
  const h: Record<string, string> = {
    'Access-Control-Allow-Headers': 'authorization, apikey, content-type, x-client-info',
    'Access-Control-Allow-Methods': 'POST, OPTIONS',
    'Access-Control-Max-Age': '600',
    Vary: 'Origin',
  };
  if (origin && allowedOrigins().includes(origin)) h['Access-Control-Allow-Origin'] = origin;
  return h;
}

export function json(req: Request, body: unknown, status = 200): Response {
  return new Response(JSON.stringify(body), {
    status,
    headers: { ...corsHeaders(req), 'Content-Type': 'application/json', 'Cache-Control': 'no-store' },
  });
}

export const bad = (message: string, code = 'bad-request') => new HttpError(400, code, message);

/** Request body: `{ action, ...args }`. */
export type Body = { action?: unknown; [k: string]: unknown };

/**
 * Wraps a function: answers preflight, accepts POST only, parses the JSON body, and turns thrown HttpErrors into the
 * error shape. Anything else becomes a generic 500 (its detail goes to the log, never to the caller).
 */
export function handle(fn: (req: Request, body: Body) => Promise<unknown>): (req: Request) => Promise<Response> {
  return async (req) => {
    if (req.method === 'OPTIONS') return new Response(null, { status: 204, headers: corsHeaders(req) });
    try {
      if (req.method !== 'POST') throw new HttpError(405, 'method-not-allowed', 'Use POST.');
      let body: Body;
      try {
        const parsed = await req.json();
        if (!parsed || typeof parsed !== 'object' || Array.isArray(parsed)) throw new Error('shape');
        body = parsed as Body;
      } catch {
        throw bad('The request body must be a JSON object.');
      }
      return json(req, (await fn(req, body)) ?? {});
    } catch (e) {
      if (e instanceof HttpError) {
        const error: Record<string, unknown> = { code: e.code, message: e.message };
        if (e.retryAfter !== undefined) error.retryAfter = e.retryAfter;
        return json(req, { error }, e.status);
      }
      console.error('unhandled error:', e instanceof Error ? `${e.name}: ${e.message}` : 'unknown');
      return json(req, { error: { code: 'server-error', message: 'Something went wrong on our side. Try again in a moment.' } }, 500);
    }
  };
}
