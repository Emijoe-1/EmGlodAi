"use client";

import { useEffect, useState } from "react";

// Keep this in sync with the "4s" hardcoded into the splash-progress
// animation below — that bar's fill time should always match the total
// splash duration so it finishes exactly as the splash disappears.
const SPLASH_DURATION_MS = 1000;
const FADE_DURATION_MS = 700; // how long the fade-out transition takes

// Wraps page content. Shows the logo full-screen on top of the page for
// SPLASH_DURATION_MS, then fades it out to reveal whatever's underneath.
// The actual page content mounts immediately behind it, so there's no
// flash/delay once the splash disappears.
export function SplashScreen({ children }) {
  const [visible, setVisible] = useState(true);
  const [fadingOut, setFadingOut] = useState(false);

  useEffect(() => {
    const fadeTimer = setTimeout(
      () => setFadingOut(true),
      SPLASH_DURATION_MS - FADE_DURATION_MS
    );
    const removeTimer = setTimeout(() => setVisible(false), SPLASH_DURATION_MS);
    return () => {
      clearTimeout(fadeTimer);
      clearTimeout(removeTimer);
    };
  }, []);

  return (
    <>
      {visible && (
        <div
          className={`fixed inset-0 z-[100] flex flex-col items-center justify-center gap-6 bg-[#000011] transition-opacity duration-[700ms] ${
            fadingOut ? "opacity-0" : "opacity-100"
          }`}
        >
          <img
            src="/logo.png"
            alt="EmGlodAi"
            className="w-[140px] sm:w-[200px] md:w-[300px] lg:w-[360px] h-auto animate-[splash-breathe_3s_ease-in-out_infinite]"
          />
          <div className="h-[2px] w-[140px] sm:w-[200px] md:w-[260px] overflow-hidden rounded-full bg-white/10">
            <div className="h-full bg-violet animate-[splash-progress_4s_ease-out_forwards]" />
          </div>
        </div>
      )}
      {children}
    </>
  );
}