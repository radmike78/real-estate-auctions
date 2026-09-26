import { useEffect, useRef, useState } from 'react';

const KEY = 'fsf.role-ack.v1';

function acknowledged(): boolean {
  try {
    return localStorage.getItem(KEY) === '1';
  } catch {
    return false;
  }
}

/** One-time welcome on a visitor's first visit: what the site offers, and that each deal is theirs to research. */
export default function RoleNotice() {
  const [open, setOpen] = useState(() => !acknowledged());
  const btn = useRef<HTMLButtonElement>(null);
  useEffect(() => {
    if (open) btn.current?.focus();
  }, [open]);
  if (!open) return null;
  const close = () => {
    try {
      localStorage.setItem(KEY, '1');
    } catch {
      /* private mode: show again next visit */
    }
    setOpen(false);
  };
  return (
    <div className="role-backdrop">
      <div className="role-dialog" role="dialog" aria-modal="true" aria-labelledby="role-title" onKeyDown={(e) => e.key === 'Escape' && close()}>
        <h2 id="role-title">Welcome</h2>
        <ul>
          <li><strong>Find properties</strong> from government and official sources.</li>
          <li><strong>Learn what’s involved</strong>: how each sale works and what it really costs.</li>
          <li><strong>Follow the steps</strong> with playbooks, checklists and a free bid calculator.</li>
          <li><strong>Your deal, your decision.</strong> Verify with the official source, and get advice from your own attorney, tax advisor, agent and financial advisor before you bid, buy or borrow.</li>
        </ul>
        <div className="row">
          <button ref={btn} className="btn big" onClick={close}>Get started</button>
          <a href="#/disclaimer" onClick={close}>How we help &amp; the details</a>
        </div>
      </div>
    </div>
  );
}
