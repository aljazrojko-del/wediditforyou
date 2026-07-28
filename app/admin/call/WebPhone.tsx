"use client";

import { useCallback, useEffect, useMemo, useRef, useState } from "react";

// SignalWire v4 SDK — imported dynamically inside connect() so it never
// runs during SSR (the client isn't safe to import at module-eval time).

type Phase =
  | "idle"
  | "connecting"
  | "ready"
  | "dialing"
  | "in_call"
  | "ended"
  | "error";

function normalizePhone(input: string): string {
  const trimmed = input.trim();
  if (!trimmed) return "";
  if (trimmed.startsWith("+")) return "+" + trimmed.slice(1).replace(/[^0-9]/g, "");
  const digits = trimmed.replace(/[^0-9]/g, "");
  if (digits.length === 10) return `+1${digits}`;
  if (digits.length === 11 && digits.startsWith("1")) return `+${digits}`;
  return `+${digits}`;
}

function looksLikeE164(input: string): boolean {
  return /^\+[1-9]\d{7,14}$/.test(input);
}

export default function WebPhone() {
  const [toPhone, setToPhone] = useState("");
  const [phase, setPhase] = useState<Phase>("idle");
  const [message, setMessage] = useState<string>("");
  const [muted, setMuted] = useState(false);
  const [remoteAudioReady, setRemoteAudioReady] = useState(false);
  const clientRef = useRef<unknown>(null);
  const callRef = useRef<unknown>(null);
  const audioRef = useRef<HTMLAudioElement | null>(null);

  const normalized = useMemo(() => normalizePhone(toPhone), [toPhone]);
  const validTo = looksLikeE164(normalized);

  const setError = useCallback((msg: string) => {
    console.error("[web-phone]", msg);
    setPhase("error");
    setMessage(msg);
  }, []);

  const connect = useCallback(async () => {
    try {
      setPhase("connecting");
      setMessage("Requesting mic permission…");
      // Grab a stream up-front so the browser surfaces the mic prompt now.
      let mediaStream: MediaStream | null = null;
      try {
        mediaStream = await navigator.mediaDevices.getUserMedia({ audio: true, video: false });
      } catch (err) {
        setError(
          `Microphone permission denied or unavailable: ${(err as Error).message}`,
        );
        return;
      }
      // Immediately stop the tracks — the SDK will request its own stream.
      mediaStream?.getTracks().forEach((t) => t.stop());

      setMessage("Fetching short-lived call token…");
      const tokRes = await fetch("/api/admin/voice-token", { method: "POST" });
      if (!tokRes.ok) {
        const err = await tokRes.text();
        setError(`Token fetch failed (${tokRes.status}): ${err.slice(0, 200)}`);
        return;
      }
      const tokJson = (await tokRes.json()) as { token?: string; error?: string };
      if (!tokJson.token) {
        setError(`Token response missing token: ${JSON.stringify(tokJson).slice(0, 200)}`);
        return;
      }

      setMessage("Connecting to SignalWire…");
      // Dynamic import so this module doesn't try to run during SSR.
      const mod = (await import("@signalwire/js")) as unknown as {
        SignalWire: new (
          provider: unknown,
          options?: unknown,
        ) => {
          connect: () => Promise<void>;
          dial: (dest: string, opts?: unknown) => Promise<unknown>;
          disconnect?: () => Promise<void>;
        };
        StaticCredentialProvider: new (opts: { token: string }) => unknown;
      };
      if (
        typeof mod.SignalWire !== "function" ||
        typeof mod.StaticCredentialProvider !== "function"
      ) {
        setError(
          "@signalwire/js SignalWire or StaticCredentialProvider not found on the module.",
        );
        return;
      }
      const provider = new mod.StaticCredentialProvider({ token: tokJson.token });
      const client = new mod.SignalWire(provider);
      await client.connect();
      clientRef.current = client;
      setPhase("ready");
      setMessage("Ready. Enter a number and dial.");
    } catch (e) {
      setError(`Connect failed: ${(e as Error).message}`);
    }
  }, [setError]);

  const dial = useCallback(async () => {
    if (!validTo) return;
    const client = clientRef.current as unknown as {
      dial?: (destination: string, options?: unknown) => Promise<unknown>;
    } | null;
    if (!client || typeof client.dial !== "function") {
      setError("Client not ready or dial() unavailable on this SDK build.");
      return;
    }
    try {
      setPhase("dialing");
      setMessage(`Dialing ${normalized}…`);
      // v4 dial(destination, options). Destination is the phone number as a
      // plain +E164 string. Options may include audio constraints.
      const call = await client.dial(normalized, {
        audio: true,
        video: false,
      });
      callRef.current = call;

      // Wire up call events + attach remote audio.
      const callAny = call as {
        on?: (event: string, cb: (payload?: unknown) => void) => void;
        remoteStream?: MediaStream;
      };
      if (typeof callAny.on === "function") {
        callAny.on("call.state", (p: unknown) => {
          const state = (p as { state?: string } | undefined)?.state ?? "?";
          setMessage(`Call state: ${state}`);
          if (state === "answered") setPhase("in_call");
          if (state === "ended") setPhase("ended");
        });
        callAny.on("ended", () => {
          setPhase("ended");
          setMessage("Call ended.");
        });
      }
      // Attach audio when available. Some SDK builds emit an event; others
      // expose remoteStream directly. Handle both.
      const attachRemote = (stream: MediaStream | undefined) => {
        if (!stream || !audioRef.current) return;
        audioRef.current.srcObject = stream;
        audioRef.current.play().catch(() => void 0);
        setRemoteAudioReady(true);
      };
      if (callAny.remoteStream) attachRemote(callAny.remoteStream);
      if (typeof callAny.on === "function") {
        callAny.on("stream", (p: unknown) => attachRemote((p as MediaStream) || undefined));
        callAny.on("track", (p: unknown) => {
          const stream = (p as { streams?: MediaStream[] } | undefined)?.streams?.[0];
          attachRemote(stream);
        });
      }
    } catch (e) {
      setError(`Dial failed: ${(e as Error).message}`);
    }
  }, [normalized, setError, validTo]);

  const hangup = useCallback(async () => {
    const call = callRef.current as { hangup?: () => Promise<void> } | null;
    if (call?.hangup) {
      try {
        await call.hangup();
      } catch {
        // ignore
      }
    }
    callRef.current = null;
    setPhase(phase === "in_call" ? "ended" : "ready");
    setMuted(false);
    setRemoteAudioReady(false);
    if (audioRef.current) audioRef.current.srcObject = null;
  }, [phase]);

  const toggleMute = useCallback(async () => {
    const call = callRef.current as {
      muteAudio?: () => Promise<void>;
      unmuteAudio?: () => Promise<void>;
    } | null;
    if (!call) return;
    try {
      if (muted) {
        await call.unmuteAudio?.();
        setMuted(false);
      } else {
        await call.muteAudio?.();
        setMuted(true);
      }
    } catch (e) {
      setMessage(`Mute toggle failed: ${(e as Error).message}`);
    }
  }, [muted]);

  useEffect(() => {
    return () => {
      // Best-effort teardown on unmount.
      (async () => {
        const call = callRef.current as { hangup?: () => Promise<void> } | null;
        try {
          await call?.hangup?.();
        } catch {
          // ignore
        }
        const client = clientRef.current as { disconnect?: () => Promise<void> } | null;
        try {
          await client?.disconnect?.();
        } catch {
          // ignore
        }
      })();
    };
  }, []);

  const canConnect = phase === "idle" || phase === "error" || phase === "ended";
  const canDial =
    validTo &&
    (phase === "ready" || phase === "ended") &&
    clientRef.current != null;
  const inCall = phase === "in_call" || phase === "dialing";

  const phaseColor: Record<Phase, string> = {
    idle: "text-zinc-500",
    connecting: "text-amber-400",
    ready: "text-emerald-400",
    dialing: "text-amber-400",
    in_call: "text-emerald-400",
    ended: "text-zinc-400",
    error: "text-rose-400",
  };

  return (
    <div className="rounded-lg border border-zinc-900 bg-zinc-950 p-6 space-y-5">
      <div className="flex items-baseline justify-between text-xs uppercase tracking-wider text-zinc-500 font-semibold">
        <span>Session</span>
        <span className={`normal-case font-normal ${phaseColor[phase]}`}>
          {phase}
        </span>
      </div>

      {canConnect && (
        <button
          type="button"
          onClick={connect}
          className="w-full px-4 py-2.5 rounded bg-emerald-600 hover:bg-emerald-500 text-sm font-semibold text-white"
        >
          {phase === "idle" ? "Connect (grants mic)" : "Reconnect"}
        </button>
      )}

      {(phase === "ready" || phase === "ended" || inCall) && (
        <>
          <div>
            <label className="block text-xs uppercase tracking-wider text-zinc-500 mb-1">
              Dial number
            </label>
            <input
              type="tel"
              value={toPhone}
              onChange={(e) => setToPhone(e.target.value)}
              disabled={inCall}
              placeholder="+18063958238 or (806) 395-8238"
              className="w-full px-3 py-2 rounded bg-zinc-900 border border-zinc-800 focus:border-emerald-600 focus:outline-none text-sm font-mono disabled:opacity-50"
              autoComplete="off"
              spellCheck={false}
            />
            <div className="mt-1 text-xs">
              {toPhone.length === 0 ? (
                <span className="text-zinc-600">Enter a US phone number.</span>
              ) : validTo ? (
                <span className="text-emerald-400">Will dial {normalized}</span>
              ) : (
                <span className="text-rose-400">Not a valid phone number.</span>
              )}
            </div>
          </div>

          <div className="flex flex-wrap items-center gap-3">
            <button
              type="button"
              disabled={!canDial}
              onClick={dial}
              className="px-5 py-2.5 rounded bg-emerald-600 hover:bg-emerald-500 disabled:opacity-30 disabled:cursor-not-allowed text-sm font-semibold text-white"
            >
              Dial
            </button>
            {inCall && (
              <>
                <button
                  type="button"
                  onClick={toggleMute}
                  className="px-4 py-2.5 rounded bg-zinc-800 hover:bg-zinc-700 text-sm font-medium"
                >
                  {muted ? "Unmute" : "Mute"}
                </button>
                <button
                  type="button"
                  onClick={hangup}
                  className="px-5 py-2.5 rounded bg-rose-600 hover:bg-rose-500 text-sm font-semibold text-white"
                >
                  Hang up
                </button>
              </>
            )}
          </div>
        </>
      )}

      {message && (
        <div className="text-sm text-zinc-400 rounded bg-zinc-900/50 border border-zinc-800 p-3 whitespace-pre-wrap break-words">
          {message}
        </div>
      )}

      {/* Remote audio sink. Kept always-mounted so we can attach fast when a call is answered. */}
      <audio ref={audioRef} autoPlay playsInline hidden />
      {remoteAudioReady && (
        <div className="text-xs text-emerald-400">Remote audio attached ✓</div>
      )}

      <div className="pt-3 border-t border-zinc-900 text-xs text-zinc-500 space-y-1">
        <div>
          <strong className="text-zinc-400">First time?</strong> Click{" "}
          <span className="text-emerald-400">Connect</span> to grant mic and
          establish the SignalWire session. Then enter a number and dial.
        </div>
        <div>
          If it fails to connect, check that <code>SIGNALWIRE_SPACE_URL</code>,
          <code> SIGNALWIRE_PROJECT_ID</code>, and <code>SIGNALWIRE_TOKEN</code>
          are set in Vercel prod env, and that your project has WebRTC voice
          enabled.
        </div>
      </div>
    </div>
  );
}
