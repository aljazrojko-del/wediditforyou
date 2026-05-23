import type { ComponentType } from "react";
import type { NicheKey, SiteData } from "./types";
import TemplatePlumber from "./TemplatePlumber";
import TemplateAuto from "./TemplateAuto";
import TemplateGroomer from "./TemplateGroomer";
import TemplateTutor from "./TemplateTutor";

// Re-exported so existing imports of `from "./registry"` keep working.
export { normalizeNiche, slugify } from "./utils";

// Each focus niche has its own bespoke template. Niches we don't focus on yet
// (hair, landscape) reuse the plumber layout — they'll get their own designs
// when those niches enter the funnel.
export const TEMPLATES: Record<NicheKey, ComponentType<{ data: SiteData }>> = {
  plumber:   TemplatePlumber,
  auto:      TemplateAuto,
  groomer:   TemplateGroomer,
  tutor:     TemplateTutor,
  hair:      TemplatePlumber,
  landscape: TemplatePlumber,
};
