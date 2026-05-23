"use client";

import { useRef } from "react";
import gsap from "gsap";
import { ScrollTrigger } from "gsap/ScrollTrigger";
import { useGSAP } from "@gsap/react";

if (typeof window !== "undefined") {
  gsap.registerPlugin(ScrollTrigger, useGSAP);
}

type Props = {
  to: number;
  duration?: number;
  className?: string;
  /** Appended to the rendered number, e.g. "+", "h", "%". */
  suffix?: string;
  /** Prepended to the rendered number, e.g. "$". */
  prefix?: string;
};

export default function CountUp({
  to,
  duration = 1.4,
  className,
  suffix = "",
  prefix = "",
}: Props) {
  const ref = useRef<HTMLSpanElement>(null);

  useGSAP(
    () => {
      const el = ref.current;
      if (!el) return;

      // Animate only when the element scrolls into view.
      // Until then the SSR-rendered final value stays visible — no flash of zeros.
      ScrollTrigger.create({
        trigger: el,
        start: "top 85%",
        once: true,
        onEnter: () => {
          const obj = { val: 0 };
          gsap.to(obj, {
            val: to,
            duration,
            ease: "power2.out",
            onUpdate: () => {
              el.textContent = `${prefix}${Math.round(obj.val)}${suffix}`;
            },
          });
        },
      });
    },
    { scope: ref },
  );

  // SSR + first-paint render the final value, so no-JS / slow-JS visitors
  // never see a placeholder zero. GSAP swaps to 0 only when the animation fires.
  return (
    <span ref={ref} className={className}>
      {`${prefix}${to}${suffix}`}
    </span>
  );
}
