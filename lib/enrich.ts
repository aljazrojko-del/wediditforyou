/**
 * Enrichment waterfall for no-website local SMBs.
 *
 * Why this is NOT a typical B2B enrichment flow:
 *   Apollo/PDL databases are built for B2B (companies with websites, LinkedIn presence).
 *   Our targets are appointment-based local businesses — solo plumbers, mobile mechanics,
 *   barbers, dog groomers — with NO website. Apollo won't have most of them.
 *
 * What actually works for this niche:
 *   1. Owner name often appears in the business name itself ("Hector's Mobile Auto" → Hector)
 *   2. Facebook + Yelp listings often expose contact info
 *   3. Generate candidate emails from owner first name + likely domain patterns
 *   4. Verify candidates with QuickEmail / Hunter
 *
 * This file is a single-file v1. Split into lib/enrich/* if it grows past ~500 lines.
 */

export type LeadInput = {
  business_name: string;
  city: string;
  niche: string;
  phone?: string | null;
};

export type EnrichmentResult = {
  owner_first_name?: string;
  owner_last_name?: string;
  owner_title?: string;
  email?: string;
  email_status?: "valid" | "invalid" | "catch-all" | "unknown" | "skipped";
  company_domain?: string;
  facebook_url?: string;
  raw: Record<string, unknown>;
};

// ─── Provider: Serper (Google search) ───────────────────────────────────

type SerperOrganicResult = { title: string; link: string; snippet?: string };

async function serperSearch(q: string): Promise<SerperOrganicResult[]> {
  const key = process.env.SERPER_API_KEY;
  if (!key) return [];
  const res = await fetch("https://google.serper.dev/search", {
    method: "POST",
    headers: { "X-API-KEY": key, "Content-Type": "application/json" },
    body: JSON.stringify({ q, num: 10 }),
  });
  if (!res.ok) return [];
  const data = (await res.json()) as { organic?: SerperOrganicResult[] };
  return data.organic ?? [];
}

// ─── Provider: Apollo organization enrich (works on free tier) ──────────

type ApolloOrg = {
  primary_domain?: string;
  website_url?: string;
  industry?: string;
  estimated_num_employees?: number;
  linkedin_url?: string;
  phone?: string;
};

async function apolloEnrichOrg(domainOrName: string): Promise<ApolloOrg | null> {
  const key = process.env.APOLLO_API_KEY;
  if (!key) return null;
  const url = new URL("https://api.apollo.io/api/v1/organizations/enrich");
  if (domainOrName.includes(".")) {
    url.searchParams.set("domain", domainOrName);
  } else {
    // Apollo /organizations/enrich requires domain — name-based search needs paid plan.
    return null;
  }
  const res = await fetch(url.toString(), {
    headers: { "X-Api-Key": key, "Cache-Control": "no-cache" },
  });
  if (!res.ok) return null;
  const data = (await res.json()) as { organization?: ApolloOrg };
  return data.organization ?? null;
}

// ─── Provider: AbstractAPI company enrichment (requires domain) ─────────

async function abstractCompanyEnrich(domain: string): Promise<Record<string, unknown> | null> {
  const key = process.env.ABSTRACTAPI_KEY;
  if (!key || !domain) return null;
  const res = await fetch(
    `https://companyenrichment.abstractapi.com/v2/?api_key=${key}&domain=${encodeURIComponent(domain)}`,
  );
  if (!res.ok) return null;
  return (await res.json()) as Record<string, unknown>;
}

// ─── Provider: BuiltWith tech stack (requires domain) ───────────────────

async function builtwithStack(domain: string): Promise<Record<string, unknown> | null> {
  const key = process.env.BUILTWITH_API_KEY;
  if (!key || !domain) return null;
  const res = await fetch(
    `https://api.builtwith.com/free1/api.json?KEY=${key}&LOOKUP=${encodeURIComponent(domain)}`,
  );
  if (!res.ok) return null;
  return (await res.json()) as Record<string, unknown>;
}

// ─── Provider: LeadMagic email finder ──────────────────────────────────
// Sometimes returns an email when our pattern-guess + QuickEmail miss.
// Best for cases where we have an owner first name + a real domain.

type LeadMagicEmailResult = {
  email?: string;
  status?: string;
  credits_consumed?: number;
};

async function leadMagicFindEmail(
  firstName: string,
  lastName: string | undefined,
  domain: string,
): Promise<LeadMagicEmailResult | null> {
  const key = process.env.LEADMAGIC_API_KEY;
  if (!key || !firstName || !domain) return null;
  try {
    const res = await fetch("https://api.leadmagic.io/email-finder", {
      method: "POST",
      headers: { "X-API-Key": key, "Content-Type": "application/json" },
      body: JSON.stringify({
        first_name: firstName,
        last_name: lastName ?? "",
        domain,
      }),
    });
    if (!res.ok) return null;
    return (await res.json()) as LeadMagicEmailResult;
  } catch {
    return null;
  }
}

// LeadMagic mobile-finder — separate endpoint, can yield phone when email misses.

async function leadMagicFindMobile(
  firstName: string,
  lastName: string | undefined,
  company: string,
): Promise<Record<string, unknown> | null> {
  const key = process.env.LEADMAGIC_API_KEY;
  if (!key || !firstName || !company) return null;
  try {
    const res = await fetch("https://api.leadmagic.io/mobile-finder", {
      method: "POST",
      headers: { "X-API-Key": key, "Content-Type": "application/json" },
      body: JSON.stringify({
        first_name: firstName,
        last_name: lastName ?? "",
        company_name: company,
      }),
    });
    if (!res.ok) return null;
    return (await res.json()) as Record<string, unknown>;
  } catch {
    return null;
  }
}

// ─── Provider: Hunter email verifier ────────────────────────────────────

type HunterVerifyResult = {
  status?: "valid" | "invalid" | "accept_all" | "webmail" | "disposable" | "unknown";
  score?: number;
};

async function hunterVerify(email: string): Promise<HunterVerifyResult | null> {
  const key = process.env.HUNTER_API_KEY;
  if (!key) return null;
  const res = await fetch(
    `https://api.hunter.io/v2/email-verifier?email=${encodeURIComponent(email)}&api_key=${key}`,
  );
  if (!res.ok) return null;
  const data = (await res.json()) as { data?: HunterVerifyResult };
  return data.data ?? null;
}

// ─── Provider: QuickEmailVerification ───────────────────────────────────

type QuickEmailResult = { result?: string; reason?: string; safe_to_send?: string };

async function quickemailVerify(email: string): Promise<QuickEmailResult | null> {
  const key = process.env.QUICKEMAIL_API_KEY;
  if (!key) return null;
  const res = await fetch(
    `https://api.quickemailverification.com/v1/verify?email=${encodeURIComponent(email)}&apikey=${key}`,
  );
  if (!res.ok) return null;
  return (await res.json()) as QuickEmailResult;
}

// ─── Owner-name extraction from business name ──────────────────────────
// Catches: "Hector's Mobile Auto", "Joe's Plumbing & Drain", "Maria Garcia Hair Studio"
// Misses: generic names like "Bayou City Plumbing", "Greenline Landscape" — returns null

export function guessOwnerName(businessName: string): { first?: string; last?: string } {
  // Possessive form: "Pat's", "Hector's", "Maria's" — handle straight + curly apostrophes (', ', ‛)
  const possessive = businessName.match(/^([A-Z][a-z]+)['‘’ʼ]s\b/);
  if (possessive) return { first: possessive[1] };

  // "Firstname Lastname" prefix — skip if both words are generic descriptors
  const firstWords = businessName.match(/^([A-Z][a-z]+)\s+([A-Z][a-z]+)\b/);
  if (firstWords) {
    const generic = /^(the|best|premier|elite|royal|gold|silver|new|old|first|big|little|mobile|local|bayou|city|greenline|riverside|sunrise|sunset|north|south|east|west|main|grand|pro|professional)$/i;
    if (!generic.test(firstWords[1]) && !generic.test(firstWords[2])) {
      return { first: firstWords[1], last: firstWords[2] };
    }
  }
  return {};
}

// ─── Domain-pattern generation ──────────────────────────────────────────

function nameToDomainCandidates(businessName: string): string[] {
  const slug = businessName
    .toLowerCase()
    .replace(/[''`]s\b/g, "s")
    .replace(/&/g, "and")
    .replace(/[^a-z0-9]+/g, "");
  const compact = slug.slice(0, 30);
  return [`${compact}.com`, `${compact}.net`];
}

// ─── Email-pattern generation ───────────────────────────────────────────

function emailCandidates(domain: string, firstName?: string): string[] {
  const out = [`info@${domain}`, `contact@${domain}`, `hello@${domain}`];
  if (firstName) {
    const fn = firstName.toLowerCase();
    out.unshift(`${fn}@${domain}`);
  }
  return out;
}

// ─── Waterfall orchestrator ─────────────────────────────────────────────

export async function enrichLead(lead: LeadInput): Promise<EnrichmentResult> {
  const raw: Record<string, unknown> = {};

  // 1. Owner-name guess from business name (free, no API)
  const owner = guessOwnerName(lead.business_name);
  raw.guessed_owner = owner;

  // 2. Serper — find Facebook / Yelp / personal site
  const serperResults = await serperSearch(
    `"${lead.business_name}" "${lead.city}" (facebook OR yelp OR linkedin)`,
  );
  raw.serper = serperResults.slice(0, 5);

  let facebookUrl: string | undefined;
  let candidateDomain: string | undefined;
  for (const r of serperResults) {
    const url = r.link;
    if (!facebookUrl && /facebook\.com/.test(url)) facebookUrl = url;
    if (!candidateDomain && /^https?:\/\/(www\.)?[^./]+\.[^./]+\/?$/.test(url) && !/(facebook|yelp|google|linkedin|instagram|tiktok|youtube|twitter)\.com/.test(url)) {
      try {
        candidateDomain = new URL(url).hostname.replace(/^www\./, "");
      } catch {
        // Invalid URL, skip
      }
    }
  }

  // 3. If no domain found in search, try heuristic patterns
  if (!candidateDomain) {
    for (const cand of nameToDomainCandidates(lead.business_name)) {
      try {
        const probe = await fetch(`https://${cand}`, { method: "HEAD", redirect: "follow", signal: AbortSignal.timeout(4000) });
        if (probe.ok || probe.status < 400) {
          candidateDomain = cand;
          break;
        }
      } catch {
        // DNS miss or timeout — try next
      }
    }
  }
  raw.candidate_domain = candidateDomain;

  // 4. If we have a domain, enrich it
  if (candidateDomain) {
    raw.apollo_org = await apolloEnrichOrg(candidateDomain);
    raw.abstractapi = await abstractCompanyEnrich(candidateDomain);
    raw.builtwith = await builtwithStack(candidateDomain);
  }

  // 4b. LeadMagic — try email-finder if we have first name + domain.
  // This often hits when our pattern-guess would miss (e.g. firstname.lastname@domain).
  let chosenEmail: string | undefined;
  let chosenStatus: EnrichmentResult["email_status"];
  if (owner.first && candidateDomain) {
    const lm = await leadMagicFindEmail(owner.first, owner.last, candidateDomain);
    raw.leadmagic_email = lm;
    if (lm?.email && /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(lm.email)) {
      chosenEmail = lm.email;
      chosenStatus = "valid"; // LeadMagic only returns verified emails
    }
  }

  // 4c. LeadMagic mobile-finder — even without a domain, business name might hit.
  if (owner.first && !chosenEmail) {
    const lmMobile = await leadMagicFindMobile(owner.first, owner.last, lead.business_name);
    raw.leadmagic_mobile = lmMobile;
  }

  // 5. Email candidates + verification (pattern fallback if LeadMagic missed)
  if (!chosenEmail && candidateDomain) {
    const candidates = emailCandidates(candidateDomain, owner.first);
    for (const c of candidates) {
      // Prefer QuickEmail (paid, more accurate) then Hunter
      const qe = await quickemailVerify(c);
      raw[`quickemail_${c}`] = qe;
      if (qe?.result === "valid" || qe?.safe_to_send === "yes") {
        chosenEmail = c;
        chosenStatus = "valid";
        break;
      }
      if (qe?.result === "accept_all") {
        chosenEmail ??= c;
        chosenStatus = "catch-all";
        // keep going — prefer a hard valid over catch-all
      }
    }
    if (!chosenEmail) {
      // Fallback: Hunter verify on the most likely candidate
      const fallback = candidates[0];
      const hv = await hunterVerify(fallback);
      raw[`hunter_${fallback}`] = hv;
      if (hv?.status === "valid") {
        chosenEmail = fallback;
        chosenStatus = "valid";
      } else if (hv?.status === "accept_all") {
        chosenEmail = fallback;
        chosenStatus = "catch-all";
      }
    }
  }

  return {
    owner_first_name: owner.first,
    owner_last_name: owner.last,
    email: chosenEmail,
    email_status: chosenEmail ? chosenStatus ?? "unknown" : "skipped",
    company_domain: candidateDomain,
    facebook_url: facebookUrl,
    raw,
  };
}
