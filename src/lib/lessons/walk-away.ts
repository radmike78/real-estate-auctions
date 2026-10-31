import type { Lesson } from './types';

export const walkAway: Lesson = {
  key: 'walk-away',
  minutes: 9,
  intro: 'Some losses can be avoided by recognizing when a deal does not fit your finances, goals or risk tolerance. Knowing when to walk away is a skill you can learn: set your limits before you look, then check each property against the numbers, the building, the title and the terms of sale.',
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
        'Write your walk-away price (the most you’ll pay) and your deal breakers before you see a property, in your buy box (a short written list of what you’ll buy and what you won’t). Once you’ve toured a house or spent weeks on research, it’s hard to let go. Passing on a bad deal is a good result, not a failure. An investment isn’t a home you’re fighting to keep: if the numbers don’t work, let it go. Another property will come along.',
        { links: [{ label: 'Write your buy box', url: '#/toolkit/buy-box', what: 'Your price limit, the cash you’ll put in, and the problems you won’t take on.' }] },
      ],
    },
    {
      heading: 'When the numbers say no',
      blocks: [
        { list: [
          'Negative cash flow: once you use realistic rent and every cost, the property loses money each month. That includes vacancy, repairs, reserves for big items and management.',
          'Someone else’s rent: the rent comes from the seller or an online asking price, not from homes that actually rented nearby.',
          'Wrong comparables: separate the property’s value as it is today from its value after repairs. For today’s value, compare similar condition; for after-repair value, similar remodeled homes can fit if your finished work will match. Check size, location and recent sales, and support any adjustments for condition or older sale dates.',
          'No cushion: a flip only works if every estimate is right. There’s no cushion for higher repairs or a lower sale price.',
          'No reserves: you’d have no cash left for reserves after closing.',
          'Thin margin: a small change, like rent 10% lower or $1,200 more a year for insurance, wipes out the profit.',
        ] },
        { links: [{ label: 'Run the stress tests in Analyze a deal', url: '#/analyze', what: 'Keep and rent and Fix and sell show what happens when things go wrong.' }] },
      ],
    },
    {
      heading: 'Building problems that cost more than they look',
      blocks: [
        { list: [
          'Structure: foundation or structural cracks, sloping floors, or doors that won’t close. Get a structural engineer before you commit.',
          'Big systems: an old roof, furnace or air conditioner. Budget the replacement now, not someday.',
          'Sewer and septic: a camera inspection of the sewer line, or a septic inspection, costs little compared with replacing one.',
          'Unpermitted work: additions or garage conversions without permits. Check the permit history with the city or county building department. You may have to permit, fix or remove them.',
          'Water, mold and fire: signs of water damage, mold or past fire damage.',
          'Flood risk: look up the flood zone on FEMA’s Flood Map Service Center, and price flood insurance if you need it. “Insurance before you commit” in the Analyzing a deal lesson explains when a loan requires it and how long a new policy takes to start.',
          'Lead paint: homes built before 1978 come with federal lead disclosure rules, and sales at foreclosure are exempt from them. “Check before you commit” in the Analyzing a deal lesson explains what you get and what to plan for.',
          'Insurance: get a quote before you commit. If no one will insure the property at a workable price, that’s a deal breaker.',
        ] },
        { links: [{ label: 'Analyzing a deal: check before you commit', url: '#/learn/analyze', what: 'Title, condition, lead paint, flood risk and taxes.' }] },
      ],
    },
    {
      heading: 'Title, HOA and occupancy problems',
      blocks: [
        'Have a title company or attorney check what you’d really be buying. Look for liens that survive the sale, unpaid taxes, and anyone else with a claim. Find out whether it’s occupied, and what the official seller, trustee or court says about possession.',
        'If there’s a homeowners’ association, read its documents before you close. Look for special assessments, lawsuits and a low reserve fund.',
        { list: [
          'In Nevada, read the HOA resale package before your cancel window closes. You can cancel in writing until midnight of the fifth calendar day after you receive the package, as long as the sale hasn’t closed yet.* Some sales are exempt (NRS 116.4101); ask your agent or the HOA whether yours is covered (NRS 116.4109).',
          'In California, the seller gives you the association’s documents before the sale, including any regular or special assessments the board has approved that aren’t due yet (Civil Code 4525).',
          'In Arizona, you get the HOA or condo disclosure within 10 days: from the seller within 10 days after your offer is accepted if the community has fewer than 50 homes or units, or from the association within 10 days after the seller’s notice if it has 50 or more. It includes any special assessment the board approved but hasn’t charged yet and a summary of pending lawsuits (A.R.S. 33-1806 for planned communities, 33-1260 for condos).',
          'In Utah, ask the association for its governing documents, budget, reserve study and any planned special assessments or lawsuits before you close.',
          'In Texas, for a subdivision HOA, the association must deliver its restrictions, bylaws, rules and a resale certificate within 10 business days of a written request. The certificate lists dues, approved special assessments, unpaid amounts, reserves, the budget and pending lawsuits (Property Code 207.003). For a condo, the seller must give you the declaration, bylaws, rules and a resale certificate no more than 3 months old (Property Code 82.157).',
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
          'Put your deposit only into escrow with that title company. Pay a deposit only into escrow with the title company, not to the wholesaler directly.',
        ] },
        'In Arizona, a wholesaler selling a contract for a home with fewer than five units must tell you in writing, before you sign, that they hold only an equitable interest in the home. They must also say they may not be able to transfer the title to you. If they don’t, you can cancel any time before closing and get all your earnest money back (A.R.S. 44-5101).',
        'In Texas, anyone selling an option or assigning a purchase contract must tell you in writing, before you sign, that they’re selling only a contract interest. They must also say they don’t hold legal title, and they must tell the owner too (Property Code 5.0205). If they don’t tell you, they’re acting as a real estate broker, which needs a license (Occupations Code 1101.0045). In Nevada, California and Utah, check the current rules on selling or assigning a purchase contract with a real estate attorney or the state’s real estate agency.',
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
          'Is it inside my buy box and below my walk-away price?',
          'Do the numbers still work with rent 10% lower and repairs 20% higher?',
          'Did I use rents and sales that actually happened, for similar homes?',
          'Has an inspector checked the roof, systems, foundation and sewer?',
          'At an auction, where I can’t inspect, does my worst-case budget cover the roof, systems, foundation and sewer?',
          'Is it outside a high-risk flood zone, or have I priced flood insurance?',
          'Has a title professional told me what survives the sale?',
          'Do I know whether it’s occupied, and what the official seller, trustee or court says about getting possession?',
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
    { term: 'Survives the sale', meaning: 'A debt or claim that stays with the property after you buy it.' },
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
    { label: 'Texas: Property Code 207.003 (HOA resale certificate)', url: 'https://tcss.legis.texas.gov/resources/PR/htm/PR.207.htm#207.003' },
    { label: 'Texas: Property Code 5.0205 (equitable interest disclosure)', url: 'https://tcss.legis.texas.gov/resources/PR/htm/PR.5.htm#5.0205' },
    { label: 'Texas: Occupations Code 1101.0045 (selling a contract without a license)', url: 'https://tcss.legis.texas.gov/resources/OC/htm/OC.1101.htm#1101.0045' },
  ],
  practice: 'Before you look at another property, write three deal breakers into your buy box.',
  reviewed: '2026-10-05',
};
