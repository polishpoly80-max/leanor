import { useEffect, useLayoutEffect, useRef } from "react";

const useIsomorphicLayoutEffect =
  typeof window !== "undefined" ? useLayoutEffect : useEffect;

/**
 * Reveal an element once it scrolls into view.
 *
 * The hidden state is applied from JS (not in the markup), so if scripting
 * fails the content is still visible — the page must never depend on an
 * animation to be readable. `delay` staggers siblings so cards cascade in
 * rather than popping together.
 */
export default function useReveal({ threshold = 0.12, delay = 0 } = {}) {
  const ref = useRef(null);

  useIsomorphicLayoutEffect(() => {
    const node = ref.current;
    if (!node) return undefined;

    // Respect the OS setting outright: show everything, skip the machinery.
    if (window.matchMedia?.("(prefers-reduced-motion: reduce)").matches) {
      return undefined;
    }
    if (typeof IntersectionObserver === "undefined") {
      return undefined;
    }

    node.classList.add("reveal");
    node.style.setProperty("--reveal-delay", `${delay}ms`);

    const observer = new IntersectionObserver(
      ([entry]) => {
        if (entry.isIntersecting) {
          entry.target.classList.add("is-revealed");
          observer.disconnect();
        }
      },
      { threshold, rootMargin: "0px 0px -48px 0px" },
    );

    observer.observe(node);
    return () => observer.disconnect();
  }, [threshold, delay]);

  return ref;
}

/** Component wrapper so pages can use it declaratively. */
export function Reveal({ as: Tag = "div", delay = 0, className = "", children, ...rest }) {
  const ref = useReveal({ delay });
  return (
    <Tag ref={ref} className={className.trim()} {...rest}>
      {children}
    </Tag>
  );
}