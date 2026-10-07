import { guideKey } from '../lib/narrow';
import { STATES, type StateCode } from '../lib/regions';
import type { SaleKey } from '../practice/types';
import { useMyState } from '../lib/myState';

/** The other-state drill for this kind of sale, where one exists (every id here is checked in practice.test.ts). */
export const drillFor = (st: StateCode, sale: SaleKey): string | null => {
  if (st === 'NV') return null;
  const s = st.toLowerCase();
  if (sale === 'foreclosure') return `trustee-sale-${s}`;
  if (sale === 'tax') return st === 'AZ' ? 'tax-lien-az' : st === 'UT' ? 'tax-sale-ut' : `tax-deed-${s}`;
  if (sale === 'hoa') return `hoa-sale-${s}`;
  if (sale === 'sheriff') return `sheriff-sale-${s}`;
  return null;
};

/** One line on how each state's version of a sale differs from the Nevada practice run. */
const DIFFERS: Partial<Record<SaleKey, Partial<Record<StateCode, string>>>> = {
  tax: {
    TX: 'In Texas a tax sale follows a court judgment, the sheriff or a constable sells, and the owner can buy the property back for 180 days or 2 years for a homestead, land designated for agricultural use or a mineral interest, paying you a premium.',
    CA: 'In California the county tax collector sells tax-defaulted property after five years of unpaid taxes (three for nonresidential commercial property, R&T 3691), and the owner can pay off the taxes until the close of business on the last business day before the sale (R&T 3707).',
    AZ: 'In Arizona the county sells tax lien certificates, not properties: you bid the interest rate down. If the owner never pays, you can sue to foreclose after three years and within ten. The court gives you a deed or, if you or the owner ask and the property is likely to sell for more than $2,500 above what’s owed, orders an auction that pays you in cash (A.R.S. 42-18201, 42-18204).',
    UT: 'In Utah the county auditor holds one tax sale a year, in May or June, for property four years behind on taxes (Utah Code 59-2-1343), and a bid must cover the taxes, penalties, interest and costs.',
  },
  foreclosure: {
    TX: 'In Texas trustee sales happen on the first Tuesday of the month at the county courthouse, after at least 21 days’ notice.',
    CA: 'In California the trustee sale comes at least three months after the notice of default and 20 days after the notice of sale, and for homes of one to four units the winning bid isn’t final at once: tenants and other eligible bidders have 15 days to bid or give notice that they intend to, and if one does, until day 45 (Civil Code 2924m).',
    AZ: 'In Arizona the trustee sale can be held no sooner than the 91st day after the notice of sale is recorded (A.R.S. 33-808); the winning bidder pays by 5 p.m. the next business day (A.R.S. 33-811).',
    UT: 'In Utah the notice of sale can be given three months after the notice of default is recorded. The sale is then at least about a month later, after three weekly newspaper notices and 30 days on the state notice website (Utah Code 57-1-24, 57-1-25).',
  },
};

/**
 * Practice runs follow Nevada (Clark County) rules. For a visitor in another state, says so at the top and points to
 * that state's guide (and drill, where there is one), so nobody learns the wrong process for their state.
 */
export default function PracticeStateNote({ sale }: { sale: SaleKey }) {
  const [st] = useMyState();
  if (!st || st === 'NV') return null;
  const name = STATES.find((x) => x.code === st)?.name ?? st;
  if (sale === 'sid') {
    return (
      <div className="notice practice-state-note" role="note">
        <strong>This sale exists only in Nevada.</strong> Special improvement district (SID) lien certificates are a Clark County, Nevada sale. {name} doesn’t sell anything like them; see the <a href="#/playbooks">sale guides for {name}</a> instead.
      </div>
    );
  }
  const guide = guideKey(st, sale);
  const drill = drillFor(st, sale);
  // The visitor's own state first: its drill (where there is one) is the first thing offered.
  return (
    <div className="notice practice-state-note" role="note">
      {drill && <p className="practice-state-first"><a className="btn" href={`#/practice/drills/${drill}`}>Try the {name} drill first&nbsp;→</a> <span>It uses {name} rules for this kind of sale.</span></p>}
      <p><strong>This practice uses Nevada (Clark County) rules.</strong> {DIFFERS[sale]?.[st] ?? `${name}’s deadlines, forms and who runs the sale differ.`}{' '}
      Before a real {name} deal, read the <a href={`#/playbooks/${guide}`}>{name} step-by-step guide</a>.</p>
    </div>
  );
}
