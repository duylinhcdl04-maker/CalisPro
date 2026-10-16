import { useRef } from "react";
import { useReducedMotion, useScroll, useTransform } from "motion/react";

/**
 * Ties opacity/translate to live scroll progress instead of a fire-once
 * IntersectionObserver, so a fast scroll or a jump straight to the element
 * (End key, scrollbar drag) never leaves it stuck invisible.
 */
export function useScrollReveal<T extends HTMLElement>(distance = 28) {
  const ref = useRef<T>(null);
  const reduce = useReducedMotion();

  const { scrollYProgress } = useScroll({
    target: ref,
    offset: ["start 92%", "start 55%"],
  });

  const opacity = useTransform(scrollYProgress, [0, 1], reduce ? [1, 1] : [0, 1]);
  const y = useTransform(scrollYProgress, [0, 1], reduce ? [0, 0] : [distance, 0]);

  return { ref, progress: scrollYProgress, style: { opacity, y } };
}
