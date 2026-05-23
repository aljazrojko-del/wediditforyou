export type NicheKey = "plumber" | "hair" | "auto" | "landscape" | "groomer" | "tutor";

export type Service = { title: string; description: string };
export type Review  = { quote: string; name: string };

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
};
