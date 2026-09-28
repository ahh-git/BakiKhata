"use client";

import { useEffect, useState } from "react";

export function InstallPWA() {
  const [promptEvent, setPromptEvent] = useState<any>(null);
  const [show, setShow] = useState(false);

  useEffect(() => {
    const onPrompt = (e: Event) => {
      e.preventDefault();
      setPromptEvent(e);
      setShow(true);
    };
    window.addEventListener("beforeinstallprompt", onPrompt);
    return () => window.removeEventListener("beforeinstallprompt", onPrompt);
  }, []);

  if (!show || !promptEvent) return null;

  return (
    <button
      className="glass-chip"
      onClick={async () => {
        promptEvent.prompt();
        await promptEvent.userChoice;
        setShow(false);
      }}
    >
      অ্যাপ ইনস্টল করুন
    </button>
  );
}
