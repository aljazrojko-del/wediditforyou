"use client";

import { useRef } from "react";
import gsap from "gsap";
import { ScrollTrigger } from "gsap/ScrollTrigger";
import { useGSAP } from "@gsap/react";

if (typeof window !== "undefined") {
  gsap.registerPlugin(ScrollTrigger, useGSAP);
}

type Props = {
  children: React.ReactNode;
  className?: string;
  variant?: "fade-up" | "fade" | "scale" | "stagger";
  delay?: number;
  /**
   * For "stagger" variant — selector inside the container that targets the
   * children to animate in sequence.
   */
  staggerSelector?: string;
  /**
   * Render as a different tag (default: div).
   */
  as?: "div" | "section" | "ul" | "ol" | "header" | "footer";
};

export default function ScrollReveal({
  children,
  className,
  variant = "fade-up",
  delay = 0,
  staggerSelector,
  as: Tag = "div",
}: Props) {
  const containerRef = useRef<HTMLElement | null>(null);

  useGSAP(
    () => {
      const el = containerRef.current;
      if (!el) return;

      const trigger = {
        trigger: el,
        start: "top 85%",
        toggleActions: "play none none none",
      };

      if (variant === "stagger" && staggerSelector) {
        const targets = el.querySelectorAll(staggerSelector);
        gsap.fromTo(
          targets,
          { opacity: 0, y: 28 },
          {
            opacity: 1,
            y: 0,
            duration: 0.7,
            stagger: 0.08,
            ease: "power3.out",
            delay,
            scrollTrigger: trigger,
          },
        );
        return;
      }

      const from =
        variant === "scale"
          ? { opacity: 0, scale: 0.94 }
          : variant === "fade"
            ? { opacity: 0 }
            : { opacity: 0, y: 32 };

      const to =
        variant === "scale"
          ? { opacity: 1, scale: 1 }
          : variant === "fade"
            ? { opacity: 1 }
            : { opacity: 1, y: 0 };

      gsap.fromTo(el, from, {
        ...to,
        duration: 0.8,
        ease: "power3.out",
        delay,
        scrollTrigger: trigger,
      });
    },
    { scope: containerRef },
  );

  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const refProp = containerRef as any;

  return (
    <Tag ref={refProp} className={className}>
      {children}
    </Tag>
  );
}
