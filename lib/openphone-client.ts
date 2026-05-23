/**
 * OpenPhone (rebranded as Quo) API client.
 *
 * Base URL: https://api.openphone.com
 * Auth:     Raw key in `Authorization` header (NOT Bearer)
 *
 * SMS to US numbers requires A2P 10DLC campaign registration. Until that's
 * approved (1-5 days), `sendSms()` may return a 4xx with a compliance error.
 * Calls are unrestricted out of the box.
 */

const DEFAULT_BASE = "https://api.openphone.com";

export type OpenPhoneNumber = {
  id: string;
  number: string;
  formattedNumber: string;
  name: string;
  symbol?: string;
};

export type SendSmsResult = {
  ok: boolean;
  messageId?: string;
  status?: number;
  error?: string;
};

export class OpenPhoneClient {
  private apiKey: string;
  private fromNumber: string;
  private base: string;

  constructor(opts: { apiKey: string; fromNumber: string; baseUrl?: string }) {
    this.apiKey = opts.apiKey;
    this.fromNumber = opts.fromNumber;
    this.base = opts.baseUrl ?? DEFAULT_BASE;
  }

  private async request<T>(path: string, init: RequestInit = {}): Promise<T> {
    const res = await fetch(`${this.base}${path}`, {
      ...init,
      headers: {
        Authorization: this.apiKey,
        "Content-Type": "application/json",
        ...(init.headers ?? {}),
      },
    });
    if (!res.ok) {
      const body = await res.text();
      throw new Error(`OpenPhone ${path} → ${res.status}: ${body}`);
    }
    return res.json() as Promise<T>;
  }

  /** Verify the API key + list phone numbers on the account. */
  async listNumbers(): Promise<OpenPhoneNumber[]> {
    const res = await this.request<{ data: OpenPhoneNumber[] }>("/v1/phone-numbers");
    return res.data;
  }

  /**
   * Send an SMS from the configured fromNumber to one recipient.
   * Returns { ok: false } with the error string if A2P or quota issues block it.
   */
  async sendSms(toNumber: string, content: string): Promise<SendSmsResult> {
    const to = normalizeE164(toNumber);
    if (!to) return { ok: false, error: `Invalid phone number: ${toNumber}` };

    try {
      const res = await this.request<{ data: { id: string } }>("/v1/messages", {
        method: "POST",
        body: JSON.stringify({
          from: this.fromNumber,
          to: [to],
          content,
        }),
      });
      return { ok: true, messageId: res.data.id };
    } catch (e) {
      const msg = (e as Error).message;
      // Extract status code from the thrown message for cleaner UX
      const statusMatch = msg.match(/→ (\d+):/);
      return {
        ok: false,
        status: statusMatch ? parseInt(statusMatch[1], 10) : undefined,
        error: msg,
      };
    }
  }
}

/** Coerce a US phone number to E.164 format (+1XXXXXXXXXX). */
export function normalizeE164(input: string): string | null {
  if (!input) return null;
  const digits = input.replace(/[^0-9]/g, "");
  if (digits.length === 10) return `+1${digits}`;
  if (digits.length === 11 && digits.startsWith("1")) return `+${digits}`;
  // Already E.164 with +
  if (/^\+[1-9]\d{7,14}$/.test(input.trim())) return input.trim();
  return null;
}
