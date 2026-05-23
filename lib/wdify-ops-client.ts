/**
 * WdifyOps — typed client for the wdify-ops dashboard backend.
 *
 * Hosts (both work, same backend):
 *   https://wediditforyou-dashboard-lemon.vercel.app
 *   https://wdify-ops.vercel.app
 *
 * Auth: POST /vps-api/api/auth/login -> { token, username }
 *       Use as `Authorization: Bearer <token>` on every other call.
 *       Token expires 24h after issue (JWT exp claim).
 *
 * Usage:
 *   const client = new WdifyOpsClient({
 *     username: process.env.WDIFY_OPS_USERNAME!,
 *     password: process.env.WDIFY_OPS_PASSWORD!,
 *   });
 *   const metrics = await client.getMetricsOverview();
 */

const DEFAULT_HOST = "https://wediditforyou-dashboard-lemon.vercel.app";

export type WdifyOpsConfig = {
  host?: string;
  username: string;
  password: string;
};

export type LoginResponse = { token: string; username: string };

export type MetricsOverview = {
  total_runs: number;
  carousels_by_status: Record<string, number>;
  posted_by_platform: Record<string, unknown>;
  [k: string]: unknown;
};

export type AgentStatus = {
  total_analyses: number;
  latest_recommendation: unknown | null;
  current_scoring: Record<string, unknown>;
  [k: string]: unknown;
};

export type PipelineRun = {
  id: number;
  started_at: string;
  completed_at: string | null;
  [k: string]: unknown;
};

export type AssistantConversation = {
  id: string;
  title: string;
  [k: string]: unknown;
};

export type ProductEvent = {
  type: string;
  ts: string;
  payload: Record<string, unknown>;
};

export type DashboardLead = {
  id: number;
  company_name: string;
  contact_name: string | null;
  contact_email: string | null;
  contact_phone: string | null;
  website: string | null;
  status:
    | "NEW"
    | "REPORT_SENT"
    | "CALL_SCHEDULED"
    | "CALL_DONE"
    | "PROPOSAL_SENT"
    | "NEGOTIATING"
    | "WON"
    | "LOST"
    | "DORMANT";
  notes: string | null;
  tags: string[];
  created_at?: string;
  updated_at?: string;
  fire_score?: number | null;
  fire_tier?: "A" | "B" | "C" | "D" | null;
  [k: string]: unknown;
};

export type DashboardLeadList = {
  items: DashboardLead[];
  total: number;
  limit?: number;
  offset?: number;
};

export type ProductsSummary = {
  total_events: number;
  views: number;
  cta_clicks: number;
  bookings: number;
  cta_rate: number;
  booking_rate: number;
  utm_sources: Record<string, unknown>;
  recent: ProductEvent[];
};

export class WdifyOpsClient {
  private host: string;
  private username: string;
  private password: string;
  private token: string | null = null;
  private tokenExpiresAt = 0;

  constructor(config: WdifyOpsConfig) {
    this.host = config.host ?? DEFAULT_HOST;
    this.username = config.username;
    this.password = config.password;
  }

  /** Login and cache the JWT. Called automatically by every other method. */
  async login(): Promise<LoginResponse> {
    const res = await fetch(`${this.host}/vps-api/api/auth/login`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ username: this.username, password: this.password }),
    });
    if (!res.ok) {
      throw new Error(`WdifyOps login failed: ${res.status} ${await res.text()}`);
    }
    const data = (await res.json()) as LoginResponse;
    this.token = data.token;
    // Decode JWT exp without verifying (we trust the server)
    try {
      const [, payload] = data.token.split(".");
      const decoded = JSON.parse(Buffer.from(payload, "base64").toString());
      this.tokenExpiresAt = (decoded.exp as number) * 1000;
    } catch {
      this.tokenExpiresAt = Date.now() + 23 * 60 * 60 * 1000; // 23h fallback
    }
    return data;
  }

  private async ensureToken(): Promise<string> {
    if (!this.token || Date.now() > this.tokenExpiresAt - 60_000) {
      await this.login();
    }
    return this.token!;
  }

  private async request<T>(path: string, init: RequestInit = {}): Promise<T> {
    const token = await this.ensureToken();
    const exec = (tok: string) =>
      fetch(`${this.host}${path}`, {
        ...init,
        headers: {
          Authorization: `Bearer ${tok}`,
          "Content-Type": "application/json",
          ...(init.headers ?? {}),
        },
      });
    let res = await exec(token);
    if (res.status === 401) {
      this.token = null;
      res = await exec(await this.ensureToken());
    }
    if (!res.ok) {
      throw new Error(`WdifyOps ${path} -> ${res.status}: ${await res.text()}`);
    }
    return res.json() as Promise<T>;
  }

  // ─── Confirmed endpoints (200 OK with real data) ─────────────────────

  /** Linked outbound accounts. */
  getAccounts() {
    return this.request<unknown[]>("/vps-api/api/accounts");
  }

  /** Current AI agent scoring config and latest recommendation. */
  getAgentStatus() {
    return this.request<AgentStatus>("/vps-api/api/agent/status");
  }

  /** List of past recommendations the agent has produced. */
  getAgentRecommendations() {
    return this.request<unknown[]>("/vps-api/api/agent/recommendations");
  }

  /** High-level dashboard metrics (run counts, carousel statuses, engagement). */
  getMetricsOverview() {
    return this.request<MetricsOverview>("/vps-api/api/metrics/overview");
  }

  /** Per-post engagement metrics. */
  getMetricsPosts() {
    return this.request<unknown[]>("/vps-api/api/metrics/posts");
  }

  /** Pipeline / scheduled-run history. */
  getPipelineRuns() {
    return this.request<PipelineRun[]>("/vps-api/api/pipeline/runs");
  }

  /** AI assistant conversation history. */
  getAssistantConversations() {
    return this.request<AssistantConversation[]>("/vps-api/api/assistant/conversations");
  }

  /** Analytics for the wediditforyou.com/products page (CTA clicks, bookings). */
  getProductsSummary(opts: { limit?: number } = {}) {
    const limit = opts.limit ?? 100;
    return this.request<ProductsSummary>(
      `/command-api/api/v1/track/products-summary?limit=${limit}`,
    );
  }

  // ─── Confirmed write endpoint ────────────────────────────────────────

  /**
   * Trigger an on-demand RAG analysis on recent content metrics.
   * Returns immediately with status=started; the result appears in
   * getAgentRecommendations() once analysis completes (background job).
   *
   * Confirmed: empty body works. Schema for non-empty body unknown.
   */
  runAgent(body: Record<string, unknown> = {}) {
    return this.request<{ status: string; message: string }>(
      "/vps-api/api/agent/run",
      {
        method: "POST",
        body: JSON.stringify(body),
      },
    );
  }

  // ─── Lead CRUD (the real lead pipeline endpoints) ─────────────────────
  // The dashboard's leads live at /command-api/api/v1/leads — POST creates,
  // GET reads, PUT updates. Each lead has a numeric id and progresses through
  // statuses: NEW → CALL_SCHEDULED → CALL_DONE → REPORT_SENT → PROPOSAL_SENT
  // → NEGOTIATING → WON / LOST / DORMANT.

  listLeads(opts: {
    status?: string;
    search?: string;
    limit?: number;
    offset?: number;
    sort?: string;
  } = {}) {
    const params = new URLSearchParams();
    if (opts.status) params.set("status", opts.status);
    if (opts.search) params.set("search", opts.search);
    if (opts.limit !== undefined) params.set("limit", String(opts.limit));
    if (opts.offset !== undefined) params.set("offset", String(opts.offset));
    if (opts.sort) params.set("sort", opts.sort);
    const qs = params.toString();
    return this.request<DashboardLeadList>(
      `/command-api/api/v1/leads${qs ? `?${qs}` : ""}`,
    );
  }

  getLead(id: number) {
    return this.request<DashboardLead>(`/command-api/api/v1/leads/${id}`);
  }

  createLead(body: Partial<DashboardLead>) {
    return this.request<DashboardLead>("/command-api/api/v1/leads", {
      method: "POST",
      body: JSON.stringify(body),
    });
  }

  /** PUT updates a lead in-place (PATCH returns 405 on this API). */
  updateLead(id: number, patch: Partial<DashboardLead>) {
    return this.request<DashboardLead>(`/command-api/api/v1/leads/${id}`, {
      method: "PUT",
      body: JSON.stringify(patch),
    });
  }

  deleteLead(id: number) {
    return this.request<{ ok: boolean }>(`/command-api/api/v1/leads/${id}`, {
      method: "DELETE",
    });
  }
}
