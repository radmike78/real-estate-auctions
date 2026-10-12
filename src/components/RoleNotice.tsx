import { workStorage as localStorage } from '../lib/workStorage';
import { useEffect, useRef, useState } from 'react';
import { AreaPicker } from './AreaPicker';
import { useMyState } from '../lib/myState';
import { navigate } from '../lib/nav';
import { setMode } from '../lib/journey';
import { planNow } from '../lib/planNext';

const KEY = 'fsf.role-ack.v1';

function acknowledged(): boolean {
  try {
    return localStorage.getItem(KEY) === '1';
  } catch {
    return false;
  }
}

/**
 * One-time welcome on a visitor's first visit: one line on what the site helps you do, an optional area, and Start learning.
 * The cautions (verify with the official source, get your own advisors) sit where those decisions happen: the calculators'
 * "Before you commit" list, the sale and listing disclaimers, and the footer on every page.
 */
export default function RoleNotice() {
  const [state] = useMyState();
  const [open, setOpen] = useState(() => !acknowledged());
  const btn = useRef<HTMLButtonElement>(null);
  const dialog = useRef<HTMLDivElement>(null);
  // A visitor who arrives straight at a tool sees it, with a short note; the full welcome is for the home page.
  const [home] = useState(() => window.location.pathname === '/' && !window.location.hash.startsWith('#/'));
  useEffect(() => {
    if (!open || !home) return;
    // Start on "Where are you buying?": the first state button.
    // Focus the heading, not the first state: a focus ring on "Nevada" looked like it was already chosen.
    (dialog.current?.querySelector<HTMLElement>('#role-title') ?? btn.current)?.focus();
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
  }, [open, home]); // eslint-disable-line react-hooks/exhaustive-deps
  if (!open) return null;
  function close() {
    try {
      localStorage.setItem(KEY, '1');
    } catch {
      /* private mode: show again next visit */
    }
    setOpen(false);
  }
  if (!home) {
    return (
      <div className="role-note" role="note">
        <span><strong>Welcome to DeedOwl.</strong> Free guides, checklists and calculators. Each deal is yours to research: verify with the official source and your own advisors.</span>
        <a href="#/about" onClick={close}>How DeedOwl works</a>
        <button type="button" className="btn btn-secondary" onClick={close}>Got it</button>
      </div>
    );
  }
  return (
    <div className="role-backdrop">
      <div ref={dialog} className="role-dialog" role="dialog" aria-modal="true" aria-labelledby="role-title">
        <h2 id="role-title" tabIndex={-1}>Welcome to DeedOwl</h2>
        <p className="role-lead">DeedOwl teaches you, step by step, how to find, check and buy real estate, from listed homes to auctions, with properties from official sources.</p>
        {!state ? <>
          <h3 className="area-dialog-head">Where are you buying?</h3>
          <AreaPicker onDone={() => { close(); setMode('guided'); navigate(planNow().task.href); }} doneLabel="Try the first decision" />
        </> : <button type="button" className="btn" onClick={() => { close(); setMode('guided'); navigate(planNow().task.href); }}>Try the first decision</button>}
        <button type="button" className="linkish" onClick={close}>Explore the website first</button>
      </div>
    </div>
  );
}
