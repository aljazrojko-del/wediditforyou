// Smoke-test the WdifyOps client against real dashboard data.
//
// Run:  npx tsx scripts/test-wdify-client.ts

import "./load-env";
import { WdifyOpsClient } from "../lib/wdify-ops-client";

async function main() {
  const username = process.env.WDIFY_OPS_USERNAME;
  const password = process.env.WDIFY_OPS_PASSWORD;
  if (!username || !password) {
    throw new Error("WDIFY_OPS_USERNAME and WDIFY_OPS_PASSWORD must be set in .env.local");
  }

  const client = new WdifyOpsClient({ username, password });

  console.log("→ login");
  const auth = await client.login();
  console.log(`  ✓ logged in as ${auth.username} · token ${auth.token.length} chars\n`);

  console.log("→ getMetricsOverview");
  const metrics = await client.getMetricsOverview();
  console.log(`  ✓ total_runs=${metrics.total_runs} · carousels_by_status=${JSON.stringify(metrics.carousels_by_status)}\n`);

  console.log("→ getPipelineRuns");
  const runs = await client.getPipelineRuns();
  console.log(`  ✓ ${runs.length} runs`);
  for (const r of runs.slice(0, 3)) {
    console.log(`    · run #${r.id}  started ${r.started_at}  completed ${r.completed_at ?? "—"}`);
  }
  console.log();

  console.log("→ getAgentStatus");
  const agent = await client.getAgentStatus();
  console.log(`  ✓ total_analyses=${agent.total_analyses} · latest_recommendation=${agent.latest_recommendation === null ? "none" : "present"}\n`);

  console.log("→ getProductsSummary({limit:5})");
  const products = await client.getProductsSummary({ limit: 5 });
  console.log(`  ✓ events=${products.total_events} · cta_clicks=${products.cta_clicks} · views=${products.views} · bookings=${products.bookings}`);
  for (const e of products.recent.slice(0, 3)) {
    console.log(`    · ${e.ts}  ${e.type}  target=${(e.payload.target as string) ?? "—"}`);
  }
  console.log();

  console.log("→ getAssistantConversations");
  const convos = await client.getAssistantConversations();
  console.log(`  ✓ ${convos.length} conversations`);
  for (const c of convos.slice(0, 3)) {
    const title = c.title.split("\n")[0].slice(0, 60);
    console.log(`    · ${c.id}  "${title}"`);
  }
  console.log();

  console.log("→ runAgent({}) [POST — triggers background RAG analysis]");
  const trigger = await client.runAgent();
  console.log(`  ✓ ${trigger.status}: ${trigger.message}\n`);

  console.log("[done] 5 reads + 1 write endpoint verified");
}

main().catch((err) => {
  console.error("[error]", err.message);
  process.exit(1);
});
