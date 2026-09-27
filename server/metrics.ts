// Advertiser metrics and reports.
//
// Privacy by design:
//  - Only daily aggregate counts are kept per advertiser (views, contact clicks, leads).
//  - Unique visitors are counted with a one-way hash of the network address salted with a random
//    value that exists only in memory and changes every day, so hashes can't be linked across
//    days or reversed to an IP. The per-visitor rows are deleted after 2 days. (The user agent
//    isn't part of the hash: rotating it would otherwise mint unlimited "unique" visitors.)
//  - Obvious bots are ignored, and each network's events are rate limited, so a competitor
//    can't inflate (or an advertiser pad) the numbers by hammering a button.

import { createHash, randomBytes } from 'node:crypto';
import type { Db, LeadRow, MetricKind } from './db';
import { pacificToIso } from '../src/lib/time';
import { isSiteAction, isSitePage, SITE_ACTIONS, SITE_PAGES, type SiteAction, type SitePage } from '../src/lib/siteStats';

export const BOT_UA = /bot|crawl|spider|slurp|preview|headless|lighthouse|monitor|curl|wget|python|scrapy|httpclient/i;

export function pacificDay(d: Date): string {
  return new Intl.DateTimeFormat('en-CA', { timeZone: 'America/Los_Angeles', year: 'numeric', month: '2-digit', day: '2-digit' }).format(d);
}

export class VisitorHasher {
  private day = '';
  private salt = Buffer.alloc(0);
  hash(ip: string, ua: string, day: string): string {
    if (day !== this.day) {
      this.day = day;
      this.salt = randomBytes(32);
    }
    return createHash('sha256').update(this.salt).update(ip).update('\n').update(ua).digest('hex').slice(0, 32);
  }
}

export interface MetricsSummary {
  from: string;
  to: string;
  totals: Record<MetricKind, { total: number; uniques: number }>;
  contactClicks: number; // phone + email + website
  contactRate: number | null; // unique contact clicks / unique profile views
  daily: { day: string; views: number; contacts: number; leads: number }[];
}

export function summarize(db: Db, proId: string, from: string, to: string): MetricsSummary {
  const rows = db.metrics.series(proId, from, to);
  const blank = () => ({ total: 0, uniques: 0 });
  const totals = { impression: blank(), profile_view: blank(), phone_click: blank(), email_click: blank(), website_click: blank(), lead: blank() };
  const byDay = new Map<string, { views: number; contacts: number; leads: number }>();
  for (const r of rows) {
    totals[r.kind].total += r.total;
    totals[r.kind].uniques += r.uniques;
    const d = byDay.get(r.day) ?? { views: 0, contacts: 0, leads: 0 };
    if (r.kind === 'profile_view') d.views += r.uniques;
    if (r.kind === 'phone_click' || r.kind === 'email_click' || r.kind === 'website_click') d.contacts += r.uniques;
    if (r.kind === 'lead') d.leads += r.total;
    byDay.set(r.day, d);
  }
  // Fill every day in range so charts have no gaps.
  const daily: MetricsSummary['daily'] = [];
  for (let t = Date.parse(`${from}T12:00:00Z`); t <= Date.parse(`${to}T12:00:00Z`); t += 86_400_000) {
    const day = new Date(t).toISOString().slice(0, 10);
    daily.push({ day, ...(byDay.get(day) ?? { views: 0, contacts: 0, leads: 0 }) });
  }
  const contactUniques = totals.phone_click.uniques + totals.email_click.uniques + totals.website_click.uniques;
  return {
    from,
    to,
    totals,
    contactClicks: totals.phone_click.total + totals.email_click.total + totals.website_click.total,
    contactRate: totals.profile_view.uniques ? contactUniques / totals.profile_view.uniques : null,
    daily,
  };
}

export interface SiteSummary {
  from: string;
  to: string;
  days: number;
  visits: number; // one per visitor per day (visitors can't be linked across days, so this is not "people per month")
  pageViews: number;
  avgDailyVisitors: number;
  busiestDay: { day: string; visits: number } | null;
  daily: { day: string; visits: number; pageViews: number }[];
  pages: { key: string; label: string; views: number; visits: number }[];
  actions: { key: string; label: string; total: number; visits: number }[];
  advertisers: { appearances: number; profileViews: number; contactClicks: number; leads: number };
}

/** Site-wide totals for the admin stats page and the advertiser summary. */
export function siteSummary(db: Db, from: string, to: string): SiteSummary {
  const rows = db.site.series(from, to);
  const byDay = new Map<string, { visits: number; pageViews: number }>();
  const pages = new Map<string, { views: number; visits: number }>();
  const actions = new Map<string, { total: number; visits: number }>();
  for (const r of rows) {
    if (r.metric === 'visit') byDay.set(r.day, { visits: r.uniques, pageViews: r.total });
    if (r.metric === 'page' && isSitePage(r.key)) {
      const p = pages.get(r.key) ?? { views: 0, visits: 0 };
      pages.set(r.key, { views: p.views + r.total, visits: p.visits + r.uniques });
    }
    if (r.metric === 'action' && isSiteAction(r.key)) {
      const a = actions.get(r.key) ?? { total: 0, visits: 0 };
      actions.set(r.key, { total: a.total + r.total, visits: a.visits + r.uniques });
    }
  }
  const daily: SiteSummary['daily'] = [];
  for (let t = Date.parse(`${from}T12:00:00Z`); t <= Date.parse(`${to}T12:00:00Z`); t += 86_400_000) {
    const day = new Date(t).toISOString().slice(0, 10);
    daily.push({ day, ...(byDay.get(day) ?? { visits: 0, pageViews: 0 }) });
  }
  const visits = daily.reduce((n, d) => n + d.visits, 0);
  const busiest = daily.reduce<SiteSummary['busiestDay']>((b, d) => (d.visits > (b?.visits ?? 0) ? { day: d.day, visits: d.visits } : b), null);
  const adv = Object.fromEntries(db.site.advertiserTotals(from, to).map((r) => [r.kind, r]));
  const sum = (k: string, f: 'total' | 'uniques') => Number(adv[k]?.[f] ?? 0);
  return {
    from,
    to,
    days: daily.length,
    visits,
    pageViews: daily.reduce((n, d) => n + d.pageViews, 0),
    avgDailyVisitors: daily.length ? Math.round(visits / daily.length) : 0,
    busiestDay: busiest,
    daily,
    pages: [...pages].map(([key, v]) => ({ key, label: SITE_PAGES[key as SitePage], ...v })).sort((a, b) => b.views - a.views),
    actions: (Object.keys(SITE_ACTIONS) as SiteAction[]).map((key) => ({ key, label: SITE_ACTIONS[key], ...(actions.get(key) ?? { total: 0, visits: 0 }) })),
    advertisers: {
      appearances: sum('impression', 'total'),
      profileViews: sum('profile_view', 'uniques'),
      contactClicks: sum('phone_click', 'uniques') + sum('email_click', 'uniques') + sum('website_click', 'uniques'),
      leads: sum('lead', 'total'),
    },
  };
}

export function monthRange(month: string): { from: string; to: string } {
  const [y, m] = month.split('-').map(Number);
  const last = new Date(Date.UTC(y, m, 0)).getUTCDate();
  return { from: `${month}-01`, to: `${month}-${String(last).padStart(2, '0')}` };
}

export function leadsToCsv(leads: LeadRow[]): string {
  // Neutralize spreadsheet formula injection (cells starting with = + - @) and quote every cell.
  const cell = (v: string | null) => {
    const s = (v ?? '').replace(/"/g, '""');
    return `"${/^[=+\-@\t\r]/.test(s) ? `'${s}` : s}"`;
  };
  const header = ['Received', 'Name', 'Email', 'Phone', 'Interested in', 'Message'];
  return [header.map(cell).join(','), ...leads.map((l) => [l.createdAt, l.name, l.email, l.phone, l.interest, l.message].map(cell).join(','))].join('\r\n');
}

export function monthlyReportText(name: string, month: string, s: MetricsSummary, leadCount: number, dashboardUrl: string): string {
  const pct = s.contactRate === null ? 'n/a' : `${Math.round(s.contactRate * 100)}%`;
  return (
    `Hi ${name},\n\nHere is your DeedOwl advertising report for ${month}.\n\n` +
    `  Times your profile appeared in search results: ${s.totals.impression.total}\n` +
    `  Profile views (unique visitors):                 ${s.totals.profile_view.uniques}\n` +
    `  Phone taps:                                      ${s.totals.phone_click.uniques}\n` +
    `  Email clicks:                                    ${s.totals.email_click.uniques}\n` +
    `  Website visits:                                  ${s.totals.website_click.uniques}\n` +
    `  Contact requests (leads) sent to you:            ${leadCount}\n` +
    `  Visitors who contacted you:                      ${pct}\n\n` +
    `See daily details and download your leads: ${dashboardUrl}\n\n` +
    `Counts exclude known bots and repeat clicks from the same visitor on the same day.\n`
  );
}

/** UTC instants bounding Las Vegas calendar days [from 00:00, day after `to` 00:00). */
export function pacificDaysToUtc(from: string, to: string): { start: string; end: string } {
  const [fy, fm, fd] = from.split('-').map(Number);
  const [ty, tm, td] = to.split('-').map(Number);
  return { start: pacificToIso(fy, fm - 1, fd, 0), end: pacificToIso(ty, tm - 1, td + 1, 0) };
}
