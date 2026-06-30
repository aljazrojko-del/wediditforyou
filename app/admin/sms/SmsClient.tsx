"use client";

import { useCallback, useEffect, useRef, useState } from "react";

type ThreadMessage = {
  id: string;
  direction: "in" | "out";
  at: string;
  body: string;
  from_phone: string;
  to_phone: string;
  status?: string | null;
  error?: string | null;
};

type ThreadData = {
  phone: string;
  leadId: string | null;
  leadName: string | null;
  messages: ThreadMessage[];
};

function fmtTime(iso: string): string {
  try {
    const d = new Date(iso);
    return d.toLocaleString(undefined, {
      month: "short",
      day: "numeric",
      hour: "numeric",
      minute: "2-digit",
    });
  } catch {
    return iso;
  }
}

export default function SmsClient() {
  const [phone, setPhone] = useState("");
  const [body, setBody] = useState("");
  const [thread, setThread] = useState<ThreadData | null>(null);
  const [sending, setSending] = useState(false);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [info, setInfo] = useState<string | null>(null);
  const threadEndRef = useRef<HTMLDivElement | null>(null);

  const loadThread = useCallback(async (p: string) => {
    if (!p.trim()) return;
    setLoading(true);
    setError(null);
    try {
      const res = await fetch(
        `/api/admin/sms-quick/thread?phone=${encodeURIComponent(p)}`,
      );
      const data = (await res.json()) as ThreadData | { error: string };
      if (!res.ok || "error" in data) {
        setError(("error" in data && data.error) || "Failed to load thread");
        setThread(null);
      } else {
        setThread(data);
      }
    } catch (e) {
      setError((e as Error).message);
    } finally {
      setLoading(false);
    }
  }, []);

  // Auto-scroll to newest message when thread updates.
  useEffect(() => {
    threadEndRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [thread]);

  // If the URL has ?phone=..., pre-fill + auto-load on first paint.
  useEffect(() => {
    const fromUrl = new URLSearchParams(window.location.search).get("phone");
    if (fromUrl && !phone) {
      setPhone(fromUrl);
      loadThread(fromUrl);
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  async function handleSend(e: React.FormEvent) {
    e.preventDefault();
    if (!phone.trim() || !body.trim() || sending) return;
    setSending(true);
    setError(null);
    setInfo(null);
    try {
      const res = await fetch(`/api/admin/sms-quick/send`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ to: phone, body }),
      });
      const data = (await res.json()) as { ok?: boolean; error?: string; sid?: string };
      if (!res.ok || !data.ok) {
        setError(data.error ?? "Send failed");
      } else {
        setInfo(`Sent · sid ${data.sid?.slice(0, 14)}…`);
        setBody("");
        await loadThread(phone);
      }
    } catch (e) {
      setError((e as Error).message);
    } finally {
      setSending(false);
    }
  }

  return (
    <div className="flex flex-col gap-4">
      {/* Phone input + load button */}
      <div className="rounded-lg border border-zinc-800 bg-zinc-950 p-3">
        <label className="block text-xs uppercase tracking-wider text-zinc-500 mb-1">
          Phone
        </label>
        <div className="flex gap-2">
          <input
            type="tel"
            inputMode="tel"
            placeholder="(713) 555-1234  or  +17135551234"
            value={phone}
            onChange={(e) => setPhone(e.target.value)}
            onBlur={() => phone && loadThread(phone)}
            className="flex-1 bg-zinc-900 border border-zinc-800 rounded px-3 py-2 text-base font-mono focus:outline-none focus:border-zinc-600"
          />
          <button
            type="button"
            onClick={() => loadThread(phone)}
            disabled={!phone.trim() || loading}
            className="px-4 py-2 text-sm rounded bg-zinc-800 hover:bg-zinc-700 disabled:opacity-40"
          >
            {loading ? "…" : "Load"}
          </button>
        </div>
        {thread && (
          <div className="mt-2 text-xs text-zinc-400">
            {thread.leadName ? (
              <span>
                Matched lead: <span className="text-zinc-100">{thread.leadName}</span>
              </span>
            ) : (
              <span>No lead match — this is a fresh number.</span>
            )}
          </div>
        )}
      </div>

      {/* Conversation */}
      {thread && (
        <div className="rounded-lg border border-zinc-800 bg-zinc-950 p-3 max-h-[60vh] overflow-y-auto">
          {thread.messages.length === 0 ? (
            <p className="text-sm text-zinc-500 text-center py-8">
              No messages yet for {thread.phone}. Send the first one below.
            </p>
          ) : (
            <ul className="flex flex-col gap-2">
              {thread.messages.map((m) => (
                <li
                  key={m.id}
                  className={`flex ${m.direction === "out" ? "justify-end" : "justify-start"}`}
                >
                  <div
                    className={`max-w-[80%] rounded-lg px-3 py-2 text-sm ${
                      m.direction === "out"
                        ? "bg-blue-600/30 border border-blue-700/50"
                        : "bg-zinc-800 border border-zinc-700"
                    }`}
                  >
                    <div className="whitespace-pre-wrap break-words">{m.body}</div>
                    <div className="mt-1 text-[10px] uppercase tracking-wider text-zinc-400 flex gap-2">
                      <span>{m.direction === "out" ? "Sent" : "Received"}</span>
                      <span>·</span>
                      <span>{fmtTime(m.at)}</span>
                      {m.status === "failed" && (
                        <span className="text-red-400">· failed</span>
                      )}
                    </div>
                  </div>
                </li>
              ))}
            </ul>
          )}
          <div ref={threadEndRef} />
        </div>
      )}

      {/* Send form */}
      <form
        onSubmit={handleSend}
        className="rounded-lg border border-zinc-800 bg-zinc-950 p-3 flex flex-col gap-2"
      >
        <label className="block text-xs uppercase tracking-wider text-zinc-500">
          Message
        </label>
        <textarea
          value={body}
          onChange={(e) => setBody(e.target.value)}
          placeholder="Type your message…"
          rows={3}
          maxLength={1600}
          className="bg-zinc-900 border border-zinc-800 rounded px-3 py-2 text-base focus:outline-none focus:border-zinc-600 resize-y"
        />
        <div className="flex items-center justify-between gap-2">
          <span className="text-xs text-zinc-500">
            {body.length}/1600 · sends from Dallas (+1 469)
          </span>
          <button
            type="submit"
            disabled={!phone.trim() || !body.trim() || sending}
            className="px-4 py-2 text-sm rounded bg-blue-600 hover:bg-blue-500 disabled:opacity-40 font-medium"
          >
            {sending ? "Sending…" : "Send"}
          </button>
        </div>
        {info && <p className="text-xs text-emerald-400">{info}</p>}
        {error && <p className="text-xs text-red-400">{error}</p>}
      </form>
    </div>
  );
}
