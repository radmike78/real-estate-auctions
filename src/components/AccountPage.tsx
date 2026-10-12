import { useEffect, useState } from 'react';
import { accountApi, continueAsGuest, refreshAccount, returnToGuest, saveAccountWork, signOutAccount, useAccount, verifiedAccount } from '../lib/account';
import { useSiteFeatures } from '../lib/siteFeatures';
import { makeBackup } from '../lib/progressBackup';
import { workStorage } from '../lib/workStorage';
import { navigate } from '../lib/nav';
import { downloadText } from '../lib/download';
import PageHero from './PageHero';

const download = () => downloadText(`deedowl-work-${new Date().toISOString().slice(0,10)}.json`,JSON.stringify({app:'deedowl',version:1,saved:new Date().toISOString(),data:makeBackup(workStorage).data},null,2),'application/json');
export function AccountBar() {
  const s=useAccount();
  if (s.status!=='signed' && s.status!=='locked') return null;
  return <section className="account-bar" aria-label="Account workspace">
    <span>{s.status==='locked' ? 'Account saving is paused.' : s.dirty ? 'You have work to save.' : 'Your account workspace'}</span>
    <button className="btn btn-secondary" type="button" disabled={s.saving || s.status!=='signed'} onClick={() => void saveAccountWork()}>{s.saving ? 'Saving…' : 'Save my work'}</button>
    <a href="#/account">Downloads and account</a>
    {s.message && <p role="status">{s.message}</p>}
  </section>;
}
export default function AccountPage() {
  const features=useSiteFeatures(); const s=useAccount();
  const [token,setToken]=useState(() => new URLSearchParams(window.location.hash.replace(/^#/, '')).get('verify') ?? '');
  const [email,setEmail]=useState(''); const [name,setName]=useState(''); const [consent,setConsent]=useState(false);
  const [busy,setBusy]=useState(false); const [message,setMessage]=useState(''); const [confirm,setConfirm]=useState('');
  useEffect(() => { if (token) window.history.replaceState(window.history.state,'',`${window.location.pathname}${window.location.search}`); }, [token]);
  async function run(fn: () => Promise<unknown>) {
    if (busy) return; setBusy(true); setMessage('');
    try { await fn(); } catch(e) { setMessage((e as Error).message); } finally { setBusy(false); }
  }
  return <main className="page account-page">
    <PageHero title="Save your work" sub="An account is optional. Keep your property work and learning progress across devices, for free." />
    {!features ? <p role="status">Checking account availability…</p> : !features.accounts ? <section><h2>Account saving: coming soon</h2><p>You can keep using the lessons, practice and tools, and download your work. Account saving will appear here once its secure setup is complete.</p><a className="btn" href="#/toolkit/backup">Download my progress</a></section> : <>
      <p className="why-note">We save property details, deal numbers, checklists and supported lesson/practice progress. We don’t accept uploads or imports. Notes, contacts, written practice answers and personal cash worksheets are not saved to your account. Don’t enter SSNs, credit details, bank information or anyone’s personal information.</p>
      {token && <section><h2>Verify your email</h2><p>This signs you in using the link you requested in this browser.</p><button className="btn" disabled={busy} onClick={() => void run(async () => { await verifiedAccount(token); setToken(''); })}>Verify email and sign in</button></section>}
      {s.status==='loading' ? <p role="status">Opening your saved work…</p> : s.status==='signed' || s.status==='locked' ? <>
        <section><h2>{s.account?.firstName ? `${s.account.firstName}’s workspace` : 'Your workspace'}</h2><p>Signed in as {s.account?.email}. Guest work stays separate on this device.</p>
          <p>Use <strong>Save my work</strong> after making changes. Unsaved account work lasts for this visit; save or download before closing the tab. Your chosen investing location stays on this device.</p>
          <div className="decide-nav"><a className="btn" href="#/analyze">Work on a property</a><a className="btn btn-secondary" href="#/learn">Continue learning</a><button className="btn btn-secondary" onClick={download}>Download my work</button></div>
          {s.account && <p>Last account save: {s.account.revision ? new Date(s.account.updatedAt).toLocaleString() : 'No work saved yet'}</p>}
          <p>The download also includes notes and written answers from this visit that account saving excludes. Keep it private. It is a record for you to read; there is no file-import feature.</p>
          {s.status==='locked' && <><p role="alert">{s.message}</p><button className="btn btn-secondary" disabled={busy} onClick={() => { if (window.confirm('Have you downloaded unsaved work? Reloading opens the saved account version and discards this visit’s unsaved account work.')) { returnToGuest(); void refreshAccount(true); } }}>Open saved account version</button></>}
        </section>
        <details><summary>Account controls</summary><p>Signing out clears the account workspace from this page. Save or download first. Your guest work remains on the device. Protect your email inbox: access to it can allow account sign-in.</p>
          <button className="btn btn-secondary" disabled={busy} onClick={() => { if (window.confirm('Save or download anything you want to keep before signing out. Sign out now?')) void run(() => signOutAccount()); }}>Sign out</button>
          <button className="btn btn-secondary" disabled={busy} onClick={() => void run(async () => { const r=await accountApi<{message:string}>('link',{email:s.account?.email,firstName:s.account?.firstName ?? '',consent:true}); setMessage(r.message); })}>Email a fresh sign-in link</button>
          <h3>Delete this account</h3><p>This deletes your account and saved work from the active database and signs out all its sessions. Existing backups expire under the server’s backup retention policy. A fresh email sign-in within 15 minutes is required.</p>
          <label className="field"><span>Type DELETE to confirm</span><input autoComplete="off" maxLength={6} value={confirm} onChange={e => setConfirm(e.target.value)} /></label>
          <button className="btn btn-secondary" disabled={busy || confirm!=='DELETE'} onClick={() => { if (window.confirm('Permanently delete your account and its saved work? Download anything you want to keep first.')) void run(() => signOutAccount(true)); }}>Delete account</button>
        </details>
      </> : <section><h2>Use your email to sign in</h2><p>No password to remember. We’ll email a one-time link. Open it in the same browser within 15 minutes.</p>
        <form onSubmit={e => { e.preventDefault(); void run(async () => { const r=await accountApi<{message:string}>('link',{email,firstName:name,consent}); setMessage(r.message); }); }}>
          <label className="field"><span>First name (optional)</span><input autoComplete="given-name" maxLength={50} value={name} onChange={e => setName(e.target.value)} /></label>
          <label className="field"><span>Email</span><input type="email" required autoComplete="email" maxLength={254} value={email} onChange={e => setEmail(e.target.value)} /></label>
          <label className="check"><input type="checkbox" required checked={consent} onChange={e => setConsent(e.target.checked)} /> I agree to store my email, optional first name and supported work in an account. <a href="#/privacy">Privacy details</a></label>
          <p>Guest work is not copied into an account automatically. Account work starts separately, so switching people on a shared device does not mix their work.</p>
          <button className="btn" disabled={busy || !consent}>{busy ? 'Sending…' : 'Email my sign-in link'}</button>
        </form>
      </section>}
      {(message || s.message) && <p role="status">{message || s.message}</p>}
    </>}
    <p>{s.account ? <a href="#/learn">Keep learning</a> : <button type="button" className="linkish" onClick={() => { continueAsGuest(); navigate('/learn'); }}>Continue without an account</button>}</p>
  </main>;
}
