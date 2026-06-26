"use client";

import Link from "next/link";
import {
  MessageSquare,
  Search,
  Calculator,
  Image as ImageIcon,
  Video,
  Calendar,
  Mic,
  LayoutTemplate,
  Globe,
  TrendingUp,
  ArrowRight,
} from "lucide-react";
import { ThemeToggle } from "@/components/ThemeToggle";
/*
import { SplashScreen } from "@/components/SplashScreen";
*/
const FEATURES = [
  { icon: MessageSquare, label: "Chat" },
  { icon: Search, label: "Research" },
  { icon: Calculator, label: "Math" },
  { icon: ImageIcon, label: "Image" },
  { icon: Video, label: "Video" },
  { icon: Calendar, label: "Schedule" },
  { icon: Mic, label: "Meetings" },
  { icon: LayoutTemplate, label: "Design" },
  { icon: Globe, label: "Website" },
  { icon: TrendingUp, label: "SEO" },
];

export default function LandingPage() {
  return (
   // <SplashScreen>
      <main className="min-h-screen">
      <header className="flex items-center justify-between px-6 py-5 md:px-10">
        <span className="font-display text-lg font-semibold">EmGlodAi</span>
        <div className="flex items-center gap-4">
          <ThemeToggle />
          <Link
            href="/login"
            className="rounded-xl2 bg-violet px-4 py-2 text-sm font-medium text-white hover:opacity-90 transition-opacity"
          >
            Sign in
          </Link>
        </div>
      </header>

      <section className="px-6 pt-16 pb-20 text-center md:px-10 md:pt-24">
        <h1 className="mx-auto max-w-2xl font-display text-4xl font-semibold tracking-tight md:text-5xl">
          One box. Every tool.
        </h1>
        <p className="mx-auto mt-4 max-w-xl text-base text-muted dark:text-muted-dark">
          Chat, research, generate images and video, plan your schedule, and more —
          all from a single command bar.
        </p>
        <Link
          href="/login"
          className="mt-8 inline-flex items-center gap-2 rounded-xl2 bg-violet px-6 py-3 text-sm font-medium text-white hover:opacity-90 transition-opacity"
        >
          Get started
          <ArrowRight size={16} />
        </Link>
      </section>

      <section className="px-6 pb-24 md:px-10">
        <div className="mx-auto grid max-w-4xl grid-cols-2 gap-3 sm:grid-cols-3 md:grid-cols-5">
          {FEATURES.map(({ icon: Icon, label }) => (
            <div
              key={label}
              className="flex flex-col items-center gap-2 rounded-xl2 border border-line dark:border-line-dark bg-surface dark:bg-surface-dark px-4 py-6 text-center"
            >
              <span className="flex h-9 w-9 items-center justify-center rounded-full bg-violet/10 text-violet">
                <Icon size={18} />
              </span>
              <span className="text-xs font-medium text-muted dark:text-muted-dark">
                {label}
              </span>
            </div>
          ))}
        </div>
      </section>
    </main>
   // </SplashScreen>
  );
}