import Anthropic from "@anthropic-ai/sdk";
import { IMAGE_BANK } from "../app/sites/_templates/images";
import type {
  NicheKey,
  Review,
  Service,
  SiteData,
} from "../app/sites/_templates/types";
import { slugify } from "../app/sites/_templates/utils";

export type LeadInput = {
  name: string;
  niche: NicheKey;
  city: string;
  phone: string | null;
  address: string | null;
  rating: number | null;
  rating_count: number | null;
};

type AIContent = {
  headline: string;
  subheadline: string;
  services: Service[];
  reviews: Review[];
  about: string;
};

// Per-niche static fallback. Used when no Anthropic key, when AI fails, or
// when AI output fails JSON validation. Each entry is generic-but-credible
// so the site never falls back to anything obviously templated.
const STATIC_FALLBACK: Record<NicheKey, (name: string, city: string) => AIContent> = {
  plumber: (name, c) => ({
    headline: `${c} plumbing. Done right.`,
    subheadline: `Burst pipe, blocked drain, no hot water — we roll same hour, every hour.`,
    services: [
      { title: "Emergency repairs", description: `Burst pipes, leaks, no water — same-hour response across ${c}.` },
      { title: "Drain cleaning", description: "Hydro-jetting, snaking, root removal. Fixed price, guaranteed clear." },
      { title: "Water heaters", description: "Tank, tankless, gas, electric. Repair or full replacement." },
      { title: "Repipes & remodels", description: "Whole-house repipes, kitchen and bath rough-ins." },
    ],
    reviews: [
      { quote: "Pipe burst at 11pm. They were here by midnight, fixed by 1am. Saved my floors.", name: "M. Alvarez" },
      { quote: "Flat $340 for a water heater swap. Three other guys wanted $700+. Done in 90 min.", name: "J. Patel" },
      { quote: "They actually pick up the phone. That alone is worth 5 stars.", name: "C. Romero" },
    ],
    about: `${name} is a licensed, bonded, family-run plumbing crew serving ${c}. Upfront pricing, no surprise charges, and a real human on the phone — every call.`,
  }),
  auto: (name, c) => ({
    headline: `${c} mechanic. Comes to you.`,
    subheadline: `Driveway, parking lot, side of the road — fixed price before we touch a wrench.`,
    services: [
      { title: "Diagnostics", description: "Check-engine, no-start, weird noise. Pro-grade scanner, fixed-fee read." },
      { title: "Brakes", description: "Pads, rotors, calipers, fluid flush. Same-day, in your driveway." },
      { title: "Batteries & alternators", description: "Test, swap, charging-system check. Most jobs under an hour." },
      { title: "Pre-purchase inspection", description: "Buying used? 70-point inspection at the seller's curb. PDF report." },
    ],
    reviews: [
      { quote: "Battery died in the parking lot. They were there in 22 minutes with a new one. Flat $185, done.", name: "K. Nguyen" },
      { quote: "Quoted me $420 for front pads and rotors. Dealer wanted $890. Same parts. 90 min.", name: "T. Williams" },
      { quote: "Pre-purchase inspection saved me from a $4k transmission landmine.", name: "R. Patel" },
    ],
    about: `${name} is an ASE-certified mobile mechanic serving ${c}. Upfront pricing, real diagnostics, no upsells.`,
  }),
  groomer: (name, c) => ({
    headline: `${c} dog grooming. At your door.`,
    subheadline: `Full-service grooming in our climate-controlled van — your dog never leaves home.`,
    services: [
      { title: "Full groom", description: "Bath, blow-out, breed-specific cut, ear clean, nail trim — door to door." },
      { title: "Bath & brush", description: "Deep-clean bath, dematting, blow-out. Perfect between full grooms." },
      { title: "Puppy first groom", description: "Gentle, low-stress intro for puppies — short sessions, lots of treats." },
      { title: "Senior & anxious dogs", description: "One dog at a time, calm pace, ramp access. We meet your dog where they are." },
    ],
    reviews: [
      { quote: "My golden HATES car rides. Now she just walks into their van like it's her spa.", name: "L. Carter" },
      { quote: "Two doodles done in 90 minutes — both look incredible. No more $200 salon trips.", name: "S. Bennett" },
      { quote: "Senior dog, hip issues, used to be a fight. They were patient and gentle. We're booked monthly now.", name: "D. Park" },
    ],
    about: `${name} brings full-service grooming to ${c} in a fully-equipped mobile van. No cages, no stress, no waiting room — just your dog, one expert groomer, and a clean cut at your driveway.`,
  }),
  tutor: (name, c) => ({
    headline: `${c} tutoring. One-on-one. Results-driven.`,
    subheadline: `Personalized sessions for elementary through high school — at home or online.`,
    services: [
      { title: "Math & sciences", description: "Pre-algebra through AP Calculus and Physics. Concept-first, drill second." },
      { title: "Reading & writing", description: "Comprehension, essay structure, vocabulary. Building confident readers." },
      { title: "Test prep", description: "SAT, ACT, state assessments. Practice tests, score tracking, score moves." },
      { title: "Homework support", description: "Weekly sessions to keep your student ahead — never behind." },
    ],
    reviews: [
      { quote: "My son went from a C in Algebra to an A- in one semester. They actually teach, not just give answers.", name: "M. Kowalski" },
      { quote: "SAT math went up 110 points. Worth every dollar. Wish we'd started a year earlier.", name: "A. Singh" },
      { quote: "Patient with my anxious 4th grader. She actually enjoys math now. That's the win.", name: "J. Ortega" },
    ],
    about: `${name} provides one-on-one tutoring across ${c} for elementary through high-school students. Real teachers, measurable progress, parent updates every week.`,
  }),
  hair: (name, c) => ({
    headline: `${c} hair. Booked solid.`,
    subheadline: `Cuts, color, and bridal styling by appointment — quiet studio, no walk-ins.`,
    services: [
      { title: "Color & balayage", description: "Honey balayage, root touch-ups, color correction. Olaplex-supported." },
      { title: "Precision cuts", description: "Editorial, layered, lived-in. Cut to grow out beautifully." },
      { title: "Bridal & event", description: "Trial run included. We come to you on the day." },
      { title: "Treatments", description: "Bond-building, gloss, scalp resets. Take the damage out, keep the color in." },
    ],
    reviews: [
      { quote: "Best balayage of my life. People stop me on the street. Already rebooked.", name: "A. Reyes" },
      { quote: "Trusted them with my wedding hair. Photographer asked for the stylist's name.", name: "M. Chen" },
      { quote: "Quiet, private, no rush. Felt like a real treat instead of a haircut.", name: "S. Patel" },
    ],
    about: `${name} is a private appointment-only hair studio in ${c}. One client at a time, one stylist, full attention. No noisy chair next to you, no upsells, just hair done properly.`,
  }),
  landscape: (name, c) => ({
    headline: `${c} yards. Kept sharp.`,
    subheadline: `Weekly maintenance, full installs, and tree work — done when we say we'll do it.`,
    services: [
      { title: "Weekly mow & edge", description: "Same crew, same day each week, every week. Includes blow-down." },
      { title: "Hedge & tree work", description: "Trim, shape, removal. Insured arborist on every job." },
      { title: "Garden install", description: "Design, plant, mulch. Native species that survive your climate." },
      { title: "Seasonal cleanup", description: "Spring prep, fall leaves, winter prep. Full property, one visit." },
    ],
    reviews: [
      { quote: "Three lawn guys before this. These guys show up every week without me reminding them.", name: "B. Foster" },
      { quote: "Removed two dying maples, ground the stumps, gone in a day. Property looks new.", name: "K. Watson" },
      { quote: "Front yard install — completely transformed our curb appeal. Neighbors are jealous.", name: "L. Diaz" },
    ],
    about: `${name} runs weekly maintenance and full landscape installs across ${c}. Reliable schedule, insured, English-speaking foreman on every visit.`,
  }),
};

function clean(s: string): string {
  return s
    .trim()
    .replace(/^["']|["']$/g, "")
    .replace(/^\*+|\*+$/g, "")
    .replace(/[*_`]/g, "")
    .replace(/\s+/g, " ")
    .trim();
}

function validateAIContent(raw: unknown): AIContent | null {
  if (!raw || typeof raw !== "object") return null;
  const o = raw as Record<string, unknown>;
  const headline = typeof o.headline === "string" ? clean(o.headline) : "";
  const subheadline = typeof o.subheadline === "string" ? clean(o.subheadline) : "";
  const about = typeof o.about === "string" ? clean(o.about) : "";
  const services = Array.isArray(o.services)
    ? (o.services.filter(
        (s: unknown) =>
          s && typeof s === "object" &&
          typeof (s as Record<string, unknown>).title === "string" &&
          typeof (s as Record<string, unknown>).description === "string",
      ) as Service[])
        .map((s) => ({ title: clean(s.title), description: clean(s.description) }))
        .slice(0, 4)
    : [];
  const reviews = Array.isArray(o.reviews)
    ? (o.reviews.filter(
        (r: unknown) =>
          r && typeof r === "object" &&
          typeof (r as Record<string, unknown>).quote === "string" &&
          typeof (r as Record<string, unknown>).name === "string",
      ) as Review[])
        .map((r) => ({ quote: clean(r.quote), name: clean(r.name) }))
        .slice(0, 3)
    : [];
  if (!headline || headline.length > 80) return null;
  if (!subheadline || subheadline.length > 200) return null;
  if (!about || about.length > 400) return null;
  if (services.length < 3) return null;
  if (reviews.length < 3) return null;
  return { headline, subheadline, services, reviews, about };
}

function extractJSON(text: string): unknown | null {
  // Try direct parse first. If the model wrapped it in markdown fences or prose,
  // grab the first top-level {...} block and try that.
  try {
    return JSON.parse(text);
  } catch {
    const match = text.match(/\{[\s\S]*\}/);
    if (!match) return null;
    try {
      return JSON.parse(match[0]);
    } catch {
      return null;
    }
  }
}

async function aiContent(lead: LeadInput): Promise<AIContent> {
  const fallback = STATIC_FALLBACK[lead.niche](lead.name, lead.city);
  const key = process.env.ANTHROPIC_API_KEY;
  if (!key) return fallback;

  const client = new Anthropic({ apiKey: key });
  const prompt = `You write hero copy for hyper-local small-business websites.

Business: "${lead.name}"
Niche: ${lead.niche}
City: ${lead.city}
Google rating: ${lead.rating ?? "unknown"} (${lead.rating_count ?? 0} reviews)

Write a complete first-draft for their new website. Output ONLY valid JSON in this exact shape — no preamble, no markdown, no fences:

{
  "headline": "max 6 words, bold and specific, no business name",
  "subheadline": "one sentence, max 15 words, names the customer's pain or outcome",
  "services": [
    {"title": "max 3 words", "description": "one sentence, plain English, no buzzwords"},
    {"title": "...", "description": "..."},
    {"title": "...", "description": "..."},
    {"title": "...", "description": "..."}
  ],
  "reviews": [
    {"quote": "1-2 sentences, sounds like a real customer, includes a specific detail (price, time, neighborhood)", "name": "First-initial. Last-name"},
    {"quote": "...", "name": "..."},
    {"quote": "...", "name": "..."}
  ],
  "about": "two sentences, founder-voice, names the city, no corporate filler"
}

Rules: plain text only, no markdown markers, no asterisks, no emojis. Each piece should feel like a confident local business owner wrote it for the niche of ${lead.niche} in ${lead.city}.`;

  try {
    const res = await client.messages.create({
      model: "claude-haiku-4-5-20251001",
      max_tokens: 1200,
      messages: [{ role: "user", content: prompt }],
    });
    const block = res.content[0];
    if (block?.type === "text") {
      const parsed = extractJSON(block.text);
      const validated = validateAIContent(parsed);
      if (validated) return validated;
      console.warn("[generate-site] AI returned invalid shape, using fallback");
    }
  } catch (e) {
    console.warn("[generate-site] AI content failed, using fallback:", (e as Error).message);
  }
  return fallback;
}

export async function generateSiteData(lead: LeadInput): Promise<SiteData> {
  const bank = IMAGE_BANK[lead.niche];
  const content = await aiContent(lead);
  return {
    slug: slugify(lead.name, lead.city),
    businessName: lead.name,
    niche: lead.niche,
    city: lead.city,
    phone: lead.phone,
    address: lead.address,
    rating: lead.rating,
    ratingCount: lead.rating_count,
    headline: content.headline,
    subheadline: content.subheadline,
    services: content.services,
    reviews: content.reviews,
    about: content.about,
    heroImage: bank.hero,
    gallery: bank.gallery.map((g) => ({ ...g, cap: `${g.cap} · ${lead.city}` })),
  };
}
