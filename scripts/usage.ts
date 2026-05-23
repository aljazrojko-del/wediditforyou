// Local Google Places API usage tracker.
// Persists monthly call count + estimated spend to scripts/.usage/<YYYY-MM>.json.
// Hard-stops the script at HARD_CAP_AT, warns at WARN_AT.
//
// IMPORTANT: this is a *local* counter. It only knows about calls THIS script
// makes. The real safety net is Google Cloud Budget Alerts + API quota caps —
// see README in scripts/.usage/ after first run.

import { readFileSync, writeFileSync, mkdirSync } from "node:fs";
import { join } from "node:path";

const USAGE_DIR = "scripts/.usage";

// Defaults are conservative (high cost / low cap) so we trip early. Override
// with env vars once you confirm your actual SKU pricing.
const COST_PER_CALL = parseFloat(process.env.PLACES_COST_PER_CALL_USD ?? "0.04");
const MONTHLY_BUDGET = parseFloat(process.env.PLACES_MONTHLY_BUDGET_USD ?? "200");
const WARN_AT = parseFloat(process.env.PLACES_WARN_AT ?? "0.80");
const HARD_CAP_AT = parseFloat(process.env.PLACES_HARD_CAP_AT ?? "0.90");

type Usage = {
  month: string;
  calls: number;
  spendUsd: number;
  lastUpdated: string;
};

function currentMonth(): string {
  const d = new Date();
  return `${d.getUTCFullYear()}-${String(d.getUTCMonth() + 1).padStart(2, "0")}`;
}

function filePath(): string {
  return join(USAGE_DIR, `${currentMonth()}.json`);
}

export function read(): Usage {
  try {
    const data = JSON.parse(readFileSync(filePath(), "utf-8")) as Usage;
    if (data.month === currentMonth()) return data;
  } catch {
    // Missing or unreadable — fresh month.
  }
  return {
    month: currentMonth(),
    calls: 0,
    spendUsd: 0,
    lastUpdated: new Date().toISOString(),
  };
}

function write(u: Usage): void {
  mkdirSync(USAGE_DIR, { recursive: true });
  writeFileSync(filePath(), JSON.stringify(u, null, 2));
}

let warnedThisRun = false;

export function checkBeforeCall(): void {
  const u = read();
  const pct = u.spendUsd / MONTHLY_BUDGET;
  if (pct >= HARD_CAP_AT) {
    throw new Error(
      `[budget] HARD STOP — current spend $${u.spendUsd.toFixed(2)} of ` +
        `$${MONTHLY_BUDGET} (${(pct * 100).toFixed(1)}%) is at or above ` +
        `${(HARD_CAP_AT * 100).toFixed(0)}% cap. Refusing more API calls. ` +
        `Wait until next month or raise PLACES_MONTHLY_BUDGET_USD.`,
    );
  }
  if (pct >= WARN_AT && !warnedThisRun) {
    console.warn(
      `[budget] WARNING — at ${(pct * 100).toFixed(1)}% of monthly budget ` +
        `($${u.spendUsd.toFixed(2)} / $${MONTHLY_BUDGET}). ` +
        `Hard stop at ${(HARD_CAP_AT * 100).toFixed(0)}%.`,
    );
    warnedThisRun = true;
  }
}

export function recordCall(): Usage {
  const u = read();
  u.calls += 1;
  u.spendUsd = +(u.calls * COST_PER_CALL).toFixed(4);
  u.lastUpdated = new Date().toISOString();
  write(u);
  return u;
}

export function summary(): string {
  const u = read();
  const pct = (u.spendUsd / MONTHLY_BUDGET) * 100;
  return [
    `[budget] month=${u.month}  calls=${u.calls}  ` +
      `spend=$${u.spendUsd.toFixed(2)} of $${MONTHLY_BUDGET} ` +
      `(${pct.toFixed(1)}%)  warn=${(WARN_AT * 100).toFixed(0)}%  ` +
      `cap=${(HARD_CAP_AT * 100).toFixed(0)}%`,
  ].join("\n");
}
