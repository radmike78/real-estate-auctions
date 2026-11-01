import { useEffect, useState } from 'react';
import { api } from '../lib/api';
import { AD_SPOTS, cleanSpots, type SpotSettings } from '../lib/adSpots';
import { CATEGORIES, type Category } from '../lib/pros';
import { refreshAdSpots } from './AdSpot';

const ALL = Object.keys(CATEGORIES) as Category[];

/**
 * Admin: where fixed ads show. Each spot is on or off, with the kinds of professionals it shows. Saved for
 * the whole site; pages pick it up on their next visit.
 */
export default function AdSpotsAdmin() {
  const [spots, setSpots] = useState<SpotSettings | null>(null);
  const [busy, setBusy] = useState(false);
  const [msg, setMsg] = useState<{ ok: boolean; text: string } | null>(null);

  useEffect(() => {
    api<{ spots: unknown }>('/api/ad-spots').then((r) => setSpots(cleanSpots(r.spots)), (e: Error) => setMsg({ ok: false, text: e.message }));
  }, []);
  if (!spots) return msg ? <div className="caution" role="alert">{msg.text}</div> : <p>Loading…</p>;

  const set = (key: string, patch: Partial<SpotSettings[string]>) => {
    setMsg(null);
    setSpots((cur) => (cur ? { ...cur, [key]: { ...cur[key], ...patch } } : cur));
  };
  async function save() {
    setBusy(true);
    try {
      const r = await api<{ spots: unknown }>('/api/admin/ad-spots', { body: { spots }, auth: true });
      const saved = cleanSpots(r.spots);
      setSpots(saved);
      refreshAdSpots(saved);
      setMsg({ ok: true, text: 'Saved. Visitors see the change on their next page load.' });
    } catch (e) {
      setMsg({ ok: false, text: (e as Error).message });
    } finally {
      setBusy(false);
    }
  }
  const on = AD_SPOTS.filter((s) => spots[s.key].on).length;

  return (
    <section className="ad-spots-admin" aria-labelledby="ad-spots-head">
      <h2 id="ad-spots-head" className="section-title">Fixed ad spots</h2>
      <p>
        Turn on the places where Spotlight and Mentor Connect advertisers appear together in a labeled ad, and choose which kinds of professionals each one shows.
        Spotlight and Mentor Connect advertisers in the visitor’s area appear; a spot with no advertiser yet shows nothing, except Financing, which shows an “Advertise here” box that points
        professionals to the Advertise page. {on} of {AD_SPOTS.length} spots are on.
      </p>
      <p className="small muted">Pages for homeowners (homeowner help, pre-foreclosures, surplus money) and business closures have no ad spots: an ad there could reach owners in distress. Guides, lessons, drills, property pages and deal packets about forced sales or liens never show an ad, even with their spot on.</p>
      <ul className="ad-spot-list">
        {AD_SPOTS.map((s) => {
          const v = spots[s.key];
          const auto = v.categories === 'auto';
          const chosen = auto ? [] : (v.categories as Category[]);
          return (
            <li key={s.key} className={v.on ? 'on' : undefined}>
              <label className="check ad-spot-toggle">
                <input type="checkbox" checked={v.on} onChange={(e) => set(s.key, { on: e.target.checked })} />
                <span><strong>{s.label}</strong> <span className="muted">· {s.where}</span></span>
              </label>
              {v.on && (
                <div className="ad-spot-cats">
                  {s.auto && (
                    <div className="row" role="radiogroup" aria-label={`Who ${s.label} shows`}>
                      <label className="check"><input type="radio" name={`auto-${s.key}`} checked={auto} onChange={() => set(s.key, { categories: 'auto' })} /> Automatic: the professionals the deal or step needs (buying through an agent only)</label>
                      <label className="check"><input type="radio" name={`auto-${s.key}`} checked={!auto} onChange={() => set(s.key, { categories: [...s.categories] })} /> Choose</label>
                    </div>
                  )}
                  {!auto && (
                    <fieldset>
                      <legend className="small">Who it shows</legend>
                      <div className="ad-spot-grid">
                        {ALL.map((c) => (
                          <label key={c} className="check">
                            <input type="checkbox" checked={chosen.includes(c)} onChange={(e) => set(s.key, { categories: e.target.checked ? [...chosen, c] : chosen.filter((x) => x !== c) })} /> {CATEGORIES[c].label}
                          </label>
                        ))}
                      </div>
                      {chosen.length === 0 && <p className="small warn">Choose at least one, or this spot shows nothing.</p>}
                      <button type="button" className="linkish small" onClick={() => set(s.key, { categories: [...s.categories] })}>Reset to the suggested list</button>
                    </fieldset>
                  )}
                </div>
              )}
            </li>
          );
        })}
      </ul>
      {msg && <div className={msg.ok ? 'notice small' : 'caution small'} role={msg.ok ? 'status' : 'alert'}>{msg.text}</div>}
      <button type="button" className="btn" disabled={busy} onClick={save}>{busy ? 'Saving…' : 'Save ad spots'}</button>
    </section>
  );
}
