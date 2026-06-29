"use client";

import { useState } from "react";

type LogoOption = { style: string; url: string };

export default function LogoSection({
  token,
  initialLogos,
  initialSelected,
}: {
  token: string;
  initialLogos: LogoOption[];
  initialSelected: string | null;
}) {
  const [logos, setLogos] = useState<LogoOption[]>(initialLogos);
  const [selected, setSelected] = useState<string | null>(initialSelected);
  const [genBusy, setGenBusy] = useState(false);
  const [selBusy, setSelBusy] = useState<string | null>(null);
  const [err, setErr] = useState<string | null>(null);

  async function generate(force = false) {
    setGenBusy(true);
    setErr(null);
    try {
      const res = await fetch("/api/customer/generate-logos", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ token, force }),
      });
      const j = await res.json();
      if (!res.ok) {
        setErr(j.error ?? "Generation failed");
        return;
      }
      setLogos(j.logos);
    } catch (e) {
      setErr((e as Error).message);
    } finally {
      setGenBusy(false);
    }
  }

  async function select(url: string) {
    setSelBusy(url);
    setErr(null);
    try {
      const res = await fetch("/api/customer/select-logo", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ token, url }),
      });
      const j = await res.json();
      if (!res.ok) {
        setErr(j.error ?? "Selection failed");
        return;
      }
      setSelected(url);
    } catch (e) {
      setErr((e as Error).message);
    } finally {
      setSelBusy(null);
    }
  }

  // No logos generated yet
  if (logos.length === 0) {
    return (
      <div className="grid gap-3">
        <p className="text-sm text-[#1F1814]/70">
          Generate 3 custom logo concepts for your business. AI creates unique
          options based on your business name and niche — you pick the one you
          like best, and it lives on your site.
        </p>
        <button
          type="button"
          onClick={() => generate(false)}
          disabled={genBusy}
          className="inline-flex items-center justify-center rounded-xl bg-[#C2410C] px-6 py-4 text-base font-semibold text-white transition hover:bg-[#9A3412] disabled:cursor-not-allowed disabled:opacity-60"
        >
          {genBusy ? "Generating… (takes 30–60 sec)" : "Generate logo options"}
        </button>
        {err && (
          <p className="rounded-lg bg-red-500/10 px-3 py-2 text-sm text-red-700">
            {err}
          </p>
        )}
      </div>
    );
  }

  // Logos generated — show grid + selection state
  return (
    <div className="grid gap-5">
      <p className="text-sm text-[#1F1814]/70">
        {selected
          ? "Logo locked in. To try different options, regenerate below."
          : "Pick your favorite — it'll be used on your site header and marketing materials."}
      </p>
      <div className="grid grid-cols-1 gap-4 sm:grid-cols-3">
        {logos.map((l) => {
          const isSelected = selected === l.url;
          return (
            <div
              key={l.url}
              className={`rounded-2xl border-2 p-3 transition ${
                isSelected
                  ? "border-[#C2410C] bg-[#C2410C]/5"
                  : "border-[#1F1814]/15 bg-[#FAF6F0]"
              }`}
            >
              <div className="mb-2 text-xs font-mono uppercase tracking-wider text-[#1F1814]/55">
                {l.style.replace(/-/g, " ")}
              </div>
              <div className="aspect-square overflow-hidden rounded-xl bg-white">
                {/* eslint-disable-next-line @next/next/no-img-element */}
                <img
                  src={l.url}
                  alt={`Logo option — ${l.style}`}
                  className="h-full w-full object-cover"
                />
              </div>
              {isSelected ? (
                <div className="mt-3 inline-flex items-center gap-1.5 rounded-md bg-[#C2410C] px-3 py-1.5 text-xs font-semibold text-white">
                  ✓ Selected
                </div>
              ) : (
                <button
                  type="button"
                  onClick={() => select(l.url)}
                  disabled={selBusy === l.url || selBusy !== null}
                  className="mt-3 w-full rounded-md bg-[#1F1814] px-3 py-2 text-xs font-semibold text-white transition hover:bg-[#1F1814]/85 disabled:opacity-50"
                >
                  {selBusy === l.url ? "Saving…" : "Use this one"}
                </button>
              )}
            </div>
          );
        })}
      </div>
      <button
        type="button"
        onClick={() => generate(true)}
        disabled={genBusy}
        className="inline-flex items-center justify-center self-start rounded-xl border border-[#1F1814]/15 bg-[#FAF6F0] px-4 py-2 text-sm font-medium text-[#1F1814]/70 transition hover:border-[#C2410C] hover:text-[#C2410C] disabled:opacity-50"
      >
        {genBusy ? "Regenerating…" : "Regenerate 3 new options"}
      </button>
      {err && (
        <p className="rounded-lg bg-red-500/10 px-3 py-2 text-sm text-red-700">
          {err}
        </p>
      )}
    </div>
  );
}
