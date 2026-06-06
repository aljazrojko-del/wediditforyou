"use client";

import { useRef, useState } from "react";
import gsap from "gsap";
import { useGSAP } from "@gsap/react";
import { upload } from "@vercel/blob/client";

type Status = "idle" | "submitting" | "success" | "error";

const NICHES = [
  "Mobile mechanic",
  "Mobile dog groomer",
  "Tutor / Coach / Music teacher",
  "Plumber / Trades",
  "Hair / Salon",
  "Landscaper / Lawn care",
  "Personal trainer / Fitness",
  "Pet care / Boarding",
  "Photographer",
  "Therapist / Wellness",
  "Cleaner / Home services",
  "Other",
];

const STYLES = [
  { value: "bold", label: "Bold & bright" },
  { value: "warm", label: "Warm & inviting" },
  { value: "minimal", label: "Clean & minimal" },
  { value: "editorial", label: "Editorial & elegant" },
];

const ACCEPT = "image/jpeg,image/png,image/webp,image/svg+xml,image/gif";
const MAX_FILE_BYTES = 10 * 1024 * 1024;
const MAX_PHOTOS = 6;

// Hormozi-style reorder: business commitment first (low risk),
// contact info LAST (after the prospect has invested 2 steps of effort).
const STEP_TITLES = [
  "Tell us about your business",
  "How should the site feel?",
  "Where do we send the URL?",
];

const inputCls =
  "rounded-xl border border-[#1F1814]/15 bg-[#FAF6F0] px-4 py-3 text-[#1F1814] placeholder-[#1F1814]/35 outline-none transition focus:border-[#C2410C] focus:ring-2 focus:ring-[#C2410C]/20";

const labelCls = "text-sm font-semibold text-[#1F1814]";

function readField(form: HTMLFormElement, name: string): string {
  const el = form.elements.namedItem(name) as
    | HTMLInputElement
    | HTMLSelectElement
    | HTMLTextAreaElement
    | RadioNodeList
    | null;
  if (!el) return "";
  if ("value" in el) return el.value.trim();
  return "";
}

function validateFile(file: File): string | null {
  if (!file.type.startsWith("image/")) return "Only image files are allowed.";
  if (file.size > MAX_FILE_BYTES) return "File is over 10 MB.";
  return null;
}

function FilePreview({
  file,
  onRemove,
}: {
  file: File;
  onRemove: () => void;
}) {
  const url = URL.createObjectURL(file);
  return (
    <div className="group relative aspect-square overflow-hidden rounded-xl border border-[#1F1814]/15 bg-[#FAF6F0]">
      {/* eslint-disable-next-line @next/next/no-img-element */}
      <img src={url} alt={file.name} className="h-full w-full object-cover" />
      <button
        type="button"
        onClick={onRemove}
        aria-label="Remove file"
        className="absolute right-1.5 top-1.5 flex h-6 w-6 items-center justify-center rounded-full bg-[#1F1814]/85 text-xs text-white opacity-0 transition group-hover:opacity-100"
      >
        ×
      </button>
      <div className="absolute inset-x-0 bottom-0 truncate bg-gradient-to-t from-[#1F1814]/85 to-transparent px-2 py-1 text-[10px] text-white">
        {file.name}
      </div>
    </div>
  );
}

export default function ContactForm() {
  const [status, setStatus] = useState<Status>("idle");
  const [errorMsg, setErrorMsg] = useState<string>("");
  const [logoFile, setLogoFile] = useState<File | null>(null);
  const [photoFiles, setPhotoFiles] = useState<File[]>([]);
  const [fileError, setFileError] = useState<string>("");
  const [uploadWarning, setUploadWarning] = useState<string>("");
  const [step, setStep] = useState(0); // 0..2
  const [stepError, setStepError] = useState<string>("");

  const formRef = useRef<HTMLFormElement>(null);
  const stepsRef = useRef<HTMLDivElement>(null);
  const logoInputRef = useRef<HTMLInputElement>(null);
  const photosInputRef = useRef<HTMLInputElement>(null);

  // Animate step transitions
  useGSAP(
    () => {
      const el = stepsRef.current;
      if (!el) return;
      const active = el.querySelector(`[data-step="${step}"]`);
      if (!active) return;
      gsap.fromTo(
        active,
        { opacity: 0, x: 24 },
        { opacity: 1, x: 0, duration: 0.45, ease: "power3.out" },
      );
    },
    { dependencies: [step], scope: stepsRef },
  );

  function validateStep(currentStep: number): boolean {
    setStepError("");
    if (!formRef.current) return false;

    // Step 0 = business (required) · 1 = preferences (optional) · 2 = contact (required, validated on submit)
    const requiredByStep: Record<number, string[]> = {
      0: ["businessName", "niche", "location"],
      1: [],
      2: ["name", "email", "phone", "smsConsent"],
    };
    const required = requiredByStep[currentStep] || [];

    for (const fieldName of required) {
      const el = formRef.current.elements.namedItem(
        fieldName,
      ) as HTMLInputElement | HTMLSelectElement | null;
      if (!el || !("checkValidity" in el)) continue;
      if (!el.checkValidity()) {
        el.reportValidity();
        return false;
      }
    }
    return true;
  }

  function next() {
    if (!validateStep(step)) return;
    if (step < 2) setStep(step + 1);
  }

  function back() {
    setStepError("");
    if (step > 0) setStep(step - 1);
  }

  function handleLogoPick(e: React.ChangeEvent<HTMLInputElement>) {
    setFileError("");
    const file = e.target.files?.[0];
    if (!file) return;
    const err = validateFile(file);
    if (err) {
      setFileError(`Logo: ${err}`);
      e.target.value = "";
      return;
    }
    setLogoFile(file);
  }

  function handlePhotosPick(e: React.ChangeEvent<HTMLInputElement>) {
    setFileError("");
    const picked = Array.from(e.target.files ?? []);
    e.target.value = "";
    if (picked.length === 0) return;

    const merged = [...photoFiles];
    for (const f of picked) {
      const err = validateFile(f);
      if (err) {
        setFileError(`${f.name}: ${err}`);
        continue;
      }
      if (merged.length >= MAX_PHOTOS) {
        setFileError(`Up to ${MAX_PHOTOS} photos. Extra files were skipped.`);
        break;
      }
      merged.push(f);
    }
    setPhotoFiles(merged);
  }

  function removeLogo() {
    setLogoFile(null);
    if (logoInputRef.current) logoInputRef.current.value = "";
  }

  function removePhoto(index: number) {
    setPhotoFiles((prev) => prev.filter((_, i) => i !== index));
  }

  async function uploadOne(file: File, prefix: string): Promise<string | null> {
    const safeName = file.name.replace(/[^a-z0-9.-]/gi, "_");
    const path = `leads/${prefix}-${Date.now()}-${safeName}`;
    try {
      const result = await upload(path, file, {
        access: "public",
        handleUploadUrl: "/api/upload",
      });
      return result.url;
    } catch (err) {
      console.warn("upload failed for", file.name, err);
      return null;
    }
  }

  async function handleSubmit(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault();
    if (step !== 2) {
      next();
      return;
    }

    setStatus("submitting");
    setErrorMsg("");
    setUploadWarning("");

    const form = e.currentTarget;

    let logoUrl = "";
    let photoUrls: string[] = [];
    let uploadFailures = 0;

    if (logoFile) {
      const url = await uploadOne(logoFile, "logo");
      if (url) logoUrl = url;
      else uploadFailures += 1;
    }

    if (photoFiles.length > 0) {
      const results = await Promise.all(
        photoFiles.map((f) => uploadOne(f, "photo")),
      );
      photoUrls = results.filter((u): u is string => u !== null);
      uploadFailures += results.filter((u) => u === null).length;
    }

    const smsConsentEl = form.elements.namedItem("smsConsent") as
      | HTMLInputElement
      | null;
    const smsConsent = Boolean(smsConsentEl?.checked);

    const data = {
      name: readField(form, "name"),
      email: readField(form, "email"),
      phone: readField(form, "phone"),
      businessName: readField(form, "businessName"),
      niche: readField(form, "niche"),
      location: readField(form, "location"),
      onlineLink: readField(form, "onlineLink"),
      stylePreference: readField(form, "stylePreference"),
      notes: readField(form, "notes"),
      logoUrl,
      photoUrls,
      smsConsent,
      smsConsentAt: smsConsent ? new Date().toISOString() : null,
    };

    try {
      const res = await fetch("/api/lead", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(data),
      });
      if (!res.ok) {
        const body = await res.json().catch(() => ({}));
        throw new Error(body.error || "Something went wrong.");
      }
      if (uploadFailures > 0) {
        setUploadWarning(
          `Your details were saved, but ${uploadFailures} file${uploadFailures > 1 ? "s" : ""} couldn't upload — we'll ask for them on the call.`,
        );
      }
      setStatus("success");
      form.reset();
      setLogoFile(null);
      setPhotoFiles([]);
      setStep(0);
    } catch (err) {
      setStatus("error");
      setErrorMsg(err instanceof Error ? err.message : "Something went wrong.");
    }
  }

  if (status === "success") {
    return (
      <div className="rounded-2xl border border-[#C2410C]/40 bg-[#C2410C]/5 p-8 text-center">
        <p className="text-2xl font-semibold text-[#1F1814]">Got it.</p>
        <p className="mt-2 text-[#1F1814]/70">
          We&apos;ll start building yours today and reach out within 24 hours
          with a live URL.
        </p>
        {uploadWarning && (
          <p className="mt-4 text-sm text-[#C2410C]">{uploadWarning}</p>
        )}
      </div>
    );
  }

  const stepCount = STEP_TITLES.length;
  const progressPct = ((step + 1) / stepCount) * 100;

  return (
    <form ref={formRef} onSubmit={handleSubmit} className="grid gap-7">
      {/* Progress header */}
      <div>
        <div className="mb-3 flex items-baseline justify-between">
          <div className="flex items-baseline gap-2">
            <span className="font-mono text-[11px] font-semibold uppercase tracking-[0.25em] text-[#C2410C]">
              Step {step + 1} / {stepCount}
            </span>
            <span className="text-sm font-semibold text-[#1F1814]">
              {STEP_TITLES[step]}
            </span>
          </div>
          {step > 0 && (
            <button
              type="button"
              onClick={back}
              className="text-xs font-semibold text-[#1F1814]/60 hover:text-[#C2410C]"
            >
              ← Back
            </button>
          )}
        </div>
        <div className="h-1 w-full overflow-hidden rounded-full bg-[#1F1814]/10">
          <div
            className="h-full rounded-full bg-[#C2410C] transition-all duration-500 ease-out"
            style={{ width: `${progressPct}%` }}
          />
        </div>
      </div>

      <div ref={stepsRef} className="relative">
        {/* Step 0 — Business info (low commitment, get the micro-yes) */}
        {step === 0 && (
          <fieldset data-step="0" className="grid gap-4">
            <div className="grid gap-2">
              <label htmlFor="businessName" className={labelCls}>
                Business name
              </label>
              <input
                id="businessName"
                name="businessName"
                type="text"
                required
                autoComplete="organization"
                className={inputCls}
                placeholder="Reyes Mobile Mechanic"
              />
            </div>
            <div className="grid gap-2">
              <label htmlFor="niche" className={labelCls}>
                What kind of business?
              </label>
              <select
                id="niche"
                name="niche"
                required
                defaultValue=""
                className={`${inputCls} appearance-none bg-[#FAF6F0] pr-10`}
              >
                <option value="" disabled>
                  Pick the closest fit…
                </option>
                {NICHES.map((n) => (
                  <option key={n} value={n}>
                    {n}
                  </option>
                ))}
              </select>
            </div>
            <div className="grid gap-2">
              <label htmlFor="location" className={labelCls}>
                City, State
              </label>
              <input
                id="location"
                name="location"
                type="text"
                required
                className={inputCls}
                placeholder="Phoenix, AZ"
              />
            </div>
            <div className="grid gap-2">
              <label htmlFor="onlineLink" className={labelCls}>
                Where can we find you online?{" "}
                <span className="font-normal text-[#1F1814]/50">
                  — optional
                </span>
              </label>
              <input
                id="onlineLink"
                name="onlineLink"
                type="url"
                autoComplete="url"
                className={inputCls}
                placeholder="Google Business, Instagram, Yelp, Facebook…"
              />
              <p className="text-xs text-[#1F1814]/55">
                If you have a Google Business Profile, Instagram, or Yelp page,
                share it — we&apos;ll use your existing photos and reviews so
                you don&apos;t have to send anything.
              </p>
            </div>
          </fieldset>
        )}

        {/* Step 1 — Site preferences + brand assets (all optional, builds investment) */}
        {step === 1 && (
          <fieldset data-step="1" className="grid gap-5">
            <div className="grid gap-3">
              <label className={labelCls}>
                Style preference{" "}
                <span className="font-normal text-[#1F1814]/50">
                  — optional
                </span>
              </label>
              <div className="grid gap-2 sm:grid-cols-2">
                {STYLES.map((s) => (
                  <label
                    key={s.value}
                    className="group flex cursor-pointer items-center gap-3 rounded-xl border border-[#1F1814]/15 bg-[#FAF6F0] px-4 py-3 transition has-[:checked]:border-[#C2410C] has-[:checked]:bg-[#C2410C]/5 hover:border-[#1F1814]/30"
                  >
                    <input
                      type="radio"
                      name="stylePreference"
                      value={s.value}
                      className="h-4 w-4 accent-[#C2410C]"
                    />
                    <span className="text-sm font-medium text-[#1F1814]">
                      {s.label}
                    </span>
                  </label>
                ))}
              </div>
              <p className="text-xs text-[#1F1814]/55">
                Not sure? Skip — we&apos;ll match the look to your niche.
              </p>
            </div>
            <div className="grid gap-2">
              <label htmlFor="notes" className={labelCls}>
                Anything else?{" "}
                <span className="font-normal text-[#1F1814]/50">
                  — optional
                </span>
              </label>
              <textarea
                id="notes"
                name="notes"
                rows={3}
                className={`${inputCls} resize-none`}
                placeholder="Brand colors, must-have services, a competitor whose site you like…"
              />
            </div>

            <div className="grid gap-2">
              <label className={labelCls}>
                Your logo{" "}
                <span className="font-normal text-[#1F1814]/55">
                  — optional
                </span>
              </label>
              {logoFile ? (
                <div className="grid grid-cols-[64px_1fr] items-center gap-3 rounded-xl border border-[#1F1814]/15 bg-[#FAF6F0] p-2.5">
                  <div className="aspect-square overflow-hidden rounded-lg border border-[#1F1814]/10 bg-white">
                    {/* eslint-disable-next-line @next/next/no-img-element */}
                    <img
                      src={URL.createObjectURL(logoFile)}
                      alt={logoFile.name}
                      className="h-full w-full object-contain"
                    />
                  </div>
                  <div className="flex items-center justify-between gap-3">
                    <div className="min-w-0">
                      <div className="truncate text-sm font-medium text-[#1F1814]">
                        {logoFile.name}
                      </div>
                      <div className="text-xs text-[#1F1814]/55">
                        {(logoFile.size / 1024).toFixed(0)} KB
                      </div>
                    </div>
                    <button
                      type="button"
                      onClick={removeLogo}
                      className="text-xs font-semibold text-[#C2410C] hover:underline"
                    >
                      Remove
                    </button>
                  </div>
                </div>
              ) : (
                <button
                  type="button"
                  onClick={() => logoInputRef.current?.click()}
                  className="flex flex-col items-center justify-center gap-1 rounded-xl border-2 border-dashed border-[#1F1814]/15 bg-[#FAF6F0] px-6 py-5 text-center transition hover:border-[#C2410C]/60 hover:bg-[#C2410C]/5"
                >
                  <span className="text-sm font-semibold text-[#1F1814]">
                    Click to upload logo
                  </span>
                  <span className="text-xs text-[#1F1814]/55">
                    PNG, JPG, SVG · up to 10 MB
                  </span>
                </button>
              )}
              <input
                ref={logoInputRef}
                type="file"
                accept={ACCEPT}
                onChange={handleLogoPick}
                className="hidden"
              />
            </div>

            <div className="grid gap-2">
              <label className={labelCls}>
                Photos{" "}
                <span className="font-normal text-[#1F1814]/55">
                  — up to {MAX_PHOTOS}, optional
                </span>
              </label>
              {photoFiles.length > 0 && (
                <div className="grid grid-cols-3 gap-2 sm:grid-cols-4">
                  {photoFiles.map((f, i) => (
                    <FilePreview
                      key={`${f.name}-${i}`}
                      file={f}
                      onRemove={() => removePhoto(i)}
                    />
                  ))}
                </div>
              )}
              {photoFiles.length < MAX_PHOTOS && (
                <button
                  type="button"
                  onClick={() => photosInputRef.current?.click()}
                  className="flex flex-col items-center justify-center gap-1 rounded-xl border-2 border-dashed border-[#1F1814]/15 bg-[#FAF6F0] px-6 py-5 text-center transition hover:border-[#C2410C]/60 hover:bg-[#C2410C]/5"
                >
                  <span className="text-sm font-semibold text-[#1F1814]">
                    {photoFiles.length === 0
                      ? "Click to add photos"
                      : `Add more (${MAX_PHOTOS - photoFiles.length} left)`}
                  </span>
                  <span className="text-xs text-[#1F1814]/55">
                    Storefront, finished work, your team
                  </span>
                </button>
              )}
              <input
                ref={photosInputRef}
                type="file"
                accept={ACCEPT}
                multiple
                onChange={handlePhotosPick}
                className="hidden"
              />
            </div>

            {fileError && <p className="text-sm text-red-600">{fileError}</p>}
          </fieldset>
        )}

        {/* Step 2 — Contact info LAST (after the prospect has invested 2 steps of effort) */}
        {step === 2 && (
          <fieldset data-step="2" className="grid gap-4">
            <p className="text-sm text-[#1F1814]/65">
              Last step. We&apos;ll send your live URL within 24 hours — or
              it&apos;s free.
            </p>
            <div className="grid gap-2">
              <label htmlFor="name" className={labelCls}>
                Your name
              </label>
              <input
                id="name"
                name="name"
                type="text"
                required
                autoComplete="name"
                autoFocus
                className={inputCls}
                placeholder="Jane Doe"
              />
            </div>
            <div className="grid gap-4 sm:grid-cols-2">
              <div className="grid gap-2">
                <label htmlFor="email" className={labelCls}>
                  Email
                </label>
                <input
                  id="email"
                  name="email"
                  type="email"
                  required
                  autoComplete="email"
                  className={inputCls}
                  placeholder="jane@yourbusiness.com"
                />
              </div>
              <div className="grid gap-2">
                <label htmlFor="phone" className={labelCls}>
                  Phone
                </label>
                <input
                  id="phone"
                  name="phone"
                  type="tel"
                  required
                  autoComplete="tel"
                  className={inputCls}
                  placeholder="+1 555 010 0000"
                />
              </div>
            </div>

            {/* SMS consent — required by carrier (TCPA / A2P 10DLC). Must be
                explicit + unchecked by default. Submit handler blocks if not
                ticked. Phrased plain-English; the legal disclosure stays
                visible above the submit button. */}
            <label className="flex cursor-pointer items-start gap-3 rounded-xl border border-[#1F1814]/15 bg-[#FAF6F0] px-4 py-3 has-[:checked]:border-[#C2410C] has-[:checked]:bg-[#C2410C]/5">
              <input
                id="smsConsent"
                name="smsConsent"
                type="checkbox"
                required
                className="mt-0.5 h-4 w-4 accent-[#C2410C]"
              />
              <span className="text-sm text-[#1F1814]/80">
                <strong className="font-semibold text-[#1F1814]">
                  Yes, text me my preview.
                </strong>{" "}
                I agree to receive SMS from We Did It For You at the number above
                about my free website preview and order updates. Message frequency
                varies. Msg &amp; data rates may apply. Reply STOP to opt out,
                HELP for help. See our{" "}
                <a
                  href="/privacy"
                  target="_blank"
                  rel="noopener"
                  className="font-medium underline"
                >
                  Privacy Policy
                </a>
                .
              </span>
            </label>
          </fieldset>
        )}
      </div>

      {/* Action bar */}
      <div className="grid gap-3">
        {step < stepCount - 1 ? (
          <button
            type="button"
            onClick={next}
            className="inline-flex items-center justify-center rounded-xl bg-[#C2410C] px-6 py-4 text-base font-semibold text-white transition hover:bg-[#9A3412]"
          >
            Continue →
          </button>
        ) : (
          <button
            type="submit"
            disabled={status === "submitting"}
            className="inline-flex items-center justify-center rounded-xl bg-[#C2410C] px-6 py-4 text-base font-semibold text-white transition hover:bg-[#9A3412] disabled:cursor-not-allowed disabled:opacity-60"
          >
            {status === "submitting"
              ? logoFile || photoFiles.length > 0
                ? "Uploading…"
                : "Sending…"
              : "Build mine free →"}
          </button>
        )}

        {stepError && <p className="text-sm text-red-600">{stepError}</p>}
        {status === "error" && (
          <p className="text-sm text-red-600">{errorMsg}</p>
        )}

        <p className="text-center text-xs text-[#1F1814]/50">
          Takes about 60 seconds. We never sell your info — only use it to
          build and deliver your site.
        </p>
      </div>
    </form>
  );
}
