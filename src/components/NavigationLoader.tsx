"use client";

import { useEffect, useRef } from "react";
import { usePathname } from "next/navigation";

export default function NavigationLoader({
  children,
}: {
  children: React.ReactNode;
}) {
  const pathname = usePathname();
  const pathnameRef = useRef(pathname);
  pathnameRef.current = pathname;

  // When pathname changes, navigation is done — hide the overlay
  useEffect(() => {
    document.body.classList.remove("nav-loading");
  }, [pathname]);

  // Intercept internal link clicks to show loader immediately via direct DOM
  useEffect(() => {
    const handler = (e: MouseEvent) => {
      let target = e.target as HTMLElement;
      while (target && target.tagName !== "A") {
        target = target.parentElement as HTMLElement;
      }
      if (!target) return;

      const anchor = target as HTMLAnchorElement;
      const href = anchor.getAttribute("href");
      if (!href) return;

      // Skip external links, hash links, and special protocols
      if (
        href.startsWith("http") ||
        href.startsWith("#") ||
        href.startsWith("javascript:") ||
        href.startsWith("mailto:") ||
        href.startsWith("tel:")
      )
        return;

      // Skip if target="_blank" or modifier keys (new tab)
      if (
        anchor.target === "_blank" ||
        e.ctrlKey ||
        e.metaKey ||
        e.shiftKey
      )
        return;

      // Skip download links
      if (anchor.hasAttribute("download")) return;

      // Skip if navigating to the SAME path — pathname won't change,
      // so the cleanup effect would never fire, leaving the overlay stuck.
      if (href === pathnameRef.current || href === pathnameRef.current + "/") return;

      // Direct DOM class — synchronous, instant, no React batching to worry about
      document.body.classList.add("nav-loading");

      // Safety timeout: force-hide overlay after 15s in case navigation
      // silently fails (e.g. network error, dead route)
      const safetyTimer = setTimeout(() => {
        document.body.classList.remove("nav-loading");
      }, 15_000);

      // Store timer for cleanup on successful navigation
      (anchor as any).__navLoaderTimer = safetyTimer;
    };

    document.addEventListener("click", handler);
    return () => document.removeEventListener("click", handler);
  }, []);

  // Clean up any safety timers when pathname changes (navigation succeeded)
  useEffect(() => {
    // Clear safety timers on all links
    const anchors = document.querySelectorAll("a");
    anchors.forEach((a) => {
      const timer = (a as any).__navLoaderTimer;
      if (timer) {
        clearTimeout(timer);
        delete (a as any).__navLoaderTimer;
      }
    });
  }, [pathname]);

  return (
    <>
      {children}

      {/* Full-screen loading overlay — controlled by body.nav-loading class via globals.css */}
      <div
        id="nav-loader"
        className="fixed inset-0 z-50 flex items-center justify-center opacity-0 pointer-events-none transition-opacity duration-200"
      >
        {/* Backdrop */}
        <div className="absolute inset-0 bg-black/40 backdrop-blur-sm" />

        {/* Card */}
        <div className="relative bg-white rounded-xl shadow-2xl px-8 py-6 flex flex-col items-center gap-4 min-w-[280px]">
          {/* Spinner */}
          <div className="relative w-10 h-10">
            <div className="absolute inset-0 rounded-full border-4 border-[#eef2ff]" />
            <div className="absolute inset-0 rounded-full border-4 border-transparent border-t-[#635bff] animate-spin" />
          </div>

          <div className="text-center">
            <p className="text-base font-medium text-gray-800">
              正在加载...
            </p>
            <p className="text-xs text-gray-400 mt-1">
              外网访问可能需要稍等片刻
            </p>
          </div>
        </div>
      </div>
    </>
  );
}
