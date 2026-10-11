import { it, expect, vi } from 'vitest';
import { renderToStaticMarkup } from 'react-dom/server';
import { parse } from 'node-html-parser';
import LessonPage from './LessonPage';
import { LESSONS } from '../lib/lessons';
import { mentionsOtherState } from '../lib/myState';
import { PROPERTY_TOPICS } from '../lib/deep/propertyTopics';
import PropertyTypePage from './PropertyTypePage';
import LivePage from './LivePage';
import FindDealsPage from './FindDealsPage';
import FinancingPage from './FinancingPage';
import ReadingPage from './ReadingPage';
import { STATES } from '../lib/regions';
import HomePage from './HomePage';
import LearnPage from './LearnPage';
import PracticePage from './PracticePage';
import ToolkitPage from './ToolkitPage';
import AnalyzePage from './AnalyzePage';
import GuidesPage from './GuidesPage';
import FindAProPage from './FindAProPage';
import PlaybookPage from './PlaybookPage';
import AboutPage from './AboutPage';
import ShortSalesPage from './ShortSalesPage';
import BankOwnedPage from './BankOwnedPage';
import BusinessAssetsPage from './BusinessAssetsPage';
import PreForeclosurePage from './PreForeclosurePage';
import HomeownerHelpPage from './HomeownerHelpPage';

vi.mock('../data/live', () => ({ useLiveFeed: () => ({ result: null }), useProperties: () => ({ properties: [], loading: false }) }));

function selectState(code: string) {
  Object.assign(globalThis, {
    localStorage: { getItem: (key: string) => key === 'deedowl.state.v1' ? code : null },
    window: { dispatchEvent: () => true, location: { hash: '', pathname: '/', search: '' } },
    CustomEvent: class {},
  });
}

it('keeps lesson text, examples, sources and quiz choices in one state', () => {
  const leaks: string[] = [];
  for (const state of STATES) {
    selectState(state.code);
    for (const lesson of LESSONS) {
      const root = parse(renderToStaticMarkup(<LessonPage lessonKey={lesson.key} />));
      const selectors = ['.lesson-body-text p', '.lesson-body-text li', '.lesson-body-text tr', '.lesson-sources li', '.check-list li', '.lesson-terms li'];
      expect(root.querySelectorAll('.lesson-topic').length).toBeGreaterThan(0);
      for (const element of selectors.flatMap((selector) => root.querySelectorAll(selector))) {
        if (mentionsOtherState(state.code, element.text)) {
          leaks.push(`${state.code} ${lesson.key}: ${element.text}`);
        }
      }
    }
  }
  expect(leaks).toEqual([]);
});

it('keeps main page content in the selected state', () => {
  const leaks: string[] = [];
  const pages = [
    ['HomePage', <HomePage />],
    ['LearnPage', <LearnPage />],
    ['PracticePage', <PracticePage />],
    ['ToolkitPage', <ToolkitPage />],
    ['AnalyzePage', <AnalyzePage />],
    ['GuidesPage', <GuidesPage initialQuery="" />],
    ['FindAProPage', <FindAProPage />],
    ['PlaybookPage', <PlaybookPage />],
    ['AboutPage', <AboutPage section="all" />],
    ['ShortSalesPage', <ShortSalesPage />],
    ['BankOwnedPage', <BankOwnedPage />],
    ['BusinessAssetsPage', <BusinessAssetsPage />],
    ['PreForeclosurePage', <PreForeclosurePage />],
    ['HomeownerHelpPage', <HomeownerHelpPage />],
    ['LivePage', <LivePage />],
    ['FindDealsPage', <FindDealsPage />],
    ['FinancingPage', <FinancingPage />],
    ['ReadingPage', <ReadingPage />],
    ...PROPERTY_TOPICS.map((topic) => [`PropertyTypePage:${topic.slug}`, <PropertyTypePage slug={topic.slug} />] as const),
  ] as const;
  for (const state of STATES) {
    selectState(state.code);
    for (const [name, page] of pages) {
      const root = parse(renderToStaticMarkup(page));
      // State names in location controls are navigation choices, not teaching content.
      for (const selector of ['.state-picker', 'select', '.site-header']) {
        root.querySelectorAll(selector).forEach((element) => element.remove());
      }
      for (const element of ['p', 'li', 'tr'].flatMap((selector) => root.querySelectorAll(selector))) {
        if (mentionsOtherState(state.code, element.text)) {
          leaks.push(`${state.code} ${name}: ${element.text}`);
        }
      }
    }
  }
  expect(leaks).toEqual([]);
});

import { DRILLS } from '../practice/drills';
import { drillState } from './DrillPage';
import { LESSON_CHECKS } from '../lib/lessons/checks';

it('explicitly scopes local quizzes and keeps each drill within its own state', () => {
  for (const checks of Object.values(LESSON_CHECKS)) {
    for (const check of checks) {
      const names = STATES.filter((state) => JSON.stringify(check).includes(state.name));
      if (names.length) expect(check.state, check.q).toBe(names[0].code);
      expect(names.length, check.q).toBeLessThanOrEqual(1);
    }
  }
  for (const drill of DRILLS) {
    expect(mentionsOtherState(drillState(drill) as import('../lib/regions').StateCode | null, JSON.stringify(drill)), drill.id).toBe(false);
  }
});

import { guideDocs, guideIndex } from './guideIndex';
it('keeps searchable snippets local and separates cached indexes by state', () => {
  const indexes = new Set();
  for (const state of STATES) {
    selectState(state.code);
    const docs = guideDocs();
    expect(docs.length).toBeGreaterThan(20);
    for (const doc of docs) expect(mentionsOtherState(state.code, `${doc.page} ${doc.title} ${doc.text}`), doc.href).toBe(false);
    indexes.add(guideIndex());
  }
  expect(indexes.size).toBe(STATES.length);
});
