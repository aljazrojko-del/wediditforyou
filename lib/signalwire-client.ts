/**
 * SignalWire LaML client — voice + SMS for per-city local-area-code outreach.
 *
 * Auth: Basic auth with PROJECT_ID as username, TOKEN as password.
 * Base URL: https://{SPACE_URL}/api/laml/2010-04-01
 *
 * Voice calls work immediately. SMS requires A2P 10DLC + brand approval at
 * the SignalWire dashboard before non-Houston numbers can send.
 */

const REGION_PREFIXES: Array<{ city: string; envKey: string }> = [
  { city: "Houston", envKey: "SIGNALWIRE_PHONE_HOUSTON" },
  { city: "Phoenix", envKey: "SIGNALWIRE_PHONE_PHOENIX" },
  { city: "Dallas", envKey: "SIGNALWIRE_PHONE_DALLAS" },
  { city: "Nashville", envKey: "SIGNALWIRE_PHONE_NASHVILLE" },
  { city: "Chicago", envKey: "SIGNALWIRE_PHONE_CHICAGO" },
];

export type CallResult = {
  ok: boolean;
  sid?: string;
  status?: string;
  error?: string;
};

export type SmsResult = {
  ok: boolean;
  sid?: string;
  error?: string;
};

export class SignalWireClient {
  private projectId: string;
  private token: string;
  private base: string;

  constructor(opts?: { projectId?: string; token?: string; spaceUrl?: string }) {
    this.projectId = opts?.projectId ?? process.env.SIGNALWIRE_PROJECT_ID ?? "";
    this.token = opts?.token ?? process.env.SIGNALWIRE_TOKEN ?? "";
    const space = opts?.spaceUrl ?? process.env.SIGNALWIRE_SPACE_URL ?? "";
    if (!this.projectId || !this.token || !space) {
      throw new Error(
        "Missing SIGNALWIRE_PROJECT_ID / SIGNALWIRE_TOKEN / SIGNALWIRE_SPACE_URL in env.",
      );
    }
    this.base = `https://${space}/api/laml/2010-04-01/Accounts/${this.projectId}`;
  }

  private get authHeader() {
    return "Basic " + Buffer.from(`${this.projectId}:${this.token}`).toString("base64");
  }

  /**
   * Pick the right outbound number for a lead's city. Falls back to Houston
   * if no city match. Returns null if no number is configured at all.
   */
  pickFromNumber(city: string | null | undefined): string | null {
    if (city) {
      for (const r of REGION_PREFIXES) {
        if (city.toLowerCase().includes(r.city.toLowerCase())) {
          const num = process.env[r.envKey];
          if (num) return num;
        }
      }
    }
    return process.env.SIGNALWIRE_PHONE_HOUSTON ?? null;
  }

  /**
   * Place an outbound call. SignalWire fetches `twimlUrl` when the call is
   * answered to know what to say or do. For a quick test, use a Twimlets URL
   * with an inline message; for personalized scripts, host the TwiML on your
   * own Next.js app (e.g. https://wedidit4you.com/api/twiml/call/{slug}).
   */
  async makeCall(opts: {
    from: string;
    to: string;
    twimlUrl: string;
    statusCallback?: string;
  }): Promise<CallResult> {
    const form = new URLSearchParams({
      From: opts.from,
      To: opts.to,
      Url: opts.twimlUrl,
    });
    if (opts.statusCallback) form.set("StatusCallback", opts.statusCallback);

    try {
      const res = await fetch(`${this.base}/Calls.json`, {
        method: "POST",
        headers: {
          Authorization: this.authHeader,
          "Content-Type": "application/x-www-form-urlencoded",
        },
        body: form.toString(),
      });
      const data = (await res.json()) as Record<string, unknown>;
      if (!res.ok) {
        return {
          ok: false,
          error: `${res.status}: ${(data?.message as string) ?? JSON.stringify(data)}`,
        };
      }
      return {
        ok: true,
        sid: data.sid as string,
        status: data.status as string,
      };
    } catch (e) {
      return { ok: false, error: (e as Error).message };
    }
  }

  /** Send SMS. Will return 403 / "not approved" until A2P 10DLC + brand are registered. */
  async sendSms(opts: { from: string; to: string; body: string }): Promise<SmsResult> {
    const form = new URLSearchParams({
      From: opts.from,
      To: opts.to,
      Body: opts.body,
    });

    try {
      const res = await fetch(`${this.base}/Messages.json`, {
        method: "POST",
        headers: {
          Authorization: this.authHeader,
          "Content-Type": "application/x-www-form-urlencoded",
        },
        body: form.toString(),
      });
      const data = (await res.json()) as Record<string, unknown>;
      if (!res.ok) {
        return {
          ok: false,
          error: `${res.status}: ${(data?.message as string) ?? JSON.stringify(data)}`,
        };
      }
      return { ok: true, sid: data.sid as string };
    } catch (e) {
      return { ok: false, error: (e as Error).message };
    }
  }

  /** List provisioned numbers — useful for diagnostics. */
  async listNumbers(): Promise<
    Array<{ phone_number: string; friendly_name: string; capabilities: Record<string, boolean> }>
  > {
    const res = await fetch(`${this.base}/IncomingPhoneNumbers.json`, {
      headers: { Authorization: this.authHeader },
    });
    if (!res.ok) throw new Error(`SignalWire listNumbers ${res.status}`);
    const data = (await res.json()) as {
      incoming_phone_numbers: Array<{
        phone_number: string;
        friendly_name: string;
        capabilities: Record<string, boolean>;
      }>;
    };
    return data.incoming_phone_numbers ?? [];
  }
}
