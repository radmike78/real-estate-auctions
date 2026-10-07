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
  /** State rules for this part, shown first ("In Texas, ..." sentences are filtered to the chosen state). */
  rules?: string;
  /** What to do, in order, shown as a numbered list. */
  steps?: string[];
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
      { part: 'Price and earnest money', look: 'The price, the deposit amount, who holds it (usually escrow or the title company) and the deadline to deliver it.', who: 'You decide the numbers; your agent writes them in.', example: 'Example only: “Earnest money: $3,000, to Example Title Co., within 3 business days of acceptance.” Your signed contract sets the real deadline and how days are counted: the Texas TREC contract, for example, says within 3 days after the effective date.' },
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
    from: 'For loans covered by federal consumer rules (generally a home for personal use: a one- or two-unit home you’ll live in, or a second home you won’t rent out), the lender must give you a Loan Estimate within 3 business days of your application. For a rental you won’t live in, the loan is business credit: ask for a written term sheet with the same facts.',
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
      { part: 'Requirements (Schedule B, part I)', look: 'What must happen before the company will close and insure: paying off loans, recording releases of liens, signatures, documents.', rules: 'In Utah, the REPC makes the title commitment one of the Seller Disclosures, due by the Seller Disclosure Deadline. Object or cancel over it by the Due Diligence Deadline (REPC 6.1, 7(c), 8.1). In Texas, the T-7 commitment lists the requirements on Schedule C.', who: 'The title company lists them; the seller, lenders and escrow clear most of them.', example: '“How will requirement 2, the 2023 mechanic’s lien, be cleared, and will I get a recorded release?”' },
      { part: 'Exceptions (Schedule B, part II)', look: 'What the policy won’t cover: easements, CC&Rs, taxes not yet due, and anything else listed. These stay with the property.', rules: 'In Texas, the T-7 commitment lists the exceptions on Schedule B.', who: 'The title company. You read each one and ask about anything that could affect your plan.', example: '“Do the CC&Rs in exception 4 limit rentals or set a minimum lease term?”' },
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
    from: 'A qualified contractor (licensed where your state or the trade requires it), after seeing the property and your written scope of work. A change order comes during the job, whenever the work or price changes.',
    parts: [
      { part: 'License and insurance', look: 'Any license or registration the work requires (state trade licenses, city registration), and proof of insurance. Check each number on the official lookup. In Nevada, check it with the contractors board (NSCB). In California, check it with the CSLB. In Arizona, check it with the Registrar of Contractors. In Utah, check it with DOPL. In Texas, there’s no statewide license for general contractors or remodelers, but electricians and air-conditioning contractors need a TDLR license, plumbers need one from the State Board of Plumbing Examiners, and your city may require registration and permits.', who: 'The contractor provides them; you check.' },
      { part: 'Scope', look: 'Each item of work, the materials, what’s excluded, and who gets permits.', who: 'You write the scope; the contractor prices it.', example: 'Replace 30 ft of sewer line from the cleanout to the street connection, including permit, digging and restoring the yard.' },
      { part: 'Price and payment schedule', look: 'The total, and payments tied to finished work, not mostly up front. Some states cap the down payment: in California, a home improvement down payment can’t be more than $1,000 or 10% of the price, whichever is less (Business and Professions Code 7159). Ask your state’s contractor licensing agency for its rules. In Texas, there’s no state agency for general contractors, so ask your city.', who: 'The contractor proposes; you negotiate.', example: 'On a $7,500 sewer job: $750 to start (in California, that’s the most allowed: 10% of $7,500, which is less than $1,000), then payments when the line is in and inspected, and the rest when the yard is restored and the permit is signed off.' },
      { part: 'Lien releases', look: 'Releases (also called lien waivers) lower your risk; they don’t make a lien impossible. Anyone on the job who isn’t paid may be able to lien your property: the contractor, subcontractors, suppliers, equipment renters and laborers.', rules: 'Use the release forms your state requires. In Nevada, releases must be in the statutory forms in NRS 108.2457. In California, a release has to be substantially in the statutory forms in Civil Code 8132 to 8138, or it doesn’t release your property (Civil Code 8124). In Arizona, releases must substantially follow the four statutory forms in A.R.S. 33-1008. In Utah, use the statutory waiver forms in Utah Code 38-1a-802. In Texas, a release is unenforceable unless it substantially follows the statutory forms in Property Code 53.284.', steps: ['Before work starts, ask the contractor for a list of everyone working on or supplying the job, and keep any preliminary notices (notices of a right to lien) that subs and suppliers send you.', 'With each payment request, get a conditional release from the contractor, and from each sub or supplier that payment covers, for that amount and the work through that date. It takes effect only once the payment actually clears.', 'Pay, trading your check for the conditional releases.', 'Once the funds clear, get the unconditional release, which says the money was received.', 'Read each release for who signed it, the amount, the dates and any exceptions, and check the names against your list.', 'At the end, get final releases from the contractor and every sub and supplier with the last payment. Before that payment, ask your title company or an attorney whether anyone could still file a lien.'], who: 'The contractor collects them from its subs and suppliers; you ask for each one before the next payment and check the names against the list.', example: 'Paying a $3,000 progress draw: a conditional progress release from the contractor for $3,000 with your check, an unconditional one once the check clears, and releases from the plumbing sub and the pipe supplier for the part of that draw that pays them.' },
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
      { part: 'Deposit', look: 'The amount (Nevada caps it at 3 months’ rent; California at 1 month for most landlords; Arizona at 1½ months; Utah sets no cap, and the refund is due within 30 days after the tenant moves out (Utah Code 57-17-3); Texas sets no cap; it requires the refund within 30 days after the tenant surrenders the home, but not until the tenant gives a written forwarding address, under Property Code 92.103 and 92.107), where it’s held, and how and when it’s returned.', who: 'You, within your state’s limits.' },
      { part: 'Entry, repairs and HOA rules', look: 'How much notice you give before entering (Nevada: 24 hours; California: 24 hours in writing; Arizona: 2 days; Utah: 24 hours unless the lease says otherwise; Texas: no notice rule in Property Code chapter 92, so put one in the lease), how repairs are requested, who pays which utilities, and the HOA rules the tenant must follow.', who: 'You, following your state’s law and your HOA’s rules.' },
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
      { part: 'Screening report vs. credit score', look: 'A screening or credit report is the file of records. A credit score is a number a model calculates from it. If you used only the report, the parts above are enough. If you used a score, the score parts below are required too.', who: 'You, from what the reporting company sent you.' },
      { part: 'Credit score (when you used one)', look: 'In writing or electronically, not just by phone: the score, who provided it, the date it was created, the range of possible scores under that model, and the key factors that hurt it, in order of importance.', who: 'You fill it in from the score disclosure the reporting company gives you.', example: 'Score 588 (range 300–850), provided by Example Credit Bureau, created May 2. Key factors: 1. Collections on file. 2. High balances compared with limits. 3. Recent late payments.' },
    ],
    changes: 'Apply the same written screening criteria to every applicant, and follow fair housing law. If the reason came from someone other than a reporting company, such as a former landlord you called, tell the applicant, when you give the decision, that they can ask in writing within 60 days for the nature of that information (FCRA section 615(b)). Ask an attorney whether this applies to your rental.',
    corrected: 'Keep a copy of the notice, the criteria you applied, and the date you gave it. Your state or city may add screening rules (for example, limits on fees or on what you can consider); ask a local landlord attorney. Source: FTC, “Using Consumer Reports: What Landlords Need to Know.”',
  },
  {
    key: 'appraisal',
    title: 'Appraisal report',
    from: 'The lender orders it after your loan application, from an appraiser it chooses. For a loan secured by a first lien on a 1 to 4 unit home, including an investment loan, the lender must give you a copy promptly when it’s done, or 3 business days before closing, whichever is earlier, unless you agree to get it at closing (Regulation B). For a cash purchase, you can hire a licensed or certified appraiser yourself.',
    parts: [
      { part: 'Subject and assignment', look: 'The address, the legal description, who ordered it, and whether the appraiser went inside or only looked from outside.', who: 'The appraiser.', example: 'An exterior-only appraisal can miss hidden damage: ask whether the value assumes the inside is in average condition.' },
      { part: 'Condition and quality ratings', look: 'How the appraiser rated the condition and the building quality, and any repairs listed as required.', who: 'The appraiser.', example: 'A value “subject to” repairs depends on that work being finished. On an ordinary purchase loan, the lender usually requires the work, and a check that it’s done, before closing. An approved renovation loan (such as Fannie Mae HomeStyle or FHA 203(k)) can close first and pay for the work afterward, as it’s finished (see “Loans for a home you’ll live in” in the Financing lesson). Ask your lender which applies.' },
      { part: 'Comparable sales grid', look: 'Three or more recent sales nearby, the dollar adjustments for differences (size, age, garage, pool, condition), and how close the adjusted values are to each other.', who: 'The appraiser. You check that the comparables are truly similar and recent.', example: 'Comparable 2 sold 11 months ago and 1.2 miles away: ask why a closer, newer sale wasn’t used.' },
      { part: 'Rent schedule (rentals)', look: 'For a rental loan, a separate form estimates market rent from rented comparables. Lenders use it to qualify the loan, often counting only part of the rent.', who: 'The appraiser, when the lender asks for it.' },
      { part: 'Final value and conditions', look: 'The value, the effective date, and whether it’s “as is” or “subject to” repairs or completion.', who: 'The appraiser.' },
    ],
    changes: 'A low appraisal usually changes the loan, not the price: the lender lends on the lower value, so you bring more cash, renegotiate, or cancel under your appraisal contingency before its deadline. Upgrades count at what buyers there pay for them, not what they cost.',
    corrected: 'If a fact is wrong (the square footage, a bedroom count, a comparable that isn’t comparable), ask the lender in writing for a reconsideration of value with better sales. Check that a revised report changed only what you raised.',
  },
  {
    key: 'hoa-resale',
    title: 'HOA resale package or resale certificate',
    from: 'The association (or its manager) prepares it after the seller orders it, usually for a fee. Your contract says when the seller must deliver it and how long you have to review it. Each state names it differently: a resale package in Nevada, a resale certificate in Texas (Property Code 207.003), a disclosure statement in Arizona.',
    parts: [
      { part: 'Dues and special assessments', look: 'The regular dues, any special assessment already approved, and anything the seller still owes.', who: 'The association.', example: 'A $9,000 roof assessment approved last month may become yours if the contract doesn’t say the seller pays it.' },
      { part: 'Budget and reserves', look: 'Whether the reserve fund covers the reserve study’s plan. Thin reserves mean future assessments.', who: 'The association.' },
      { part: 'Lawsuits and violations', look: 'Lawsuits involving the association, and any violation on this unit, such as an unapproved change.', who: 'The association.' },
      { part: 'Rental rules', look: 'Whether rentals are allowed, minimum lease terms, rental caps and short-term rental bans.', who: 'The association’s rules and CC&Rs.', example: 'A 12-month minimum lease rules out a short-term rental plan.' },
      { part: 'Fees at transfer', look: 'Transfer fees, capital contributions and move-in fees, and who pays them.', who: 'The association; your contract decides who pays.' },
    ],
    changes: 'Your contract, and in some states the law, gives you a short window after you receive these documents to cancel. Find the number of days and how to give notice, and mark the date you received the package.',
    corrected: 'If the association issues an update before closing, read what changed (dues, assessments, violations) and check it against your numbers before the window closes.',
  },
  {
    key: 'disclosure',
    title: 'Seller’s disclosure of the property’s condition',
    from: 'In a regular sale, the seller fills it in and gives it to you before or soon after your offer is accepted. In Nevada, the law requires one for most home sales (NRS 113.130). In California, the law requires one for most home sales: the Transfer Disclosure Statement (Civil Code 1102). In Texas, the law requires one for most home sales (Property Code 5.008). Rules differ by state on which sales are exempt, so ask your agent which applies to your sale. In Nevada, a trustee’s foreclosure sale (NRS 107) and a few listed transfers (such as between relatives, or by an executor or trustee) are exempt, but a bank reselling a home it took back is not. In California, a foreclosure sale and a lender’s resale of a home it took back (or got by a deed in lieu) are exempt from the Transfer Disclosure Statement (Civil Code 1102.2(b), (c)), but a short sale by the owner is not. In Utah, the state purchase contract (REPC) requires a written seller property condition disclosure by the Seller Disclosure Deadline (section 7(a)); bank sellers often replace it with an as-is addendum.',
    parts: [
      { part: 'Systems and known defects', look: 'What the seller says about the roof, plumbing, electrical, heating and cooling, water heater, and any known leaks or defects.', who: 'The seller, from what they know. It isn’t an inspection.', example: '“Roof: leak repaired 2023.” Ask for the invoice and have the inspector look at that spot.' },
      { part: 'Water, mold and the ground', look: 'Flooding, drainage, mold, soil movement and foundation repairs.', who: 'The seller.' },
      { part: 'Permits and additions', look: 'Work done without permits, additions or conversions (a garage made into a room).', who: 'The seller. Check permits with the city or county.' },
      { part: 'Legal and neighborhood', look: 'HOA, easements, boundary disputes, liens, and any notices from the city.', who: 'The seller.' },
      { part: '“Unknown” answers', look: 'Many “unknown” boxes usually mean the seller didn’t live there (a landlord, an estate, a bank).', who: 'The seller.', example: 'Treat each “unknown” as a question for your inspector.' },
    ],
    changes: 'If you receive the disclosure after you sign, your state may give you a few days to cancel; your contract or agent can tell you how many. New problems the seller learns of before closing usually must be disclosed in an update.',
    corrected: 'Compare any updated disclosure with the first one, line by line, and ask your inspector about each change before your inspection period ends.',
  },
  {
    key: 'note',
    title: 'Promissory note and deed of trust (your loan papers)',
    from: 'The lender’s closing documents, signed at closing. The note is your promise to repay; the deed of trust is recorded and lets the lender sell the property if you don’t. All five states covered here mostly use deeds of trust.',
    parts: [
      { part: 'Note: amount, rate, payment and term', look: 'That they match your final Closing Disclosure or term sheet, including any interest-only period or balloon payment.', who: 'The lender. You check.' },
      { part: 'Note: late charges and prepayment', look: 'The late fee and grace period, and any prepayment penalty, how long it lasts and how it’s figured.', who: 'The lender.', example: 'A “5-4-3-2-1” penalty means 5% of the balance in year one, 4% in year two, and so on.' },
      { part: 'Deed of trust: taxes, insurance and escrow', look: 'Whether you must pay taxes and insurance through an escrow account, and the insurance the lender requires.', who: 'The lender.' },
      { part: 'Occupancy and riders', look: 'Whether you promised to live there (a home loan used for a rental can be fraud), and riders such as the 1–4 family rider, which lets the lender collect the rent if you default.', who: 'The lender. You sign only what’s true.' },
      { part: 'Due-on-sale and default', look: 'The lender can call the loan due if you transfer the property (even, sometimes, to your LLC) or default.', who: 'The lender.', example: 'Ask before you deed the property to an LLC after closing.' },
    ],
    changes: 'Nothing changes these papers after closing except a signed modification. Payments can change if the rate adjusts or the escrow for taxes and insurance goes up.',
    corrected: 'Get a full copy of everything you signed, and check that the recorded deed of trust matches. Keep it with your closing statement.',
  },
  {
    key: 'deed',
    title: 'The deed you receive',
    from: 'The seller (or the trustee, sheriff or county) signs it and the title company or official records it. You receive the recorded copy, often weeks later.',
    parts: [
      { part: 'Kind of deed', look: 'What the seller promises about title. A general warranty deed promises clear title against everyone; a special warranty deed only against problems from the seller’s own ownership (common for bank-owned homes); a grant deed (California, Nevada) makes limited promises; a quitclaim deed promises nothing; a trustee’s, sheriff’s or tax deed comes from a sale and usually promises nothing.', who: 'Set by the sale and the contract.', example: 'A deed that promises nothing is why title insurance matters after a forced sale.' },
      { part: 'Grantee and vesting', look: 'Your name (or your LLC’s) spelled exactly right, and how you hold title (alone, tenants in common, joint owners with a right of survivorship, community property). In Texas, survivorship needs a written agreement (Estates Code 111.001).', who: 'You choose; the title company writes it.' },
      { part: 'Legal description', look: 'That it matches the title commitment and the county’s parcel, not just the street address.', who: 'The title company.' },
      { part: 'Exceptions and reservations', look: 'Easements, mineral rights or restrictions the deed keeps out.', who: 'The seller and title company.' },
      { part: 'Recording stamp', look: 'The recording date and document number from the county.', who: 'The county recorder or clerk.' },
    ],
    changes: 'A recorded deed can’t be edited. Errors are fixed by recording a corrective deed, which the title company usually prepares.',
    corrected: 'Check the recorded copy on the county’s records site, then keep it with your title policy.',
  },
  {
    key: 'rent-roll',
    title: 'Rent roll, operating statement (T-12) and tenant estoppels',
    from: 'For a property with tenants, the seller or broker gives you the rent roll and the last 12 months of income and expenses during due diligence. Tenant estoppel certificates are signed by each tenant before closing, at your request through the contract.',
    parts: [
      { part: 'Rent roll', look: 'Each unit: tenant, rent, deposit, lease start and end, and who’s behind. Compare it with the leases and the bank deposits.', who: 'The seller or property manager.', example: 'Unit 4 shows $1,450 rent, but the lease says $1,250 with a $200 “pet fee” that ends in two months.' },
      { part: 'Operating statement (T-12)', look: 'The last 12 months of actual income and every expense. Look for missing costs (management, repairs, a reserve) and one-time income.', who: 'The seller. Ask for bank statements or tax returns to check it.' },
      { part: 'Estoppel certificate', look: 'Each tenant confirms the rent, the deposit, the lease dates, any free rent or side deals, and whether the landlord is in default.', who: 'The tenant signs; you or your attorney prepare it.', example: 'A tenant who writes “owner promised two months free” is telling you about a side deal the rent roll left out.' },
      { part: 'Leases', look: 'Every lease and amendment: rent increases, options to renew or buy, and who pays which costs.', who: 'The seller.' },
    ],
    changes: 'Rents and vacancies change before closing. Your contract should require an updated rent roll and a final check of deposits, which move to you at closing.',
    corrected: 'Reconcile the final rent roll with the estoppels and the closing statement’s rent and deposit credits before you sign.',
  },
];

export const docGuide = (key: string) => DOC_GUIDES.find((g) => g.key === key);
