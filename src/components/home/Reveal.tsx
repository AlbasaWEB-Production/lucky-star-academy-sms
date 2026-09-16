"use client";

import { useEffect, useRef, useState, type ReactNode } from "react";
import { Box } from "@mui/material";

/**
 * Reveal-on-scroll wrapper.
 *
 * A block fades and rises the first time it enters the viewport. The motion
 * itself lives in `globals.css` (the `[data-reveal]` transition); this component
 * only flips the attribute once, through an IntersectionObserver, then stops
 * observing.
 *
 * Correct first paint matters more than the effect. The server-rendered markup
 * carries `data-reveal="out"`, the CSS that hides an "out" element is wrapped in
 * `prefers-reduced-motion: no-preference`, and the homepage ships a `<noscript>`
 * rule that unhides everything — so a visitor with reduced motion on, or with
 * JavaScript off, gets the final state immediately with no animation and no
 * flash.
 *
 * Only opacity and transform animate and the wrapper occupies its space from the
 * first frame, so the reveal contributes no layout shift.
 */
export default function Reveal({
  children,
  delayMs = 0,
}: {
  children: ReactNode;
  /** Stagger before this block reveals, in ms, for a stepped entrance. */
  delayMs?: number;
}) {
  const ref = useRef<HTMLDivElement | null>(null);
  const [revealed, setRevealed] = useState(false);

  useEffect(() => {
    const node = ref.current;
    if (!node) return;

    // Reduced motion: show the final state immediately and never animate.
    if (window.matchMedia("(prefers-reduced-motion: reduce)").matches) {
      setRevealed(true);
      return;
    }

    const observer = new IntersectionObserver(
      (entries) => {
        for (const entry of entries) {
          if (entry.isIntersecting) {
            setRevealed(true);
            observer.disconnect();
          }
        }
      },
      { rootMargin: "0px 0px -8% 0px", threshold: 0.08 },
    );

    observer.observe(node);
    return () => observer.disconnect();
  }, []);

  return (
    <Box
      ref={ref}
      data-reveal={revealed ? "in" : "out"}
      sx={delayMs > 0 ? { transitionDelay: `${delayMs}ms` } : undefined}
    >
      {children}
    </Box>
  );
}
