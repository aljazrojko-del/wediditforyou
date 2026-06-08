// Porkbun + Vercel API client for end-to-end domain registration.
//
// Flow:
//   1. checkAvailability(domain)              — confirms it's buyable
//   2. registerDomain(domain)                 — buys it (charges Porkbun account)
//   3. setVercelDomain(projectId, domain)     — attaches to Vercel project
//   4. setPorkbunDnsCname(domain)             — points DNS at Vercel
//
// Notes:
//   - Porkbun API uses POST with api_key + secretapikey in JSON body for ALL calls
//   - Vercel API uses Bearer token in Authorization header
//   - Charges are real money — only call registerDomain() after explicit user opt-in

const PB_BASE = "https://api.porkbun.com/api/json/v3";

type PbAuth = { apikey: string; secretapikey: string };

function pbAuth(): PbAuth {
  const apikey = process.env.PORKBUN_API_KEY;
  const secretapikey = process.env.PORKBUN_SECRET_KEY;
  if (!apikey || !secretapikey) throw new Error("Porkbun env not set");
  return { apikey, secretapikey };
}

export async function checkAvailability(
  domain: string,
): Promise<{ available: boolean; price?: string; error?: string }> {
  try {
    const res = await fetch(`${PB_BASE}/domain/checkAvailability/${domain}`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(pbAuth()),
    });
    const data = (await res.json()) as {
      status: string;
      response?: { avail: string; price?: string };
      message?: string;
    };
    if (data.status !== "SUCCESS")
      return { available: false, error: data.message ?? "Porkbun rejected check" };
    return {
      available: data.response?.avail === "yes",
      price: data.response?.price,
    };
  } catch (e) {
    return { available: false, error: (e as Error).message };
  }
}

export async function registerDomain(
  domain: string,
  years = 1,
): Promise<{ ok: boolean; error?: string }> {
  try {
    const res = await fetch(`${PB_BASE}/domain/register/${domain}`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ ...pbAuth(), years }),
    });
    const data = (await res.json()) as { status: string; message?: string };
    if (data.status !== "SUCCESS")
      return { ok: false, error: data.message ?? "register failed" };
    return { ok: true };
  } catch (e) {
    return { ok: false, error: (e as Error).message };
  }
}

export async function setPorkbunCnameToVercel(
  domain: string,
): Promise<{ ok: boolean; error?: string }> {
  try {
    // Two records: A @ -> 76.76.21.21, and CNAME www -> cname.vercel-dns.com
    const a = await fetch(`${PB_BASE}/dns/create/${domain}`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        ...pbAuth(),
        type: "A",
        name: "",
        content: "76.76.21.21",
        ttl: 600,
      }),
    });
    if (!a.ok) return { ok: false, error: `A record: ${await a.text()}` };

    const cname = await fetch(`${PB_BASE}/dns/create/${domain}`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        ...pbAuth(),
        type: "CNAME",
        name: "www",
        content: "cname.vercel-dns.com",
        ttl: 600,
      }),
    });
    if (!cname.ok) return { ok: false, error: `CNAME: ${await cname.text()}` };
    return { ok: true };
  } catch (e) {
    return { ok: false, error: (e as Error).message };
  }
}

export async function addDomainToVercel(
  domain: string,
): Promise<{ ok: boolean; error?: string }> {
  const token = process.env.VERCEL_API_TOKEN;
  const projectId = process.env.VERCEL_PROJECT_ID;
  if (!token || !projectId)
    return { ok: false, error: "VERCEL_API_TOKEN or VERCEL_PROJECT_ID not set" };
  try {
    const res = await fetch(
      `https://api.vercel.com/v10/projects/${projectId}/domains`,
      {
        method: "POST",
        headers: {
          Authorization: `Bearer ${token}`,
          "Content-Type": "application/json",
        },
        body: JSON.stringify({ name: domain }),
      },
    );
    if (res.status === 200 || res.status === 201) return { ok: true };
    if (res.status === 409) return { ok: true }; // already added — idempotent
    const txt = await res.text();
    return { ok: false, error: `Vercel ${res.status}: ${txt}` };
  } catch (e) {
    return { ok: false, error: (e as Error).message };
  }
}

export function isLikelyValidDomain(input: string): boolean {
  const d = input.trim().toLowerCase();
  if (d.length < 4 || d.length > 253) return false;
  // basic check: at least one dot, only [a-z0-9-.] characters, no leading/trailing dot or hyphen
  return /^[a-z0-9](?:[a-z0-9-]*[a-z0-9])?(?:\.[a-z0-9](?:[a-z0-9-]*[a-z0-9])?)+$/.test(
    d,
  );
}
