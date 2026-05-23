import type { NicheKey } from "./types";

type ImageBank = { hero: string; gallery: { src: string; cap: string }[] };

export const IMAGE_BANK: Record<NicheKey, ImageBank> = {
  plumber: {
    hero: "https://images.unsplash.com/photo-1620653713380-7a34b773fef8?w=1600&q=80&auto=format&fit=crop",
    gallery: [
      { src: "https://images.unsplash.com/photo-1676210134188-4c05dd172f89?w=900&q=80&auto=format&fit=crop", cap: "Drain line replacement" },
      { src: "https://images.unsplash.com/photo-1542013936693-884638332954?w=900&q=80&auto=format&fit=crop", cap: "Tankless water heater" },
      { src: "https://images.unsplash.com/photo-1676210133055-eab6ef033ce3?w=900&q=80&auto=format&fit=crop", cap: "Repipe job" },
      { src: "https://images.unsplash.com/photo-1517646287270-a5a9ca602e5c?w=900&q=80&auto=format&fit=crop", cap: "Emergency leak repair" },
    ],
  },
  hair: {
    hero: "https://images.unsplash.com/photo-1521590832167-7bcbfaa6381f?w=1400&q=80&auto=format&fit=crop",
    gallery: [
      { src: "https://images.unsplash.com/photo-1634449571010-02389ed0f9b0?w=900&q=80&auto=format&fit=crop", cap: "Honey balayage" },
      { src: "https://images.unsplash.com/photo-1580618672591-eb180b1a973f?w=900&q=80&auto=format&fit=crop", cap: "Bridal styling" },
      { src: "https://images.unsplash.com/photo-1595475884562-073c30d45670?w=900&q=80&auto=format&fit=crop", cap: "Editorial cut" },
      { src: "https://images.unsplash.com/photo-1503951914875-452162b0f3f1?w=900&q=80&auto=format&fit=crop", cap: "Color refresh" },
    ],
  },
  auto: {
    hero: "https://images.unsplash.com/photo-1632823469850-2f77dd9c7f93?w=1600&q=80&auto=format&fit=crop",
    // Curated photos hosted locally — each matches its caption.
    // Source images live in /public/gallery/auto/*.jpg (compressed from
    // originals to keep static-asset size reasonable).
    gallery: [
      { src: "/gallery/auto/oil-change.jpg",          cap: "Mobile oil change" },
      { src: "/gallery/auto/brake-service.jpg",       cap: "Brake service on-site" },
      { src: "/gallery/auto/diagnostic-scan.jpg",     cap: "Diagnostic scan" },
      { src: "/gallery/auto/battery-replacement.jpg", cap: "Battery replacement" },
    ],
  },
  landscape: {
    hero: "https://images.unsplash.com/photo-1558904541-efa843a96f01?w=1600&q=80&auto=format&fit=crop",
    gallery: [
      { src: "https://images.unsplash.com/photo-1416879595882-3373a0480b5b?w=900&q=80&auto=format&fit=crop", cap: "Lawn renovation" },
      { src: "https://images.unsplash.com/photo-1585320806297-9794b3e4eeae?w=900&q=80&auto=format&fit=crop", cap: "Hedge & tree work" },
      { src: "https://images.unsplash.com/photo-1542204625-ca960e360efa?w=900&q=80&auto=format&fit=crop", cap: "Garden install" },
      { src: "https://images.unsplash.com/photo-1599629954294-14df9ec8bc4d?w=900&q=80&auto=format&fit=crop", cap: "Weekly maintenance" },
    ],
  },
  groomer: {
    hero: "https://images.unsplash.com/photo-1583337130417-3346a1be7dee?w=1600&q=80&auto=format&fit=crop",
    gallery: [
      { src: "https://images.unsplash.com/photo-1587300003388-59208cc962cb?w=900&q=80&auto=format&fit=crop", cap: "Full coat groom" },
      { src: "https://images.unsplash.com/photo-1548199973-03cce0bbc87b?w=900&q=80&auto=format&fit=crop", cap: "Breed-specific cut" },
      { src: "https://images.unsplash.com/photo-1450778869180-41d0601e046e?w=900&q=80&auto=format&fit=crop", cap: "Nail trim & paw care" },
      { src: "https://images.unsplash.com/photo-1561037404-61cd46aa615b?w=900&q=80&auto=format&fit=crop", cap: "Bath & blow-out" },
    ],
  },
  tutor: {
    hero: "https://images.unsplash.com/photo-1497633762265-9d179a990aa6?w=1600&q=80&auto=format&fit=crop",
    gallery: [
      { src: "https://images.unsplash.com/photo-1503676260728-1c00da094a0b?w=900&q=80&auto=format&fit=crop", cap: "One-on-one session" },
      { src: "https://images.unsplash.com/photo-1456513080510-7bf3a84b82f8?w=900&q=80&auto=format&fit=crop", cap: "Test prep" },
      { src: "https://images.unsplash.com/photo-1481627834876-b7833e8f5570?w=900&q=80&auto=format&fit=crop", cap: "Homework help" },
      { src: "https://images.unsplash.com/photo-1577896851231-70ef18881754?w=900&q=80&auto=format&fit=crop", cap: "Subject deep dives" },
    ],
  },
};
