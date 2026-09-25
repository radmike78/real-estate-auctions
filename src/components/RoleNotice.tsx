import { useEffect, useRef, useState } from 'react';

const KEY = 'fsf.role-ack.v1';

function acknowledged(): boolean {
  try {
    return localStorage.getItem(KEY) === '1';
  } catch {
    return false;
  }
}

/** One-time notice on a visitor's first visit, explaining the site's role. */
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
        <h2 id="role-title">Before you start</h2>
        <ul>
          <li><strong>We help you find options.</strong> We don't sell property, run auctions, or offer or arrange financing.</li>
          <li><strong>We're not part of your deal.</strong> Any sale, loan or service agreement is between you and the other party.</li>
          <li><strong>You do the due diligence.</strong> Verify everything with official sources and licensed professionals before you commit or pay.</li>
        </ul>
        <div className="row">
          <button ref={btn} className="btn big" onClick={close}>I understand</button>
          <a href="#/disclaimer" onClick={close}>Read the details</a>
        </div>
      </div>
    </div>
  );
}
