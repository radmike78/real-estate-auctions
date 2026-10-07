import { describe, expect, it } from 'vitest';
import { AZ_CASE, CA_CASE, N, NV_CASE, payment, RENTAL_CASE, TX_CASE, UT_CASE, caseFor, caseResume, tasksFor } from './rentalCase';
import { firstOpenStage } from './progress';
import { cleanCase } from './caseProgress';

describe('Buy a rental, start to finish', () => {
  it('keeps its numbers consistent from step to step', () => {
    expect(N.investable).toBe(142_000 - 31_200 - 8_000);
    expect(payment(216_750)).toBe(1406);
    expect(payment(210_000)).toBe(1362);
    expect(N.cashOffer).toBe(72_250 + 8_400 + 6 * (1406 + 142 + 90 + 45));
    expect(N.loanFinal).toBe(210_000);
    expect(N.cashToClose).toBe(280_000 - 210_000 + 8_400 - 3_000);
    expect(N.cashFlow).toBe(2150 - 3 * 108 - 142 - 90 - 45 - 1362);
    // The finished deal fits inside the cash you said you could invest.
    expect(N.cashFinal).toBeLessThanOrEqual(N.investable);
    expect(N.cashRenegotiated).toBeLessThanOrEqual(N.investable);
    // But paying for the repairs at the first price would leave almost nothing: that's the lesson of the inspection.
    expect(N.investable - N.cashOffer - N.urgent).toBeLessThan(2_000);
  });

  it('has unique ids, a reasonable answer to every decision, and right options in every multi-select', () => {
    const stages = new Set<string>();
    for (const st of RENTAL_CASE) {
      expect(stages.has(st.key), st.key).toBe(false);
      stages.add(st.key);
      const ids = st.tasks.map((t) => t.id);
      expect(new Set(ids).size, st.key).toBe(ids.length);
      expect(st.log.length, st.key).toBeGreaterThan(0);
      for (const t of st.tasks) {
        if (t.kind === 'choice') {
          expect(t.choices.some((c) => c.verdict === 'best' || c.verdict === 'ok'), t.id).toBe(true);
          for (const c of t.choices) if (c.walk) expect(c.verdict, t.id).not.toBe('poor');
        }
        if (t.kind === 'multi') expect(t.options.some((o) => o.right), t.id).toBe(true);
        if (t.kind === 'number') expect(t.worked.length, t.id).toBeGreaterThan(0);
      }
    }
  });

  it('names Nevada wherever it uses a Nevada rule', () => {
    for (const st of RENTAL_CASE)
      for (const t of st.tasks)
        if (t.kind === 'choice')
          for (const c of t.choices) if (/NRS /.test(c.why)) expect(`${t.prompt} ${c.why}`, t.id).toMatch(/Nevada/);
  });

  it('cleans stored progress', () => {
    expect(cleanCase(null)).toEqual({ done: [], answers: {}, first: {} });
    expect(cleanCase({ done: ['a/b', 5], answers: { x: 1, y: 'hi', z: [1, 2], bad: { a: 1 } }, first: { x: 'best', y: 'nope' }, walked: 'offer' })).toEqual({
      done: ['a/b'],
      answers: { x: 1, y: 'hi', z: [1, 2] },
      first: { x: 'best' },
      walked: 'offer',
    });
  });
});

describe('the deal packet', () => {
  it('reports a walk-away without claiming a purchase, and keeps what you found', async () => {
    const { packetSections } = await import('../components/RentalCasePage');
    const done = RENTAL_CASE.flatMap((s) => s.tasks.map((t) => `${s.key}/${t.id}`));
    const walked = packetSections({ done, answers: {}, first: {}, walked: 'inspection' });
    const result = walked.find((s) => s.title === 'Result')!.rows.join(' ');
    expect(result).toMatch(/walked away/);
    expect(result).not.toMatch(/You bought it/);
    expect(walked.find((s) => s.title === 'Your budget')!.rows.join(' ')).not.toMatch(/Cash the deal took/);
    const log = walked.find((s) => s.title === 'Evidence log')!.rows.join(' ');
    expect(log).toMatch(/Sewer/);
    expect(log).not.toMatch(/^Price:|Renegotiated|Appraised at|mechanic/);
  });

  it('survives an out-of-range stored answer', async () => {
    const { packetSections } = await import('../components/RentalCasePage');
    expect(() => packetSections({ done: [], answers: { 'cash/stretch': 99, 'listing/screen': 1.5 }, first: {} })).not.toThrow();
  });
});

describe('the counteroffer path', () => {
  it('asks about the counter only after a lower offer, and logs the opening offer and the counter', async () => {
    const { tasksFor } = await import('./rentalCase');
    const { packetSections } = await import('../components/RentalCasePage');
    const offer = RENTAL_CASE.find((s) => s.key === 'offer')!;
    expect(tasksFor(offer, { 'offer/price': 0 }).some((t) => t.id === 'countered')).toBe(false);
    expect(tasksFor(offer, { 'offer/price': 1 }).some((t) => t.id === 'countered')).toBe(true);
    const done = RENTAL_CASE.slice(0, RENTAL_CASE.indexOf(offer) + 1).flatMap((s) => s.tasks.map((t) => `${s.key}/${t.id}`));
    const packet = packetSections({ done, answers: { 'offer/price': 1, 'offer/countered': 0 }, first: {} });
    const log = packet.find((s) => s.title === 'Evidence log')!.rows.join(' ');
    expect(log).toMatch(/Opened at \$275,000/);
    expect(log).toMatch(/countered at \$289,000\. You accepted/);
  });

  it('a walk-away before the contract is signed claims no contract, deposit or deadlines', async () => {
    const { packetSections } = await import('../components/RentalCasePage');
    const offer = RENTAL_CASE.find((s) => s.key === 'offer')!;
    const done = RENTAL_CASE.slice(0, RENTAL_CASE.indexOf(offer)).flatMap((s) => s.tasks.map((t) => `${s.key}/${t.id}`)).concat(['offer/price', 'offer/signed', 'offer/countered']);
    const packet = packetSections({ done, answers: { 'offer/price': 1, 'offer/countered': 2 }, first: {}, walked: 'offer' });
    const all = packet.map((s) => s.rows.join(' ')).join(' ');
    expect(all).toMatch(/No contract was signed/);
    expect(all).not.toMatch(/Signed at|earnest money\./i);
    expect(packet.find((s) => s.title === 'Deadline calendar')!.rows[0]).toMatch(/^Not yet/);
  });

  it('the loan sheet never says the down payment is 25% of the lower value', () => {
    const loan = RENTAL_CASE.find((s) => s.key === 'loan')!;
    expect(JSON.stringify(loan)).not.toMatch(/25% of the price or the appraised value/);
  });
});

describe('walk-aways follow the answers', () => {
  it('finds the step whose showing answer walks away, and ignores hidden ones', async () => {
    const { walkedFrom } = await import('./rentalCase');
    expect(walkedFrom({ 'offer/price': 1, 'offer/countered': 2 })).toBe('offer');
    // Back to $289,000: the counteroffer (and its walk-away) is no longer showing.
    expect(walkedFrom({ 'offer/price': 0, 'offer/countered': 2 })).toBeUndefined();
  });

  it('asking for repairs leads to the seller’s price offer, not the price-cut reply', async () => {
    const { tasksFor } = await import('./rentalCase');
    const insp = RENTAL_CASE.find((s) => s.key === 'inspection')!;
    const ids = (a: number) => tasksFor(insp, { 'inspection/respond': a }).map((t) => t.id);
    expect(ids(0)).toContain('counter');
    expect(ids(0)).not.toContain('repairs-reply');
    expect(ids(2)).toContain('repairs-reply');
    expect(ids(2)).not.toContain('counter');
  });
});

describe('known replacements', () => {
  it('budgets the roof and water heater, and the cash flow reflects it', () => {
    expect(N.replaceMonthly).toBe(325);
    expect(N.cashFlowWithReplacements).toBe(N.cashFlow - (N.replaceMonthly - N.setAside));
  });
});

describe('the Texas practice house', () => {
  const T = TX_CASE.N;
  it('keeps its numbers consistent, with the full Texas tax bill and Texas rents', () => {
    expect(T.tax).toBe(506); // $6,072 a year, no homestead exemption
    expect(T.rent).toBe(2_500);
    expect(T.cashOffer).toBe(72_250 + 8_400 + 6 * (1406 + 506 + 180 + 45));
    expect(T.cashFlow).toBe(2500 - 3 * 125 - 506 - 180 - 45 - 1362);
    expect(T.cashFinal).toBeLessThanOrEqual(T.investable);
    expect(T.cashRenegotiated).toBeLessThanOrEqual(T.investable);
    expect(T.investable - T.cashOffer - T.urgent).toBeGreaterThan(0);
    expect(T.investable - T.cashOffer - T.urgent).toBeLessThan(3_000);
  });

  it('uses Texas rules and names Texas wherever it does, with no Nevada rule left in', () => {
    const text = JSON.stringify(TX_CASE.stages);
    expect(text).not.toMatch(/NRS |Henderson|business days|contingenc(y|ies) (ends|protects)/);
    expect(text).toMatch(/option period/);
    expect(text).toMatch(/homestead exemption/);
    for (const st of TX_CASE.stages)
      for (const t of st.tasks)
        if (t.kind === 'choice')
          for (const c of t.choices) if (/Property Code|Tax Code/.test(c.why)) expect(`${t.prompt} ${c.label} ${c.why}`, t.id).toMatch(/Texas/);
    const keys = TX_CASE.stages.map((s) => s.key);
    expect(keys).toEqual(RENTAL_CASE.map((s) => s.key));
    expect(caseFor('TX')).toBe(TX_CASE);
    expect(caseFor(null).state).toBe('NV');
  });
});

describe('the replacement decision comes at the inspection', () => {
  it('asks for the roof and water-heater budget before the inspection deadline, and the honest answer is not a profit', async () => {
    const { caseFor } = await import('./rentalCase');
    for (const st of ['NV', 'TX', 'CA', 'AZ', 'UT'] as const) {
      const c = caseFor(st);
      const insp = c.stages.find((s) => s.key === 'inspection')!;
      const ids = insp.tasks.map((t) => t.id);
      expect(ids.indexOf('replace-now'), st).toBeGreaterThanOrEqual(0);
      expect(ids.indexOf('replace-fit'), st).toBeLessThan(ids.indexOf('respond'));
      // Budgeting the known replacements takes the offer-price cash flow below what the 5% set-aside shows.
      expect(c.N.cashFlowAtOfferWithReplacements, st).toBeLessThan(c.N.cashFlowAtOffer);
      expect(c.N.cashFlowAtOfferWithReplacements, st).toBeLessThan(100);
      const fit = insp.tasks.find((t) => t.id === 'replace-fit')!;
      if (fit.kind !== 'choice') throw new Error('expected a choice');
      expect(fit.choices.some((ch) => ch.walk && ch.verdict !== 'poor'), st).toBe(true);
      expect(fit.choices.find((ch) => /^Go ahead: it (makes|only loses) about/.test(ch.label))!.verdict, st).toBe('poor');
    }
  });
});

describe('the California, Arizona and Utah practice houses', () => {
  const cases = [
    { c: CA_CASE, name: 'California', city: 'Bakersfield', law: /Civil Code|Proposition 13/, must: [/contingency removal/, /Proposition 13/, /1950\.5/, /Tenant Protection Act/] },
    { c: AZ_CASE, name: 'Arizona', city: 'Tucson', law: /A\.R\.S\./, must: [/inspection period/, /BINSR/, /33-1321/, /33-1902/, /15-972/] },
    { c: UT_CASE, name: 'Utah', city: 'Ogden', law: /Utah Code/, must: [/Due Diligence Deadline/, /Financing & Appraisal Deadline/, /59-2-103/, /57-17-3/] },
  ];
  for (const { c, name, city, law, must } of cases) {
    it(`${name}: numbers add up, the cash fits, and the rent covers the costs before big replacements`, () => {
      const n = c.N;
      expect(c.state).toBe(c.state.toUpperCase());
      expect(n.pitiaOffer).toBe(n.piOffer + n.tax + n.insurance + n.hoa);
      expect(n.cashFlow).toBe(n.rent - 3 * n.setAside - n.tax - n.insurance - n.hoa - n.piFinal);
      expect(n.cashFlow).toBeGreaterThan(0);
      expect(n.cashFinal).toBeLessThanOrEqual(n.investable);
      expect(n.cashRenegotiated).toBeLessThanOrEqual(n.investable);
      expect(n.investable - n.cashOffer - n.urgent).toBeGreaterThan(0);
      expect(n.investable - n.cashOffer - n.urgent).toBeLessThan(3_000);
    });

    it(`${name}: uses ${name}'s rules, names ${name} wherever it cites one, and keeps no other state's`, () => {
      const text = JSON.stringify(c.stages);
      expect(text).not.toMatch(/NRS |Henderson|Round Rock|option period|TREC|Texas|Property Code|homestead/);
      expect(text).toContain(city);
      for (const m of must) expect(text).toMatch(m);
      for (const st of c.stages)
        for (const t of st.tasks)
          if (t.kind === 'choice')
            for (const ch of t.choices) if (law.test(ch.why)) expect(`${t.prompt} ${ch.label} ${ch.why}`, t.id).toContain(name);
      expect(c.stages.map((s) => s.key)).toEqual(RENTAL_CASE.map((s) => s.key));
      expect(caseFor(c.state)).toBe(c);
    });
  }
});

describe('the final packet follows the reserve you chose', () => {
  const all = (c: typeof TX_CASE) => c.stages.flatMap((s) => s.tasks.map((t) => `${s.key}/${t.id}`));
  it('Texas, with the researched $325 reserve: leads with −$168, labels +$32 as the earlier assumption, and says the goal is missed', async () => {
    const { packetSections, packetText } = await import('../components/RentalCasePage');
    const p = { done: all(TX_CASE), answers: { 'run/replacement-plan': 0, 'inspection/replace-fit': 0, 'inspection/respond': 0, 'inspection/counter': 0 }, first: {} };
    const secs = packetSections(p, TX_CASE);
    const budget = secs.find((s) => s.title === 'Your budget')!.rows;
    expect(TX_CASE.N.cashFlowWithReplacements).toBe(-168);
    expect(budget[0]).toMatch(/about −\u2060?\$168\. The \$32 figure was the earlier generic assumption/);
    expect(budget[1]).toMatch(/doesn’t meet it yet.*short by about \$168 a month.*fund that shortfall/);
    expect(budget.join(' ')).toMatch(/not a replacement plan/);
    expect(budget.join(' ')).not.toMatch(/Left beyond the reserves/);
    const result = secs.find((s) => s.title === 'Result')!.rows[0];
    expect(result).toMatch(/misses your goal/);
    expect(result).toMatch(/−\u2060?\$168/);
    expect(result).not.toMatch(/kept your reserves/);
    // The text download (and print, which renders the same sections) says the same.
    const text = packetText(p, TX_CASE);
    expect(text).toContain(budget[0]);
    expect(text).toContain(result);
  });

  it('keeping the 5% set-aside shows +$32 only as an assumption, next to the real −$168', async () => {
    const { packetSections } = await import('../components/RentalCasePage');
    const done = all(TX_CASE).filter((k) => k !== 'run/replacement-plan' && k !== 'inspection/replace-now');
    const budget = packetSections({ done, answers: { 'run/replacement-plan': 1 }, first: {} }, TX_CASE).find((s) => s.title === 'Your budget')!.rows;
    expect(budget[0]).toMatch(/generic 5% set-aside.*about \$32\. That’s an assumption, not a plan.*about −\u2060?\$168/);
    expect(budget[1]).toMatch(/doesn’t meet it yet/);
  });

  it('every state’s packet leads with the cash flow after its known replacements', async () => {
    const { cashFlowResult, packetSections } = await import('../components/RentalCasePage');
    for (const c of [caseFor('NV'), TX_CASE, CA_CASE, AZ_CASE, UT_CASE]) {
      const p = { done: all(c), answers: { 'run/replacement-plan': 0 }, first: {} };
      const r = cashFlowResult(p, c);
      expect(r.researched, c.state).toBe(true);
      expect(r.monthly, c.state).toBe(c.N.cashFlowWithReplacements);
      expect(r.goalMet, c.state).toBe(c.N.cashFlowWithReplacements >= 0);
      const budget = packetSections(p, c).find((s) => s.title === 'Your budget')!.rows;
      expect(budget[0], c.state).toContain(`about ${c.N.cashFlowWithReplacements < 0 ? '−\u2060' : ''}$${Math.abs(c.N.cashFlowWithReplacements)}.`);
      const op = c.stages.find((s) => s.key === 'run')!.log[0].finding;
      expect(op.indexOf('earlier generic assumption'), c.state).toBeGreaterThan(op.indexOf('With the roof'));
    }
  });

  it('the final best answer names the monthly gap the packet shows, in every state', () => {
    for (const c of [caseFor('NV'), TX_CASE, CA_CASE, AZ_CASE, UT_CASE]) {
      const q = c.stages.flatMap((s) => s.tasks).find((t) => t.kind === 'choice' && t.id === 'good-deal');
      const best = q && q.kind === 'choice' ? q.choices.find((x) => x.verdict === 'best')!.label : '';
      expect(c.N.cashFlowWithReplacements, c.state).toBeLessThan(0);
      expect(best, c.state).toContain(`add about $${-c.N.cashFlowWithReplacements} a month`);
      expect(best, c.state).not.toMatch(/manager/);
    }
  });
});

describe('the Texas contract teaching (TREC 20-19 paragraph 5, 40-11 paragraph 2, 49-1 option 3)', () => {
  const offer = TX_CASE.stages.find((s) => s.key === 'offer')!;
  const rows = offer.docs[0].rows!.map(([a, b]) => `${a}: ${b}`).join('\n');
  const dates = offer.dates!.map((d) => `${d.when}: ${d.what}`).join('\n');
  it('keeps Buyer Approval and Property Approval apart, each with notice and the lender’s statement', () => {
    expect(rows).toMatch(/Buyer Approval \(addendum 40-11, paragraph 2A\).*Day 21.*written statement/);
    expect(rows).toMatch(/Property Approval \(addendum 40-11, paragraph 2B\).*3rd day before closing, Day 27.*written statement/);
    expect(dates).toMatch(/Day 21: .*Buyer Approval/);
    expect(dates).toMatch(/Day 27 \(the 3rd day before closing\): .*Property Approval/);
    expect(dates).not.toMatch(/won’t approve the loan/);
  });
  it('names the appraisal copy, the seller and Day 17 for option 3', () => {
    expect(dates).toMatch(/Day 17: Appraisal addendum \(49-1, option 3\).*copy of the appraisal to the seller/);
    const appr = TX_CASE.stages.find((s) => s.key === 'appraisal')!;
    const t = appr.tasks.find((x) => x.id === 'tx-appraisal-notice')!;
    if (t.kind !== 'multi') throw new Error('expected a multi');
    expect(t.options.filter((o) => o.right).map((o) => o.label).join(' ')).toMatch(/notice of termination.*copy of the lender’s appraisal/);
    expect(JSON.stringify(appr)).toMatch(/copy of the lender’s appraisal/);
  });
  it('gives late earnest money and a late option fee their own consequences, and the weekend extension only for payments', () => {
    expect(rows).toMatch(/earnest money is late \(paragraph 5C\).*seller can end the contract/);
    expect(rows).toMatch(/option fee is late \(paragraph 5D\).*no option period/);
    expect(rows).toMatch(/Saturday, Sunday or legal holiday/);
    expect(rows).toMatch(/extension for payments doesn’t move this deadline/);
    expect(dates).not.toMatch(/Miss it and you lose the option period/);
  });
  it('asks the Day 20 vs Day 25 question', () => {
    const t = offer.tasks.find((x) => x.id === 'tx-approval')!;
    if (t.kind !== 'choice') throw new Error('expected a choice');
    expect(t.choices.find((c) => c.verdict === 'best')!.label).toMatch(/Property Approval.*Day 27/);
    expect(t.ifDifferent).toMatch(/Day 20.*Buyer Approval.*Day 21/);
  });
});

describe('Arizona: answering the seller’s reply to the BINSR', () => {
  const insp = AZ_CASE.stages.find((s) => s.key === 'inspection')!;
  it('gives one deadline (Day 13) for accepting and for cancelling, in both replies', async () => {
    const { tasksFor } = await import('./rentalCase');
    for (const [a, id] of [[0, 'counter'], [2, 'repairs-reply']] as const) {
      const t = tasksFor(insp, { 'inspection/respond': a }).find((x) => x.id === id)!;
      const text = JSON.stringify(t);
      expect(text).toMatch(/by Day 13/);
      expect(text).not.toMatch(/before Day 10/);
      if (t.kind === 'choice') expect(t.choices.find((c) => c.walk)!.label).toBe('Cancel in writing by Day 13.');
    }
    expect(insp.outcome).toMatch(/by the repair-reply deadline \(5 days after the seller’s answer\)/);
    expect(insp.log.find((l) => l.area === 'Price')!.finding).toMatch(/by the repair-reply deadline/);
    const all = AZ_CASE.stages.flatMap((s) => s.dates ?? []).map((d) => d.when);
    expect(all).toContain('5 days after the seller answers your BINSR');
  });
  it('leaves the other states’ Day 10 wording alone', () => {
    for (const c of [caseFor('NV'), CA_CASE, UT_CASE]) {
      const i = c.stages.find((s) => s.key === 'inspection')!;
      expect(i.outcome).toMatch(/before Day 10/);
      expect(i.log.find((l) => l.area === 'Price')!.finding).toMatch(/before the /);
    }
  });
});

describe('what walking away inside a contract deadline keeps', () => {
  it('Texas: the earnest money comes back, the seller keeps the option fee', async () => {
    const { walkNote } = await import('./rentalCase');
    expect(walkNote('inspection', TX_CASE)).toBe('You left inside a contract deadline, so your $2,800 earnest money comes back; the seller keeps the $200 option fee.');
    expect(TX_CASE.N.earnest - 200).toBe(2_800);
    expect(walkNote('offer', TX_CASE)).toBe('No contract was signed, so nothing was at risk.');
    expect(walkNote('appraisal', AZ_CASE)).toBe('You left inside a contract deadline, so you keep your earnest money.');
  });
});

describe('where "Continue the purchase" goes', () => {
  it('counts only the questions your answers show, and ends at the deal packet', () => {
    const stages = NV_CASE.stages;
    expect(caseResume(stages, { done: [], answers: {} })).toEqual({ key: stages[0].key, packet: false });
    // Every visible task done (conditional questions your answers hide don't count): the packet.
    const answers: Record<string, unknown> = {};
    const done = stages.flatMap((st) => tasksFor(st, answers).map((t) => `${st.key}/${t.id}`));
    expect(stages.some((st) => st.tasks.length > tasksFor(st, answers).length)).toBe(true);
    expect(caseResume(stages, { done, answers })).toEqual({ key: 'packet', packet: true });
    // One step left open: that step.
    const third = stages[2];
    const partial = done.filter((k) => !k.startsWith(`${third.key}/`));
    expect(caseResume(stages, { done: partial, answers })).toEqual({ key: third.key, packet: false });
    // After walking away, the packet is the result.
    expect(caseResume(stages, { done: partial.slice(0, 3), answers, walked: stages[1].key })).toEqual({ key: 'packet', packet: true });
  });
});

describe('where "Continue practicing" goes', () => {
  it('opens the first step with a card still open, or none when all are done', () => {
    const stages = [{ key: 'a', tasks: [{ id: '1' }, { id: '2' }] }, { key: 'b', tasks: [{ id: '1' }] }];
    expect(firstOpenStage(stages, [])?.key).toBe('a');
    expect(firstOpenStage(stages, ['a/1', 'a/2'])?.key).toBe('b');
    expect(firstOpenStage(stages, ['b/1'])?.key).toBe('a');
    expect(firstOpenStage(stages, ['a/1', 'a/2', 'b/1'])).toBeNull();
  });
});
