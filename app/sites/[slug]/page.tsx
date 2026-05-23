import type { Metadata } from "next";
import { notFound } from "next/navigation";
import { createClient } from "@supabase/supabase-js";
import type {
  NicheKey,
  Review,
  Service,
  SiteData,
} from "../_templates/types";
import { TEMPLATES, normalizeNiche } from "../_templates/registry";
import { IMAGE_BANK } from "../_templates/images";

type LeadRow = {
  name: string;
  slug: string;
  niche: string;
  city: string;
  phone: string | null;
  address: string | null;
  rating: number | null;
  rating_count: number | null;
  headline: string | null;
  subheadline: string | null;
  services: Service[] | null;
  reviews: Review[] | null;
  about_text: string | null;
};

async function loadLead(slug: string): Promise<SiteData | null> {
  const url = process.env.SUPABASE_URL;
  const key = process.env.SUPABASE_SERVICE_ROLE_KEY;
  console.error("[sites/slug] DEBUG slug=", slug, "url_len=", url?.length ?? 0, "key_len=", key?.length ?? 0);
  if (!url || !key) {
    console.error("[sites/slug] MISSING env vars");
    return null;
  }
  const supabase = createClient(url, key, { auth: { persistSession: false } });
  const { data, error } = await supabase
    .from("leads")
    .select("name, slug, niche, city, phone, address, rating, rating_count, headline, subheadline, services, reviews, about_text")
    .eq("slug", slug)
    .maybeSingle<LeadRow>();
  if (error) {
    console.error("[sites/slug] QUERY ERROR:", error.message, error.code);
    return null;
  }
  if (!data) {
    console.error("[sites/slug] NO ROW for slug:", slug);
    return null;
  }

  const niche: NicheKey = normalizeNiche(data.niche) ?? "plumber";
  const bank = IMAGE_BANK[niche];

  // If a lead in the DB pre-dates the AI-content expansion, fall back per niche.
  const services: Service[] = Array.isArray(data.services) && data.services.length > 0
    ? data.services
    : [];
  const reviews: Review[] = Array.isArray(data.reviews) && data.reviews.length > 0
    ? data.reviews
    : [];

  return {
    slug: data.slug,
    businessName: data.name,
    niche,
    city: data.city,
    phone: data.phone,
    address: data.address,
    rating: data.rating,
    ratingCount: data.rating_count,
    headline: data.headline ?? `${data.city} ${niche}. Done right.`,
    subheadline: data.subheadline ?? "",
    services,
    reviews,
    about: data.about_text ?? "",
    heroImage: bank.hero,
    gallery: bank.gallery.map((g) => ({ ...g, cap: `${g.cap} · ${data.city}` })),
  };
}

export async function generateMetadata(
  props: { params: Promise<{ slug: string }> }
): Promise<Metadata> {
  const { slug } = await props.params;
  const data = await loadLead(slug);
  if (!data) return { title: "Site not found" };
  return {
    title: `${data.businessName} — ${data.city}`,
    description: data.headline,
  };
}

export default async function SitePage(
  props: { params: Promise<{ slug: string }> }
) {
  const { slug } = await props.params;
  const data = await loadLead(slug);
  if (!data) notFound();
  const Template = TEMPLATES[data.niche];
  return <Template data={data} />;
}
