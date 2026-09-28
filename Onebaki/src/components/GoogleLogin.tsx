"use client";

import { useEffect, useRef, useState } from "react";
import { config } from "@/lib/config";
import { supabase } from "@/lib/supabase";

declare global {
  interface Window {
    google?: {
      accounts: {
        id: {
          initialize: (opts: Record<string, unknown>) => void;
          renderButton: (el: HTMLElement, opts: Record<string, unknown>) => void;
        };
      };
    };
  }
}

export function GoogleLogin() {
  const box = useRef<HTMLDivElement>(null);
  const [error, setError] = useState("");
  const [busy, setBusy] = useState(false);

  useEffect(() => {
    const script = document.createElement("script");
    script.src = "https://accounts.google.com/gsi/client";
    script.async = true;
    script.onload = () => {
      if (!window.google || !box.current) return;
      window.google.accounts.id.initialize({
        client_id: config.googleClientId,
        callback: async (response: { credential: string }) => {
          setBusy(true);
          setError("");
          const { error: err } = await supabase.auth.signInWithIdToken({
            provider: "google",
            token: response.credential,
          });
          if (err) setError(err.message);
          setBusy(false);
        },
      });
      window.google.accounts.id.renderButton(box.current, {
        theme: "outline",
        size: "large",
        width: 320,
        text: "continue_with",
        shape: "pill",
        logo_alignment: "left",
      });
    };
    document.body.appendChild(script);
    return () => {
      script.remove();
    };
  }, []);

  const oauth = async () => {
    setBusy(true);
    setError("");
    const { error: err } = await supabase.auth.signInWithOAuth({
      provider: "google",
      options: {
        redirectTo: typeof window !== "undefined" ? `${window.location.origin}/home` : undefined,
        queryParams: { access_type: "offline", prompt: "consent" },
      },
    });
    if (err) {
      setError(err.message);
      setBusy(false);
    }
  };

  return (
    <div className="flex w-full flex-col items-center gap-4">
      <div ref={box} className="flex min-h-[44px] justify-center" />
      <button
        type="button"
        onClick={oauth}
        disabled={busy}
        className="glass-btn flex w-full max-w-[320px] items-center justify-center gap-3 rounded-full px-5 py-3 text-sm font-semibold text-slate-800"
      >
        <GoogleMark />
        {busy ? "কানেক্ট হচ্ছে..." : "Google দিয়ে চালিয়ে যান"}
      </button>
      {error ? <p className="max-w-sm text-center text-xs text-rose-600">{error}</p> : null}
    </div>
  );
}

function GoogleMark() {
  return (
    <svg width="18" height="18" viewBox="0 0 48 48" aria-hidden>
      <path fill="#FFC107" d="M43.6 20.5H42V20H24v8h11.3C33.7 32.7 29.3 36 24 36c-6.6 0-12-5.4-12-12s5.4-12 12-12c3.1 0 5.8 1.2 8 3.1l5.7-5.7C34.2 6.1 29.4 4 24 4 12.9 4 4 12.9 4 24s8.9 20 20 20 20-8.9 20-20c0-1.2-.1-2.3-.4-3.5z" />
      <path fill="#FF3D00" d="M6.3 14.7l6.6 4.8C14.7 16 19 12 24 12c3.1 0 5.8 1.2 8 3.1l5.7-5.7C34.2 6.1 29.4 4 24 4 16.3 4 9.6 8.3 6.3 14.7z" />
      <path fill="#4CAF50" d="M24 44c5.2 0 10-2 13.6-5.2l-6.3-5.3C29.2 35.1 26.7 36 24 36c-5.3 0-9.7-3.3-11.3-8l-6.5 5C9.5 39.6 16.2 44 24 44z" />
      <path fill="#1976D2" d="M43.6 20.5H42V20H24v8h11.3c-1.1 3.2-3.5 5.8-6.6 7.5l6.3 5.3C37.8 38.3 44 34 44 24c0-1.2-.1-2.3-.4-3.5z" />
    </svg>
  );
}
