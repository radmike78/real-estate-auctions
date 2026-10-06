import { useEffect, useState } from 'react';
import { replaceAddress } from '../lib/nav';
import PageHero from './PageHero';
import OwlNote from './OwlNote';
import { api, unreachable } from '../lib/api';

// Tokens are single-use: share one request per token even if React runs the effect twice.
const requests = new Map<string, Promise<{ message: string }>>();
const confirmOnce = (token: string) => {
  if (!requests.has(token)) requests.set(token, api<{ message: string }>('/api/applications/confirm', { body: { token } }));
  return requests.get(token)!;
};

export default function ApplicationConfirmPage({ token }: { token: string }) {
  const [state, setState] = useState<{ ok: boolean; message: string } | null>(null);

  useEffect(() => {
    if (!token) {
      setState({ ok: false, message: 'Open the confirmation link from your email. Each link works once.' });
      return;
    }
    let alive = true;
    replaceAddress('/advertise/confirm'); // drop the token from the address bar and history
    confirmOnce(token)
      .then((r) => alive && setState({ ok: true, message: r.message }))
      .catch((e: Error) => {
        if (!alive) return;
        // Server trouble, not a bad link: put the link back so "Try again" (or a reload) can retry it.
        if (unreachable(e.message)) replaceAddress(`/advertise/confirm/${token}`);
        setState({ ok: false, message: e.message });
      });
    return () => {
      alive = false;
    };
  }, [token]);

  return (
    <main className="page prose">
      <PageHero compact title="Confirm your email" />
      {!state && <p>Confirming…</p>}
      {state && (state.ok ? <div className="notice" role="status">{state.message}</div> : <div role="status"><OwlNote>{state.message}</OwlNote></div>)}
      {state && !state.ok && unreachable(state.message) && <p><button className="btn" onClick={() => window.location.reload()}>Try again</button></p>}
      <a href="#/advertise">Back to advertising</a>
    </main>
  );
}
