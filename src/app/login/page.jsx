"use client";

import { useState } from "react";
import { supabase } from "@/lib/supabaseClient";
import { ThemeToggle } from "@/components/ThemeToggle";

export default function LoginPage() {
  const [email, setEmail] = useState("");
  const [sent, setSent] = useState(false);
  const [error, setError] = useState(null);

  async function handleEmailLogin(e) {
    e.preventDefault();
    setError(null);
    const { error } = await supabase.auth.signInWithOtp({ email });
    if (error) setError(error.message);
    else setSent(true);
  }

  async function handleOAuth(provider) {
    await supabase.auth.signInWithOAuth({
      provider,
      options: { redirectTo: `${window.location.origin}/app` },
      
    });
  }

  return (
    <main className="flex min-h-screen flex-col items-center justify-center px-6">
      <div className="absolute right-6 top-6">
        <ThemeToggle />
      </div>

      <div className="w-full max-w-sm">
        <h1 className="font-display text-3xl font-semibold tracking-tight">EmGlodAi</h1>
        <p className="mt-2 text-sm text-muted dark:text-muted-dark">
          One box. Every tool. Sign in to start.
        </p>

        <div className="mt-8 flex flex-col gap-2">
          <button
            onClick={() => handleOAuth("google")}
            className="rounded-xl2 border border-line dark:border-line-dark px-4 py-3 text-sm font-medium hover:border-violet transition-colors"
          >
            Continue with Google
          </button>
          <button
            onClick={() => handleOAuth("apple")}
            className="rounded-xl2 border border-line dark:border-line-dark px-4 py-3 text-sm font-medium hover:border-violet transition-colors"
          >
            Continue with Apple
          </button>
        </div>

        <div className="my-6 flex items-center gap-3 text-xs text-muted dark:text-muted-dark">
          <div className="h-px flex-1 bg-line dark:bg-line-dark" />
          or
          <div className="h-px flex-1 bg-line dark:bg-line-dark" />
        </div>

        {sent ? (
          <p className="text-sm text-violet">Check your email for a sign-in link.</p>
        ) : (
          <form onSubmit={handleEmailLogin} className="flex flex-col gap-3">
            <input
              type="email"
              required
              placeholder="you@example.com"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              className="rounded-xl2 border border-line dark:border-line-dark bg-surface dark:bg-surface-dark px-4 py-3 text-sm outline-none focus-visible:border-violet"
            />
            <button
              type="submit"
              className="rounded-xl2 bg-violet px-4 py-3 text-sm font-medium text-white hover:opacity-90 transition-opacity"
            >
              Send sign-in link
            </button>
          </form>
        )}
        {error && <p className="mt-3 text-sm text-red-500">{error}</p>}
      </div>
    </main>
  );
}
