export type NicheKey = "plumber" | "hair" | "auto" | "landscape" | "groomer" | "tutor";

export type Service = { title: string; description: string };
export type Review  = { quote: string; name: string };

// Optional per-lead color theme override. Customer describes their preference
// ("warmer, brighter, orange and cream") via the change-request form; Claude
// converts it into this structured hex palette; templates render with it.
// Null on any field = use the template's default for that role.
export type Theme = {
  bg?: string;              // page background
  accent?: string;          // primary CTA color
  accentContrast?: string;  // text/icon color on top of accent (for legibility)
  text?: string;            // main body text color
  textMuted?: string;       // secondary/captions text
};

export type SiteData = {
  slug: string;
  businessName: string;
  niche: NicheKey;
  city: string;
  phone: string | null;
  address: string | null;
  rating: number | null;
  ratingCount: number | null;
  headline: string;
  subheadline: string;
  services: Service[];
  reviews: Review[];
  about: string;
  heroImage: string;
  gallery: { src: string; cap: string }[];
  theme: Theme | null;
};
