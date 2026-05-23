import type { NicheKey } from "./types";

// Prefix matches (word boundary on the left only) — so "plumber" matches \bplumb,
// "landscaping" matches \blandscap, "groomer" matches \bgroom, etc.
//
// Order matters: more-specific patterns first. "dog grooming" should match
// `groomer` before `hair` (which catches "stylist") could compete.
const PATTERNS: { key: NicheKey; match: RegExp }[] = [
  { key: "groomer",   match: /\b(dog groom|pet groom|mobile groom|groomer|grooming)/i },
  { key: "tutor",     match: /\b(tutor|tutoring|music teacher|piano teacher|guitar lesson|math coach|reading coach|academ)/i },
  { key: "plumber",   match: /\b(plumb|drain|pipe|leak|water heater)/i },
  { key: "auto",      match: /\b(auto|mechanic|brake|tire|oil change|car repair)/i },
  { key: "landscape", match: /\b(landscap|lawn|garden|mow|tree service|hedge|yard care)/i },
  { key: "hair",      match: /\b(hair|salon|barber|stylist|braid|balayage)/i },
];

export function normalizeNiche(raw: string): NicheKey | null {
  for (const { key, match } of PATTERNS) {
    if (match.test(raw)) return key;
  }
  return null;
}

export function slugify(name: string, city: string): string {
  const base = `${name} ${city}`
    .toLowerCase()
    .normalize("NFKD")
    .replace(/[̀-ͯ]/g, "")
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-+|-+$/g, "")
    .slice(0, 80);
  return base || "site";
}
