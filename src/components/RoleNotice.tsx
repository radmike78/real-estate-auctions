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
  const dialog = useRef<HTMLDivElement>(null);
  useEffect(() => {
    if (!open) return;
    btn.current?.focus();
    // A modal keeps the keyboard inside it: Tab cycles through its own links and buttons, Escape closes it.
    const onKey = (e: KeyboardEvent) => {
      if (e.key === 'Escape') return close();
      if (e.key !== 'Tab' || !dialog.current) return;
      const items = [...dialog.current.querySelectorAll<HTMLElement>('a[href], button')];
      if (!items.length) return;
      const first = items[0];
      const last = items[items.length - 1];
      const inside = dialog.current.contains(document.activeElement);
      if (e.shiftKey && (document.activeElement === first || !inside)) {
        e.preventDefault();
        last.focus();
      } else if (!e.shiftKey && (document.activeElement === last || !inside)) {
        e.preventDefault();
        first.focus();
      }
    };
    document.addEventListener('keydown', onKey);
    return () => document.removeEventListener('keydown', onKey);
  }, [open]); // eslint-disable-line react-hooks/exhaustive-deps
  if (!open) return null;
  function close() {
    try {
      localStorage.setItem(KEY, '1');
    } catch {
      /* private mode: show again next visit */
    }
    setOpen(false);
  }
  return (
    <div className="role-backdrop">
      <div ref={dialog} className="role-dialog" role="dialog" aria-modal="true" aria-labelledby="role-title">
        <h2 id="role-title">Welcome</h2>
        <ul>
          <li><strong>Find properties</strong> from government and official sources.</li>
          <li><strong>Learn what’s involved</strong>: how each sale works and what it really costs.</li>
          <li><strong>Follow the steps</strong> with guides, checklists and a free bid calculator.</li>
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
