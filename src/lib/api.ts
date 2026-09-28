// Small JSON client for the site's own API (same origin only).

export class ApiError extends Error {
  constructor(
    readonly status: number,
    message: string,
    readonly body: Record<string, unknown>,
  ) {
    super(message);
  }
}

/** `auth` marks a signed-in (admin or advertiser) write; the server requires this header on those. */
export async function api<T = Record<string, unknown>>(path: string, opts: { body?: unknown; auth?: boolean } = {}): Promise<T> {
  const headers: Record<string, string> = {};
  if (opts.body !== undefined) headers['content-type'] = 'application/json';
  if (opts.auth) headers['x-fsf-request'] = '1';
  let res: Response;
  try {
    res = await fetch(path, {
      method: opts.body === undefined ? 'GET' : 'POST',
      headers,
      body: opts.body === undefined ? undefined : JSON.stringify(opts.body),
      credentials: 'same-origin',
      cache: 'no-store',
    });
  } catch {
    throw new ApiError(0, "Couldn't reach the server. Check your connection and try again.", {});
  }
  const body = (await res.json().catch(() => ({}))) as Record<string, unknown>;
  if (!res.ok) {
    const fallback = res.status >= 500 ? "We couldn't reach DeedOwl just now. Please try again in a few minutes." : 'Something went wrong. Please try again.';
    throw new ApiError(res.status, typeof body.error === 'string' ? body.error : fallback, body);
  }
  return body as T;
}

/** True for the "couldn't reach the server" messages above (network down or a server error), not a bad request. */
export const unreachable = (message: string) => /couldn't reach/i.test(message);
