import type { Lesson } from './types';

export const walkAway: Lesson = {
  key: 'walk-away',
  minutes: 9,
  intro: 'Most money in real estate is lost on deals that should never have been bought. Knowing when to walk away is a skill you can learn: set your limits before you look, then check each property against the numbers, the building, the title and the terms of sale.',
  takeaways: [
    'The numbers that say a deal doesn’t work.',
    'Building problems that cost far more than they look.',
    'Title, HOA and occupancy problems to rule out first.',
    'What you’re really buying from a wholesaler, and how to protect your deposit.',
    'Auction terms that should make you stop.',
    'A walk-away checklist to use on every property.',
  ],
  sections: [
    {
      heading: 'Decide before you fall for it',
      blocks: [
        'Write your maximum price and your deal breakers before you see a property, in your buy box. Once you’ve toured a house or spent weeks on research, it’s hard to let go. Passing on a bad deal is a good result, not a failure. An investment isn’t a home you’re fighting to keep: if the numbers don’t work, let it go. Another property will come along.',
        { links: [{ label: 'Write your buy box', url: '#/toolkit/buy-box', what: 'Your price limit, the cash you’ll put in, and the problems you won’t take on.' }] },
      ],
    },
    {
      heading: 'When the numbers say no',
      blocks: [
        { list: [
          'Cash flow is negative once you use realistic rent and every cost. That includes vacancy, repairs, reserves for big items and management.',
          'The rent comes from the seller or an online asking price, not from homes that actually rented nearby.',
          'The value after repairs comes from bigger, remodeled or old sales instead of similar homes sold recently.',
          'A flip only works if every estimate is right. There’s no cushion for higher repairs or a lower sale price.',
          'You’d have no cash left for reserves after closing.',
          'A small change, like rent 10% lower or $1,200 more a year for insurance, wipes out the profit.',
        ] },
        { links: [{ label: 'Run the stress tests', url: '#/analyze', what: 'The rental and flip calculators show what happens when things go wrong.' }] },
      ],
    },
    {
      heading: 'Building problems that cost more than they look',
      blocks: [
        { list: [
          'Foundation or structural cracks, sloping floors, or doors that won’t close: get a structural engineer before you commit.',
          'An old roof, furnace or air conditioner: budget the replacement now, not someday.',
          'The sewer line or septic system: a camera inspection of the sewer line, or a septic inspection, costs little compared with replacing one.',
          'Additions or garage conversions without permits: check the permit history with the city or county building department. You may have to permit, fix or remove them.',
          'Signs of water damage, mold or past fire damage.',
        ] },
        'Flood risk: look up the flood zone on FEMA’s Flood Map Service Center. If a home is in a high-risk flood area and has a mortgage from a government-backed lender, it must have flood insurance, and that can change your numbers.',
        'Lead paint: for most housing built before 1978, sellers and landlords must tell you about any lead-based paint and hazards they know of. Buyers also get 10 days for a lead inspection unless they waive it.',
        'Insurance: get a quote before you commit. If no one will insure the property at a workable price, that’s a deal breaker.',
      ],
    },
    {
      heading: 'Title, HOA and occupancy problems',
      blocks: [
        'Have a title company or attorney check what you’d really be buying. Look for liens that survive the sale, unpaid taxes, and anyone else with a claim. If someone lives there, find out who they are and what it will take to get possession legally.',
        'If there’s a homeowners’ association, read its documents before you close. Look for special assessments, lawsuits and a low reserve fund.',
        { list: [
          'In Nevada, the seller gives you the association’s resale package. It lists current and expected assessments, plus any unpaid judgments or pending lawsuits against the association. You can cancel the purchase in writing until midnight of the fifth day after you receive it (NRS 116.4109).',
          'In California, the seller gives you the association’s documents before the sale, including any regular or special assessments the board has approved that aren’t due yet (Civil Code 4525).',
          'In Arizona, the association must send its disclosure within 10 days, including any special assessment the board approved but hasn’t charged yet and a summary of pending lawsuits (A.R.S. 33-1806 for planned communities, 33-1260 for condos).',
          'In Utah, ask the association for its governing documents, budget, reserve study and any planned special assessments or lawsuits before you close.',
        ] },
      ],
    },
    {
      heading: 'Buying from a wholesaler',
      blocks: [
        'A wholesaler signs a contract to buy a home and then sells you the right to that contract. You’re buying a contract, not the house. The wholesaler often doesn’t own the home and may not be able to deliver it.',
        { list: [
          'The price you pay usually includes the wholesaler’s fee for assigning the contract. Compare it with recent sales of similar homes, not with the wholesaler’s repair estimate.',
          'You may get no inspection period. If the contract won’t let you inspect, treat it like an as-is auction and budget for the worst case, or walk away.',
          'Use your own title company. Ask it to confirm who owns the home and what liens are on it before you put up money.',
          'Put your deposit only into escrow with that title company. Never pay a deposit or fee straight to the wholesaler.',
        ] },
        'In Arizona, a wholesaler selling a contract for a home with fewer than five units must tell you in writing, before you sign, that they hold only an equitable interest in the home and may not be able to transfer the title to you. If they don’t, you can cancel any time before closing and get all your earnest money back (A.R.S. 44-5101). In Nevada, California and Utah, check the current rules with a real estate attorney or the state’s real estate agency.',
        'You don’t need a middleman to find a deal. Official sellers list their properties directly: the county, the trustee, the court, government agencies and the bank that owns the home.',
        { links: [{ label: 'Find deals from official sellers', url: '#/find-deals', what: 'Official sellers and sale lists for your county.' }] },
      ],
    },
    {
      heading: 'Auction terms that should make you stop',
      blocks: [
        { list: [
          'You can’t see inside and have no budget for the worst case.',
          'Payment is due in full within hours or a day or two, and you don’t have the cash ready.',
          'The sale is final, as-is, with no refund if the title or the building has problems.',
          'The deed promises little or nothing about the title.',
          'You haven’t set a walk-away price, or the bidding has already passed it.',
        ] },
        { links: [{ label: 'How each kind of sale works', url: '#/playbooks', what: 'Deposits, payment deadlines and what the deed promises, sale by sale.' }] },
      ],
    },
    {
      heading: 'Walk-away checklist',
      blocks: [
        { list: [
          'Is it inside my buy box and below my maximum price?',
          'Do the numbers still work with rent 10% lower and repairs 20% higher?',
          'Did I use rents and sales that actually happened, for similar homes?',
          'Has an inspector, or for an auction my own worst-case budget, covered the roof, systems, foundation and sewer?',
          'Is it outside a high-risk flood zone, or have I priced flood insurance?',
          'Has a title professional told me what survives the sale?',
          'Do I know who lives there and how I’d get possession legally?',
          'Have I read the HOA documents, if any?',
          'If the plan needs nightly rentals, have I confirmed a short-term rental license is possible for this address?',
          'If a wholesaler is selling, is my deposit going only to escrow, with my own title company?',
          'Will I still have cash in reserve after closing?',
        ] },
        'If the answer to any of these is no, fix it or walk away.',
      ],
    },
  ],
  terms: [
    { term: 'Walk-away price', meaning: 'The most you’ll pay, set before you bid or offer, so a deal still works if things go wrong.' },
    { term: 'Special assessment', meaning: 'An extra charge an HOA bills owners, often for a big repair, on top of regular dues.' },
    { term: 'Flood zone', meaning: 'The flood risk FEMA maps for an area. High-risk zones can require flood insurance.' },
    { term: 'Permit history', meaning: 'The building department’s record of approved work on a property.' },
    { term: 'Assignment fee', meaning: 'What a wholesaler charges to hand you their purchase contract. It’s part of the price you pay.' },
  ],
  tryIt: { label: 'Practice: would you buy it?', href: '#/practice' },
  sources: [
    { label: 'FEMA: flood maps', url: 'https://www.fema.gov/flood-maps' },
    { label: 'FEMA: flood insurance', url: 'https://www.fema.gov/flood-insurance' },
    { label: 'EPA: lead-based paint disclosure rule', url: 'https://www.epa.gov/lead/lead-based-paint-disclosure-rule-section-1018-title-x' },
    { label: 'EPA: real estate disclosures about potential lead hazards', url: 'https://www.epa.gov/lead/real-estate-disclosures-about-potential-lead-hazards' },
    { label: 'Nevada: NRS 116 (resale package, 116.4109)', url: 'https://www.leg.state.nv.us/nrs/nrs-116.html' },
    { label: 'California: Civil Code 4525 (HOA documents for buyers)', url: 'https://leginfo.legislature.ca.gov/faces/codes_displaySection.xhtml?lawCode=CIV&sectionNum=4525' },
    { label: 'Arizona: A.R.S. 33-1806 (planned community resale disclosure)', url: 'https://www.azleg.gov/ars/33/01806.htm' },
    { label: 'Arizona: A.R.S. 33-1260 (condominium resale disclosure)', url: 'https://www.azleg.gov/ars/33/01260.htm' },
    { label: 'Arizona: A.R.S. 44-5101 (wholesale buyers and sellers)', url: 'https://www.azleg.gov/ars/44/05101.htm' },
  ],
  practice: 'Before you look at another property, write three deal breakers into your buy box.',
  reviewed: '2026-10-04',
};
