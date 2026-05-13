"use client";

import { useEffect } from "react";

/**
 * Client component that activates IntersectionObserver-based
 * scroll-reveal animations on elements with the "reveal" class.
 *
 * Renders its children as-is and attaches the observer on mount.
 * This is the only interactive JS required for the homepage --
 * all other animations (rings, floating chips, core glow) are pure CSS.
 */
export default function ScrollReveal({
  children,
}: {
  children: React.ReactNode;
}) {
  useEffect(() => {
    const revealItems = document.querySelectorAll(
      ".reveal, .reveal-tilt, .reveal-left, .reveal-right, .reveal-scale"
    );
    const revealObserver = new IntersectionObserver(
      (entries) => {
        entries.forEach((entry) => {
          if (entry.isIntersecting) {
            entry.target.classList.add("visible");
            revealObserver.unobserve(entry.target);
          }
        });
      },
      { threshold: 0.12 }
    );

    revealItems.forEach((item) => revealObserver.observe(item));

    return () => {
      revealObserver.disconnect();
    };
  }, []);

  return <>{children}</>;
}
