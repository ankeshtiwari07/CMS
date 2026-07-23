"use client";
import { useEffect } from "react";

/**
 * Payload's admin themes off `html[data-theme="light|dark"]`, while HUMAIN
 * Foundation ships its dark token values under a `.dark` class. This mirrors
 * the former onto the latter so the admin picks up the real design system in
 * both themes without us re-declaring a single token value.
 *
 * Rendered inside the Payload RootLayout (a direct import, so it does not need
 * to be registered in the generated importMap).
 */
export default function ThemeClassBridge() {
  useEffect(() => {
    const el = document.documentElement;
    const sync = () => {
      const t = el.getAttribute("data-theme");
      const dark = t === "dark" || (!t && window.matchMedia("(prefers-color-scheme: dark)").matches);
      el.classList.toggle("dark", dark);
    };
    sync();
    const obs = new MutationObserver(sync);
    obs.observe(el, { attributes: true, attributeFilter: ["data-theme"] });
    const mq = window.matchMedia("(prefers-color-scheme: dark)");
    mq.addEventListener("change", sync);
    return () => {
      obs.disconnect();
      mq.removeEventListener("change", sync);
    };
  }, []);
  return null;
}
