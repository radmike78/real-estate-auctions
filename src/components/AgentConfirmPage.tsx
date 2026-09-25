import { useEffect, useState } from 'react';
import { api } from '../lib/api';

// Tokens are single-use: share one request per token even if React runs the effect twice.
const requests = new Map<string, Promise<{ message: string }>>();
const confirmOnce = (token: string) => {
  if (!requests.has(token)) requests.set(token, api<{ message: string }>('/api/agent-applications/confirm', { body: { token } }));
  return requests.get(token)!;
};

export default function AgentConfirmPage({ token }: { token: string }) {
  const [state, setState] = useState<{ ok: boolean; message: string } | null>(null);

  useEffect(() => {
    if (!token) {
      setState({ ok: false, message: 'Open the confirmation link from your email. Each link works once.' });
      return;
    }
    let alive = true;
    // Remove the token from the address bar and history once it's been read.
    history.replaceState(null, '', '#/agents/confirm');
    confirmOnce(token)
      .then((r) => alive && setState({ ok: true, message: r.message }))
      .catch((e: Error) => alive && setState({ ok: false, message: e.message }));
    return () => {
      alive = false;
    };
  }, [token]);

  return (
    <main className="page prose">
      <h1>Confirm your email</h1>
      {!state && <p>Confirming…</p>}
      {state && <div className={state.ok ? 'notice' : 'caution'} role="status">{state.message}</div>}
      <a href="#/agents">Back to the agent directory</a>
    </main>
  );
}
