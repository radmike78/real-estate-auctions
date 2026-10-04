// "How to read a real one": for the documents a first purchase turns on, who gives it to you and when, the parts
// to find, what you fill in versus what a professional prepares, an example of a good entry or question, what
// changes a deadline or the decision, and how to check a corrected version.
//
// Accuracy rules: general descriptions of common forms, not any state's required form. Federal facts: the Loan
// Estimate and Closing Disclosure layout and timing (CFPB, Regulation Z), title commitment schedules (ALTA
// commitment form), lead disclosure for housing built before 1978 (40 CFR 745 subpart F), and adverse action
// notices (FCRA, FTC guidance for landlords). Forms that create legal obligations get professional review.

export interface DocPart {
  /** The part of the document to find. */
  part: string;
  /** What it tells you, and what to check. */
  look: string;
  /** Who fills it in: you, or a professional. */
  who: string;
  /** A good entry, or a good question about it. */
  example?: string;
}

export interface DocGuide {
  key: string;
  title: string;
  /** Who gives it to you, and when. */
  from: string;
  parts: DocPart[];
  /** What changes a deadline or your decision. */
  changes: string;
  /** How to check a corrected or final version. */
  corrected: string;
}

export const DOC_GUIDES: DocGuide[] = [
  {
    key: 'contract',
    title: 'Purchase contract: price, deposit, contingencies and notices',
    from: 'Your agent fills in your state’s standard purchase form with you, before your offer. It becomes a contract when the seller accepts in writing and the acceptance is delivered to you.',
    parts: [
      { part: 'Price and earnest money', look: 'The price, the deposit amount, who holds it (usually escrow or the title company) and the deadline to deliver it.', who: 'You decide the numbers; your agent writes them in.', example: 'Earnest money: $3,000, to Example Title Co., within 3 business days of acceptance.' },
      { part: 'Acceptance or effective date', look: 'The date most deadlines count from. Find the line that says how it’s set, and write the actual date on your calendar.', who: 'Filled in when the last party signs and delivers.', example: '“Is Day 0 the day the seller signed, or the day the signed acceptance was delivered to me?”' },
      { part: 'Contingency periods', look: 'Inspection (sometimes called due diligence), appraisal, loan and HOA document review: how many days each, counted from what, and whether they’re calendar or business days.', who: 'You choose the periods with your agent’s advice; the form sets defaults.', example: 'Inspection: 10 calendar days from acceptance. Ask what happens when the last day is a weekend.' },
      { part: 'Notice rules', look: 'How a cancellation or request must be given: in writing, on which form, signed, delivered to whom and by when.', who: 'Your agent usually prepares the notice; you sign it.', example: '“If I cancel on the last inspection day, what form do I sign, and by what time must it be delivered?”' },
      { part: 'What happens to the deposit', look: 'When you get it back, and when the seller can keep it.', who: 'Set by the form; changed only by a signed addendum.' },
    ],
    changes: 'Only a signed addendum or amendment changes a deadline, the price or a contingency. A phone call or an email saying “that’s fine” usually doesn’t. Missing a contingency deadline can cost you the right to cancel and your deposit.',
    corrected: 'Read every addendum for the exact change, check that both of you signed and dated it, and update your calendar from the new dates. Keep the full signed set together.',
  },
  {
    key: 'loan-estimate',
    title: 'Loan Estimate, or a lender’s term sheet',
    from: 'For loans covered by federal consumer rules (generally a one- or two-unit home you’ll live in), the lender must give you a Loan Estimate within 3 business days of your application. For a rental you won’t live in, the loan is business credit: ask for a written term sheet with the same facts.',
    parts: [
      { part: 'Page 1: Loan terms', look: 'Loan amount, interest rate, monthly principal and interest, and YES or NO for a prepayment penalty and a balloon payment. At the top: whether the rate is locked, and until when.', who: 'The lender fills it in. You check it against what you asked for.', example: '“My rate isn’t locked yet. What does a lock cost, and how long would it last?”' },
      { part: 'Page 1: Projected payments and cash to close', look: 'The full monthly payment with estimated taxes and insurance, and the estimated cash to close.', who: 'The lender.' },
      { part: 'Page 2: Closing cost details', look: 'Section A, origination charges (the lender’s own fees: compare these between lenders). Section B, services you can’t shop for. Section C, services you can shop for.', who: 'The lender. You compare page 2 side by side between lenders.', example: 'Lender 1: A = $1,450. Lender 2: A = $2,300 with a rate 0.125% lower. Ask how many years until the lower rate pays back the higher fees.' },
      { part: 'Page 3: Comparisons', look: 'The APR and the total interest percentage, for comparing loans of the same amount and type.', who: 'The lender.' },
      { part: 'Term sheet (business loans)', look: 'Rate, points, every fee, the term, any extension and its cost, prepayment penalty, default rate, and how repair money is paid out.', who: 'The lender. Ask for anything missing in writing.' },
    ],
    changes: 'If something changes (the price, the loan amount, your income), the lender can send a revised Loan Estimate. Your loan contingency deadline in the contract doesn’t move unless you sign an addendum.',
    corrected: 'Compare each revised estimate with the last one, line by line. Later, compare the Closing Disclosure with your last Loan Estimate.',
  },
  {
    key: 'title',
    title: 'Title commitment (or preliminary report)',
    from: 'The title company, after the contract is signed and before closing. Your contract usually gives you a set number of days to object to what it shows.',
    parts: [
      { part: 'Schedule A', look: 'The effective date, who owns it now, who will own it (you, in the exact name you’ll take title in), the policy amount and the legal description.', who: 'The title company. You check your name, the price and that the legal description and parcel number match the property.', example: '“My name is spelled wrong, and I’m taking title in my LLC’s name. Please correct Schedule A.”' },
      { part: 'Schedule B, part I: Requirements', look: 'What must happen before the company will close and insure: paying off loans, recording releases of liens, signatures, documents.', who: 'The title company lists them; the seller, lenders and escrow clear most of them.', example: '“How will requirement 2, the 2023 mechanic’s lien, be cleared, and will I get a recorded release?”' },
      { part: 'Schedule B, part II: Exceptions', look: 'What the policy won’t cover: easements, CC&Rs, taxes not yet due, and anything else listed. These stay with the property.', who: 'The title company. You read each one and ask about anything that could affect your plan.', example: '“Do the CC&Rs in exception 4 limit rentals or set a minimum lease term?”' },
    ],
    changes: 'A requirement nobody can clear, or an exception that blocks your plan, is a reason to object or cancel within your contract’s title review period.',
    corrected: 'An updated commitment should show the requirement removed or marked satisfied, with a new effective date. For a lien, ask for the recorded release document.',
  },
  {
    key: 'settlement',
    title: 'Closing Disclosure or settlement statement',
    from: 'For loans covered by federal consumer rules, the lender gives you a Closing Disclosure at least 3 business days before you sign the loan. Escrow or the title company also prepares a settlement statement for every closing, including cash and business-loan purchases.',
    parts: [
      { part: 'Price and loan amount', look: 'They match your contract (and any signed price change) and your final loan approval.', who: 'Escrow and the lender prepare it. You check every line.' },
      { part: 'Credits to you', look: 'Your earnest money deposit, any seller credit you agreed to, and prorated amounts the seller owes you, such as taxes or rent.', who: 'Escrow.', example: '“My $3,000 earnest money isn’t credited. Please correct the statement and send a new one.”' },
      { part: 'Charges', look: 'Lender fees compared with your Loan Estimate, title and escrow fees, recording, prepaid insurance, taxes and HOA.', who: 'Escrow and the lender.' },
      { part: 'Cash to close', look: 'The amount you send. It should equal price − loan + your costs − your credits.', who: 'Escrow. You confirm the amount and the wiring instructions by phone, at a number you already trust.' },
    ],
    changes: 'On a covered loan, a new 3-business-day wait starts if the APR rises beyond a small tolerance, the loan product changes, or a prepayment penalty is added. Other corrections just need a new statement before you sign.',
    corrected: 'Get the corrected version in writing and recheck every line you questioned, plus the cash-to-close total. Never send money to new instructions that arrive by email.',
  },
  {
    key: 'repair-bid',
    title: 'Repair bid and change order',
    from: 'A licensed contractor, after seeing the property and your written scope of work. A change order comes during the job, whenever the work or price changes.',
    parts: [
      { part: 'License and insurance', look: 'The contractor’s license number and proof of insurance. Check the number with your state’s contractor board (Nevada: NSCB; California: CSLB; Arizona: Registrar of Contractors; Utah: DOPL).', who: 'The contractor provides them; you check.' },
      { part: 'Scope', look: 'Each item of work, the materials, what’s excluded, and who gets permits.', who: 'You write the scope; the contractor prices it.', example: 'Replace 30 ft of sewer line from the cleanout to the street connection, including permit, digging and restoring the yard.' },
      { part: 'Price and payment schedule', look: 'The total, and payments tied to finished work, not mostly up front.', who: 'The contractor proposes; you negotiate.', example: '10% to start, 40% when the line is in and inspected, 50% when the yard is restored and the permit is signed off.' },
      { part: 'Lien releases', look: 'A release from the contractor and major suppliers each time you pay, so nobody can lien your property for work you already paid for.', who: 'The contractor provides them; you ask for each one before the next payment.' },
    ],
    changes: 'Any change in the work, the price or the timeline goes in a written change order signed by both of you before the extra work starts.',
    corrected: 'Compare the change order with the original bid: the new total, the new finish date, and what work it adds or removes.',
  },
  {
    key: 'lease',
    title: 'Lease and lead disclosure',
    from: 'You (or your property manager) provide them before the tenant signs. Use a lease written for your state, ideally reviewed by a local attorney.',
    parts: [
      { part: 'Names, term and rent', look: 'Every adult on the lease, the start and end dates, the rent, the due date, and any late fee your state allows.', who: 'You fill these in.', example: '12-month lease from June 1; rent $2,150 due on the 1st. Check your state’s rules before setting a late fee.' },
      { part: 'Deposit', look: 'The amount (some states cap it), where it’s held, and how and when it’s returned.', who: 'You, within your state’s limits.' },
      { part: 'Entry, repairs and HOA rules', look: 'How much notice you give before entering, how repairs are requested, who pays which utilities, and the HOA rules the tenant must follow.', who: 'You, following your state’s law and your HOA’s rules.' },
      { part: 'Lead disclosure (homes built before 1978)', look: 'Before the lease is signed: give the EPA pamphlet, disclose any known lead-based paint and any reports, and include the lead warning statement. Both of you sign the disclosure.', who: 'You provide it; the tenant signs to acknowledge it.' },
    ],
    changes: 'A renewal or a change in rent, terms or tenants is a signed amendment or a new lease. Keep the signed lead disclosure for at least 3 years from the start of the lease.',
    corrected: 'Read the signed copy for every blank filled in, every page initialed where required, and all signatures. Give the tenant a copy.',
  },
  {
    key: 'adverse-action',
    title: 'Adverse action notice (tenant screening)',
    from: 'You give it to an applicant when information in a consumer report leads you to deny them, or to ask for a cosigner, a bigger deposit or higher rent.',
    parts: [
      { part: 'Who made the report', look: 'The name, address and phone number of the consumer reporting company.', who: 'You fill it in from the report.' },
      { part: 'Who decided', look: 'A statement that the reporting company didn’t make the decision and can’t explain why it was made.', who: 'Standard wording you include.' },
      { part: 'The applicant’s rights', look: 'Their right to a free copy of the report if they ask within 60 days, and to dispute anything inaccurate or incomplete with the reporting company.', who: 'Standard wording you include.' },
      { part: 'Credit score', look: 'If you used a credit score, the score and the key factors that affected it.', who: 'You fill it in from the report.' },
    ],
    changes: 'Apply the same written screening criteria to every applicant, and follow fair housing law. If the reason came from someone other than a reporting company, such as a former landlord you called, a different notice applies: tell the applicant they can ask, within 60 days, what that information was.',
    corrected: 'Keep a copy of the notice, the criteria you applied, and the date you gave it.',
  },
];

export const docGuide = (key: string) => DOC_GUIDES.find((g) => g.key === key);
