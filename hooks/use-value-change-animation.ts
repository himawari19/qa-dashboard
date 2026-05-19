"use client";

import { useEffect, useRef, useState } from "react";

/**
 * Hook that detects when a value changes and returns a CSS class name
 * to trigger the stat-value-pop animation. The class is applied for
 * the animation duration (300ms) then removed.
 *
 * Uses transform and opacity only - no layout shifts.
 * Respects prefers-reduced-motion via the CSS @media rule in globals.css.
 */
export function useValueChangeAnimation(value: number | string | null | undefined): string {
  const prevValue = useRef(value);
  const [animating, setAnimating] = useState(false);

  useEffect(() => {
    // Skip animation on initial mount (prevValue starts as the initial value)
    if (prevValue.current !== value && prevValue.current !== undefined) {
      setAnimating(true);
      const timer = setTimeout(() => setAnimating(false), 300);
      return () => clearTimeout(timer);
    }
    prevValue.current = value;
  }, [value]);

  // Update ref after comparison
  useEffect(() => {
    prevValue.current = value;
  });

  return animating ? "animate-stat-pop" : "";
}
