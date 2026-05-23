// Tiny .env.local loader — no extra deps, runs as a side-effect import.
// Imported FIRST in pull-leads.ts so process.env is populated before db.ts runs.

import { readFileSync } from "node:fs";

try {
  const text = readFileSync(".env.local", "utf-8");
  for (const line of text.split(/\r?\n/)) {
    const m = line.match(/^\s*([A-Z_][A-Z0-9_]*)\s*=\s*(.*)\s*$/);
    if (m && !process.env[m[1]]) {
      process.env[m[1]] = m[2].trim().replace(/^["']|["']$/g, "");
    }
  }
} catch {
  // No .env.local — fall back to whatever is already in the environment.
}
