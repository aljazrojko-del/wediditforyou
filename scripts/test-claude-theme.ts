// Local test of applyChangeWithClaude to debug the "Connection error"
import "./load-env";
import { applyChangeWithClaude } from "../lib/customer-changes";

async function main() {
  const current = {
    headline: "Houston's most trusted mobile mechanic.",
    subheadline: "Honest, friendly, and at your driveway in under an hour. Most jobs done same day. Fair prices, no upsells, real work.",
    services: null,
    reviews: null,
    about_text: null,
    theme: null,
  };
  const desc = "Change theme to warm cream background, sunset orange accents, dark brown text. Brighter and warmer.";

  console.log("Calling Claude...");
  const result = await applyChangeWithClaude(current, desc);
  console.log("Result:", JSON.stringify(result, null, 2));
}

main().catch((e) => {
  console.error("[error]", e);
  process.exit(1);
});
