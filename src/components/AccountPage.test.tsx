import { afterEach, beforeEach, expect, it, vi } from 'vitest';
import { renderToStaticMarkup } from 'react-dom/server';
import { parse } from 'node-html-parser';
beforeEach(()=>{vi.resetModules();vi.stubGlobal('window',{location:{hash:'',pathname:'/account',search:''}});});
afterEach(()=>{vi.unstubAllGlobals();vi.resetModules();});
it('offers only optional first-name/email signup, explicit storage consent and guest continuation when configured',async()=>{
  vi.stubGlobal('fetch',vi.fn().mockResolvedValue({ok:true,json:async()=>({email:true,payments:false,accounts:true})}));
  const features=await import('../lib/siteFeatures'); await features.loadSiteFeatures();
  const Page=(await import('./AccountPage')).default;
  const root=parse(renderToStaticMarkup(<Page/>));
  expect(root.querySelectorAll('input').map(x=>x.getAttribute('type') ?? 'text')).toEqual(['text','email','checkbox']);
  expect(root.querySelector('input[type="file"]')).toBeNull(); expect(root.text).toContain('Continue without an account');
  expect(root.text).toContain('Not saved to your account: notes, your team list (contacts), the cash worksheet, evidence logs, deal packets and written practice answers');
  expect(root.text).toContain('Guest work is not copied into an account automatically');
});
it('shows coming soon without a broken signup form when account saving is disabled',async()=>{
  vi.stubGlobal('fetch',vi.fn().mockResolvedValue({ok:true,json:async()=>({email:true,payments:false,accounts:false})}));
  const features=await import('../lib/siteFeatures'); await features.loadSiteFeatures();
  const Page=(await import('./AccountPage')).default;
  const root=parse(renderToStaticMarkup(<Page/>));
  expect(root.querySelector('form')).toBeNull(); expect(root.querySelector('input')).toBeNull();
  expect(root.text).toContain('Account saving: coming soon'); expect(root.querySelector('a[href="#/toolkit/backup"]')).not.toBeNull();
});
it('lets a learner continue a restored reflection without presenting an invented answer or forcing a rewrite',async()=>{
  const {CHAPTERS,emptyJourney,answerTask,JOURNEY_KEY}=await import('../practice/dealJourney');
  const {projectCloudWork}=await import('../lib/cloudWork');
  const {openWorkspace}=await import('../lib/workStorage');
  const Page=(await import('./DealJourneyPage')).default;
  const c=CHAPTERS.find(c=>c.tasks.some(t=>t.kind==='reflection'))!;
  let p=emptyJourney();
  for(const t of c.tasks) p=answerTask(p,c,t,t.kind==='reflection' ? 'My original private reasoning explains a financial result, risk and qualified professional source.' : t.kind==='choice' ? t.options!.findIndex(o=>o.accepted) : t.kind==='number' ? t.expected! : t.checks!);
  openWorkspace('test-account',projectCloudWork({[JOURNEY_KEY]:p}));
  try {
    const root=parse(renderToStaticMarkup(<Page chapterKey={c.id}/>));
    expect(root.text).toContain('Your self-review completion was saved');
    expect(root.querySelector('.deal-task-next')).not.toBeNull();
    expect(root.text).not.toContain('My original private reasoning');
  } finally {openWorkspace(null);}
});
