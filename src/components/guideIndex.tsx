// Builds the "Search the guides" index from the guide sections this site already shows, so search results
// always match the published pages. Loaded only when someone opens the search page.
import { renderToStaticMarkup } from 'react-dom/server';
import type { ReactNode } from 'react';
import type { DrillSection } from './DrillDown';
import { SECTIONS as ABOUT } from './AboutPage';
import { SECTIONS as BUSINESS } from './BusinessAssetsPage';
import { SECTIONS as HOW_WE_HELP } from './DisclaimerPage';
import { SECTIONS as PRIVACY } from './PrivacyPage';
import { SECTIONS as SHORT_SALES } from './ShortSalesPage';
import { SECTIONS as TERMS } from './TermsPage';
import { GUIDE as PRE_FORECLOSURE } from './PreForeclosurePage';
import { sectionsFor as bankOwned } from './BankOwnedPage';
import { sections as playbookSections } from './PlaybookPage';
import HomeownerHelpPage from './HomeownerHelpPage';
import { PLAYBOOKS } from '../lib/playbooks';
import { buildIndex, fromHtml, type GuideDoc, type GuideIndex } from '../lib/guideSearch';

const html = (node: ReactNode) => renderToStaticMarkup(<>{node}</>);

function fromSections(page: string, base: string, sections: DrillSection[], weight?: number): GuideDoc[] {
  return sections.map((s) => {
    const summary = typeof s.summary === 'string' ? s.summary : fromHtml(html(s.summary)).text;
    const { text, sources } = fromHtml(html(s.content()));
    // Tile summaries that are only counts ("8 steps, from…") add nothing to search.
    const lead = /^\d/.test(summary) ? '' : `${summary.replace(/\.$/, '')}. `;
    return { href: `${base}/${s.key}`, page, title: s.title, text: `${lead}${text}`, sources, weight };
  });
}

/** The homeowner help page is one long page: each of its headed parts becomes its own result. */
function homeownerDocs(): GuideDoc[] {
  const page = html(<HomeownerHelpPage />);
  return [...page.matchAll(/<section[^>]*>\s*<h2[^>]*>([\s\S]*?)<\/h2>([\s\S]*?)<\/section>/g)].map((m) => {
    const { text, sources } = fromHtml(m[2]);
    return { href: '#/homeowner-help', page: 'Facing foreclosure? Free help', title: fromHtml(m[1]).text, text, sources };
  });
}

export function guideDocs(): GuideDoc[] {
  const docs: GuideDoc[] = [];
  for (const p of PLAYBOOKS) {
    const page = `${p.short} playbook`;
    docs.push({
      href: `#/playbooks/${p.key}`,
      page,
      title: p.title,
      text: [p.oneLine, `What you get: ${p.youGet.replace(/\.$/, '')}.`, ...p.glance.map((g) => `${g.label}: ${g.value.replace(/\.$/, '')}.`)].join(' '),
      sources: p.sources.filter((s) => s.url.startsWith('https://')),
    });
    docs.push(...fromSections(page, `#/playbooks/${p.key}`, playbookSections(p)));
  }
  docs.push(
    ...fromSections('Short sales', '#/short-sales', SHORT_SALES),
    ...fromSections('Bank-owned & government homes', '#/bank-owned', bankOwned('all')),
    ...fromSections('Pre-foreclosure guide', '#/pre-foreclosures', PRE_FORECLOSURE),
    ...fromSections('Business assets & closures', '#/business-assets', BUSINESS),
    ...homeownerDocs(),
    ...fromSections('How it works', '#/about', ABOUT),
    ...fromSections('How we help you invest', '#/disclaimer', HOW_WE_HELP),
    ...fromSections('Privacy policy', '#/privacy', PRIVACY, 0.5),
    ...fromSections('Terms of use', '#/terms', TERMS, 0.5),
  );
  return docs.filter((d) => d.text.length > 20);
}

let cached: GuideIndex | null = null;
export function guideIndex(): GuideIndex {
  cached ??= buildIndex(guideDocs());
  return cached;
}
