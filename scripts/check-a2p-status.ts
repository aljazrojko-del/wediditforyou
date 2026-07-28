/**
 * A2P 10DLC clearance check — closed-loop, no leads touched.
 * Sends a tiny test SMS FROM each of the 5 city numbers TO one of the other
 * owned numbers. Outbound US 10DLC SMS is A2P-gated regardless of destination,
 * so a success here proves the sending number's campaign is approved.
 * Run: npx tsx --env-file=.env.local scripts/check-a2p-status.ts
 */
import { SignalWireClient } from "../lib/signalwire-client";

const NUMBERS = [
  { city: "Houston", num: process.env.SIGNALWIRE_PHONE_HOUSTON! },
  { city: "Phoenix", num: process.env.SIGNALWIRE_PHONE_PHOENIX! },
  { city: "Dallas", num: process.env.SIGNALWIRE_PHONE_DALLAS! },
  { city: "Nashville", num: process.env.SIGNALWIRE_PHONE_NASHVILLE! },
  { city: "Chicago", num: process.env.SIGNALWIRE_PHONE_CHICAGO! },
];

async function main() {
  const sw = new SignalWireClient();

  // Sanity: list provisioned numbers + capabilities.
  console.log("=== Provisioned numbers (SignalWire account) ===");
  const provisioned = await sw.listNumbers();
  for (const n of provisioned) {
    console.log(
      `  ${n.phone_number}  ${n.friendly_name}  caps=${JSON.stringify(n.capabilities)}`,
    );
  }
  console.log("");

  console.log("=== A2P send test (from each city number → Houston) ===");
  for (const { city, num } of NUMBERS) {
    // Send to Houston; Houston sends to Phoenix so it also gets tested.
    const to =
      num === process.env.SIGNALWIRE_PHONE_HOUSTON
        ? process.env.SIGNALWIRE_PHONE_PHOENIX!
        : process.env.SIGNALWIRE_PHONE_HOUSTON!;
    const r = await sw.sendSms({
      from: num,
      to,
      body: `A2P clearance test from ${city}`,
    });
    if (r.ok) {
      console.log(`  ✅ ${city} (${num}) → ${to}  SENT  sid=${r.sid}`);
    } else {
      console.log(`  ❌ ${city} (${num}) → ${to}  FAILED  ${r.error}`);
    }
  }
}

main().catch((e) => {
  console.error("FATAL:", e.message);
  process.exit(1);
});
