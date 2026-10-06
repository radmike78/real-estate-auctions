import { describe, expect, it } from 'vitest';
import { buildIndex, fromHtml, highlight, queryTerms, searchGuides, snippetFor, stem, type GuideDoc } from './guideSearch';
import { guideDocs, guideIndex } from '../components/guideIndex';

describe('guide search engine', () => {
  it('stems plurals and drops common words', () => {
    expect(stem('liens')).toBe('lien');
    expect(stem('properties')).toBe('property');
    expect(stem('taxes')).toBe('tax');
    expect(stem('address')).toBe('address');
    expect(queryTerms('What happens to the liens after a tax sale?')).toEqual(['happen', 'lien', 'after', 'tax', 'sale']);
    expect(queryTerms('   ')).toEqual([]);
  });

  it('prefers title matches and needs every word when it can', () => {
    const docs: GuideDoc[] = [
      { href: '#/a', page: 'A', title: 'Deposits', text: 'Bring a cashier’s check for the deposit.', sources: [] },
      { href: '#/b', page: 'B', title: 'Other', text: 'The deposit is due at the sale. Taxes stay with the land.', sources: [] },
      { href: '#/c', page: 'C', title: 'Taxes', text: 'Property taxes can survive.', sources: [] },
    ];
    const ix = buildIndex(docs);
    expect(searchGuides(ix, 'deposit').hits.map((h) => h.doc.href)).toEqual(['#/a', '#/b']);
    const both = searchGuides(ix, 'deposit taxes');
    expect(both.partial).toBe(false);
    expect(both.hits.map((h) => h.doc.href)).toEqual(['#/b']);
    const some = searchGuides(ix, 'deposit zebra');
    expect(some.partial).toBe(true);
    expect(some.hits.length).toBe(2);
    expect(searchGuides(ix, 'the of and').hits).toEqual([]);
  });

  it('turns section HTML into text and keeps its outside links as sources', () => {
    const { text, sources } = fromHtml('<h3>Rules</h3><ul><li>Pay in full &amp; on time</li><li>See <a href="https://www.clarkcountynv.gov/x" target="_blank">County notice ↗</a></li><li><a href="#/calculator">Calculator</a></li></ul>');
    expect(text).toBe('Rules: Pay in full & on time. See County notice. Calculator.');
    expect(sources).toEqual([{ label: 'County notice', url: 'https://www.clarkcountynv.gov/x' }]);
  });

  it('picks the sentence that matches and highlights the searched words', () => {
    expect(snippetFor('Intro sentence here. The deposit is due in cash. Something else.', ['deposit'])).toContain('The deposit is due');
    expect(highlight('Deposits are due.', ['deposit'])).toEqual([
      { text: 'Deposits', hit: true },
      { text: ' are due.', hit: false },
    ]);
  });
});

describe('the site’s guide index', () => {
  const docs = guideDocs();

  it('covers every guide, with links that stay on this site', () => {
    expect(docs.length).toBeGreaterThan(40);
    for (const d of docs) {
      expect(d.href).toMatch(/^#\/[a-z0-9/_-]+$/);
      expect(d.text).not.toMatch(/<[a-z]/i);
      for (const s of d.sources) expect(s.url).toMatch(/^https:\/\//);
    }
    for (const base of ['#/playbooks/', '#/short-sales/', '#/bank-owned/', '#/pre-foreclosures/', '#/business-assets/', '#/homeowner-help', '#/about/']) {
      expect(docs.some((d) => d.href.startsWith(base))).toBe(true);
    }
  });

  it('answers common buyer questions from the right guide', () => {
    const ix = guideIndex();
    const top = (q: string) => searchGuides(ix, q).hits.slice(0, 5).map((h) => h.doc.href);
    expect(top('HOA super-priority lien').some((h) => h.startsWith('#/playbooks/hoa'))).toBe(true);
    expect(top('short sale approval').some((h) => h.startsWith('#/short-sales') || h.includes('short'))).toBe(true);
    expect(top('mediation').some((h) => h.startsWith('#/homeowner-help') || h.startsWith('#/pre-foreclosures'))).toBe(true);
    expect(searchGuides(ix, 'tax sale').hits.length).toBeGreaterThan(3);
  });

  it('searches the lessons, property types, team and paperwork guides too', () => {
    const ix = guideIndex();
    const hrefs = (q: string) => searchGuides(ix, q).hits.map((h) => h.doc.href);
    expect(hrefs('depreciation').some((h) => h.startsWith('#/learn/'))).toBe(true);
    expect(hrefs('DSCR').some((h) => h.startsWith('#/learn/'))).toBe(true);
    expect(hrefs('1031 exchange').some((h) => h.startsWith('#/learn/'))).toBe(true);
    expect(hrefs('anchor tenant strip center').some((h) => h.startsWith('#/learn/types/'))).toBe(true);
    expect(hrefs('home inspector').some((h) => h.startsWith('#/find-a-pro/'))).toBe(true);
    expect(hrefs('closing disclosure').some((h) => h === '#/toolkit/paperwork')).toBe(true);
  });
});

describe('search while typing', () => {
  it('matches a word that is still being typed, but not once it is finished', () => {
    const ix = buildIndex([{ href: '#/a', page: 'A', title: 'Pay', text: 'Bring the deposit in certified funds.', sources: [] }]);
    const typing = searchGuides(ix, 'depo');
    expect(typing.hits.map((h) => h.doc.href)).toEqual(['#/a']);
    expect(typing.terms).toContain('deposit');
    expect(searchGuides(ix, 'depo ').hits).toEqual([]);
  });
});
