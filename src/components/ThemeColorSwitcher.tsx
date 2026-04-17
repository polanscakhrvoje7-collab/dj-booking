"use client";

import { useEffect } from "react";

const DARK = "#09090b";
const LIGHT = "#ffffff";

export function ThemeColorSwitcher() {
  useEffect(() => {
    const heroEl = document.getElementById("hero");
    if (!heroEl) return;

    const setColor = (color: string) => {
      document
        .querySelectorAll('meta[name="theme-color"]')
        .forEach((el) => ((el as HTMLMetaElement).content = color));
    };

    const observer = new IntersectionObserver(
      ([entry]) => setColor(entry.isIntersecting ? DARK : LIGHT),
      { threshold: 0.01 }
    );

    observer.observe(heroEl);
    return () => observer.disconnect();
  }, []);

  return null;
}
