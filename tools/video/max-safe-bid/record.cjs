// On-screen steps for the "maximum safe bid" video. Each block starts at its narration segment
// (START[i]) and the offsets inside it follow what the voiceover is saying at that moment.
const { record } = require('../lib/recorder.cjs');

record(__dirname, async (v) => {
  const { page: p, START, DUR, at, field, hl, hlBox, typeInto } = v;

  await v.goto('calculator');
  await p.waitForTimeout(300);
  await v.card(`<div><div class="k">Forced-Sale Finder · Clark County, NV</div><h1>Your <span>maximum safe bid</span></h1><p>Know your number, and when to stop bidding.</p></div>`);
  await p.waitForTimeout(700);
  await v.start();

  // 1. Intro: title card, then reveal the calculator.
  await at(START[0] + 5.2);
  await v.card(null);
  await at(START[0] + 7.5);
  await v.scrollTo(260);

  // 2. Resale value and cost to sell.
  await at(START[1] + 0.2);
  await typeInto('Resale value after repairs', 350000);
  await at(START[1] + 9.2);
  await typeInto('Cost to sell', 8, 200);

  // 3. Costs you take on.
  await at(START[2] + 1.6);
  await typeInto('Repairs', 45000);
  await p.waitForTimeout(500);
  await typeInto('Repair contingency', 15, 200);
  await at(START[2] + 8.6);
  await hl(field('Liens that stay with the property'));
  await at(START[2] + 11.4);
  await typeInto('Title search, attorney, quiet title', 3500);
  await at(START[2] + 14.8);
  await typeInto('Getting possession', 2500);

  // 4. Holding and financing.
  await at(START[3] + 1.2);
  await typeInto('Months until sold', 6, 200);
  await at(START[3] + 3.6);
  await typeInto('Monthly holding costs', 950);
  await at(START[3] + 7.0);
  await hl(field('Share financed after purchase'));

  // 5. Target profit, then the answer (scroll up so the sticky results panel is in view).
  await at(START[4] + 0.2);
  await typeInto('Profit you require', 15, 200);
  await at(START[4] + 3.0);
  await v.clearHighlight();
  await v.scrollTo(250);
  await p.waitForTimeout(700);
  await hlBox(p.locator('.calc-max'));
  await at(START[4] + 7.8);
  await hlBox(p.locator('.calc-results .calc-kv').first());

  // 6. Check a bid above the maximum, then the stress table.
  await at(START[5] + 0.2);
  const max = Number((await p.locator('.calc-max strong').innerText()).replace(/[^0-9]/g, ''));
  await typeInto('Check a bid', Math.ceil((max + 15000) / 1000) * 1000, 120);
  await at(START[5] + 3.4);
  await hl(p.locator('.calc-verdict'));
  await at(START[5] + 7.6);
  await hl(p.locator('.calc-stress'));

  // 7. A property page, with the calculator already filled in.
  await at(START[6] + 0.2);
  await v.clearHighlight();
  await v.goto(process.env.PROPERTY_ID ? `property/${process.env.PROPERTY_ID}` : 'property/p45');
  await v.badge(process.env.PROPERTY_ID ? null : 'Sample property');
  await p.waitForTimeout(1600);
  await p.locator('a.drill-tile', { hasText: 'Your maximum bid' }).first().click();
  await p.waitForTimeout(700);
  await v.badge(process.env.PROPERTY_ID ? null : 'Sample property');
  await v.scrollTo(330);
  await at(START[6] + 8.2);
  await hlBox(p.locator('.calc-max'));
  await at(START[6] + DUR[6] + 0.3);
  await v.clearHighlight();
  await v.badge(null);
  await v.card(`<div><div class="k">Free · No sign-up · Clark County, NV</div><h1>Set your limit.<br><span>Be ready to walk away.</span></h1><p>Forced-Sale Finder</p></div>`);
}).catch((e) => {
  console.error(e);
  process.exit(1);
});
