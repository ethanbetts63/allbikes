import type { FaqItem } from '@/types/FaqItem';

const faqsBySlug: Record<string, FaqItem[]> = {
  'buying-used-scooter-perth': [
    {
      question: "What's the biggest mistake people make when buying a second-hand scooter?",
      answer:
        "Prioritising price over brand. An $800 scooter from an unknown manufacturer can easily cost more in repairs within a year than a $2,500 Honda or SYM in good condition. Parts for off-brand Chinese imports are often unavailable in Perth, which means the bike sits idle or gets written off for a fault that would be cheap to fix on any mainstream brand.",
    },
    {
      question: 'Are SYM scooters worth buying used?',
      answer:
        "Yes — they represent solid value in the used market. SYM is a Taiwanese manufacturer with decades of production experience, and their bikes use quality components that hold up well over time. Parts are stocked locally, workshops are familiar with the platform, and used SYMs are generally priced below equivalent Hondas or Yamahas despite comparable reliability.",
    },
    {
      question: 'How risky is buying a scooter off Facebook Marketplace?',
      answer:
        "Riskier than most buyers expect. A significant share of the expensive repair jobs that come through our workshop are bikes purchased as bargains on Facebook or Gumtree — cases where the purchase price was low but the repair bill came to several times more. If you're buying privately, use a thorough inspection checklist, run a PPSR check before committing, and ask to see it cold.",
    },
    {
      question: 'What should I check when physically inspecting a used scooter?',
      answer:
        "Start with a cold start — don't let the owner warm it up first. Listen for knocking, look for smoke, and test both brakes. Press down on the front forks and feel for sticking, clunking, or oil residue on the lower legs. Crouch down and look along the frame rails for cracks near welds, mismatched paint, or any signs of a previous impact. Also check that tyres have tread across the full contact patch and that all electrics — indicators, headlight, brake light — work properly.",
    },
    {
      question: 'What is a PPSR check and is it really necessary?',
      answer:
        "A PPSR (Personal Property Securities Register) check confirms whether a vehicle has outstanding finance, has been reported stolen, or has been written off. It costs around $2 at ppsr.gov.au and takes about two minutes. It's not optional — taking on someone else's debt or unknowingly purchasing a stolen bike are real risks in the private market, and this check removes both entirely.",
    },
  ],

  'car-vs-scooter-perth-commuter-guide': [
    {
      question: 'How much money could switching to a scooter actually save me each year?',
      answer:
        "For a typical Perth commuter driving to the CBD five days a week, the saving is roughly $10,000–$13,000 per year compared to running a car. Parking is the biggest single factor — CBD car parks charge $20–$36 per day, while motorcycles and scooters park free in on-street metered bays. On top of that, annual fuel costs drop from around $4,800 for a car to under $700 for a 125cc petrol scooter.",
    },
    {
      question: 'Do I need a motorcycle licence to ride a scooter to work in Perth?',
      answer:
        "It depends on the scooter. A 50cc moped limited to 50 km/h by design qualifies as a moped under WA law and can be ridden on a standard car licence. If the scooter is 125cc or above — including most popular commuter models — you'll need to complete the motorcycle licence process first, starting with a learner's permit.",
    },
    {
      question: 'Is an electric moped actually cheaper to run than a petrol scooter?',
      answer:
        "Running costs are lower — roughly $850–$1,250 per year all-in versus $1,500–$2,000 for a comparable petrol scooter. Charging costs a fraction of what fuel does. The catch is a higher purchase price upfront, so how long it takes to break even depends entirely on how many kilometres you ride. For most Perth commuters, the payback period is several years.",
    },
    {
      question: "Does Perth's climate actually make year-round riding practical?",
      answer:
        "More so than almost any other Australian city. Perth averages fewer than 50 rainy days a year, and temperatures rarely drop into genuinely cold territory. Winter mornings can be cool and occasionally wet, and mid-summer afternoons are hot — but most commuter riders handle both with appropriate gear rather than defaulting back to the car.",
    },
    {
      question: 'What does a motorcycle offer over a scooter for commuting?',
      answer:
        "The main practical advantage is lane filtering — legal in WA for licensed riders at speeds up to 30 km/h — which can cut meaningful time off a commute in heavy traffic. A 300–650cc motorcycle also handles the freeway comfortably where a 50cc scooter can't, giving more route options. Running costs are slightly higher than a small scooter but still a fraction of what a car costs annually.",
    },
  ],

  'wa-e-scooter-laws-2026': [
    {
      question: 'Do I need a licence or registration for an electric scooter in WA?',
      answer:
        "Not for a personal eRideable — the kind you push and stand on. No licence, registration, or insurance is required, as long as your device meets the legal specifications: maximum 25 km/h, under 25 kg, and within the size limits. Registered electric mopeds are a different legal category and do require registration and at minimum a car licence to ride.",
    },
    {
      question: 'Where am I actually allowed to ride an e-scooter in Perth?',
      answer:
        "Footpaths (at up to 10 km/h), shared paths, bicycle paths, and bicycle lanes on roads with a 50 km/h limit. The rule that catches most people: roads with a painted centre dividing line are off-limits, even if the speed limit is 50 km/h. Stick to footpaths, shared paths, and quiet residential streets to stay within the rules.",
    },
    {
      question: 'Is a helmet compulsory when riding an e-scooter in Western Australia?',
      answer:
        "Yes — helmets are mandatory. A bicycle, skateboard, or motorcycle helmet all satisfy the requirement. Riding without one is an offence. The 0.05 BAC alcohol limit also applies: drink riding on an e-scooter carries the same legal consequences as drink driving a car.",
    },
    {
      question: 'What happens if my e-scooter is capable of going faster than 25 km/h?',
      answer:
        "It can't legally be used as an eRideable under WA law, regardless of what speed you actually ride it at. This applies to both modified devices and imported scooters that exceed the speed limit by design. Following the 2025 parliamentary inquiry, the WA Government is moving to make speed limiter tampering a specific criminal offence.",
    },
    {
      question: "What actually changed after WA's 2025 e-scooter parliamentary inquiry?",
      answer:
        "The fundamental rules — where you can ride, speed limits, helmet requirements, and minimum age — stayed the same. The *Ride Safe* report, tabled in December 2025 with the government accepting 32 of 33 recommendations, focused on enforcement and oversight: making device tampering an offence, tightening hire scheme regulations, improving crash data collection, and investing in dedicated riding infrastructure. Day-to-day rules for personal e-scooter riders are unchanged.",
    },
  ],

  'wa-scooter-motorcycle-licence-guide': [
    {
      question: 'How long does it take to get a full motorcycle licence in WA?',
      answer:
        "At minimum, around two and a half years from scratch. You must hold a learner's permit for at least six months before you can progress to a provisional licence, then hold the restricted R-E licence for two years before upgrading to unrestricted R class. If you already hold a full WA car licence, the 50-hour supervised riding logbook is waived — but the time requirements on each stage remain fixed.",
    },
    {
      question: 'What is LAMS and which bikes qualify in WA?',
      answer:
        "LAMS — Learner Approved Motorcycle Scheme — is a national framework that defines which bikes learner and provisional riders can legally ride. In WA, a LAMS-approved bike must have an engine of 660cc or less and a power-to-weight ratio under 150 kW per tonne. The practical result is that most scooters and commuter motorcycles — 125cc, 300cc, and 400cc models — fall within LAMS. Learner and P-plate riders are restricted to LAMS bikes until they gain their unrestricted licence.",
    },
    {
      question: 'Do I need to log supervised riding hours if I already have a car licence?',
      answer:
        "No. Holding a full WA car (C class) licence waives the 50-hour logbook requirement entirely. You still need to hold your learner's permit for a minimum of six months before sitting the Hazard Perception Test and Practical Driving Assessment to progress to your provisional licence — that minimum period cannot be skipped.",
    },
    {
      question: 'Can a 16-year-old legally ride a scooter in WA?',
      answer:
        "Yes, in two different ways. A 50cc moped limited to 50 km/h can be ridden on a moped-only licence available from age 16 — WA is the only state in Australia where this is possible, a full year before you can drive a car. The R-E motorcycle learner's permit pathway also opens at 16 for those wanting to ride anything larger.",
    },
    {
      question: 'I have an interstate or overseas motorcycle licence — do I need to start over in WA?',
      answer:
        "Probably not. If you hold a valid motorcycle licence from another Australian state or territory, or from certain overseas countries, you may be eligible to transfer it to a WA licence without repeating the full process. The specifics depend on your jurisdiction and licence class. Contact Transport WA's Driver and Vehicle Services directly to confirm what's required for your situation.",
    },
  ],
};

export function getArticleFaqs(slug: string): FaqItem[] {
  return faqsBySlug[slug] ?? [];
}
