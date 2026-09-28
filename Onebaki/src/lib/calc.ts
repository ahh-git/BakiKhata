const ALLOWED = /^[0-9+\-*/().\s]+$/;

export function liveEval(input: string): number | null {
  const raw = input.trim();
  if (!raw) return null;
  if (!ALLOWED.test(raw)) return null;
  if (/[+\-*/.]{2,}/.test(raw.replace(/\s/g, ""))) {
    // still try if it's like 10+10
  }
  try {
    const result = Function(`"use strict"; return (${raw})`)();
    if (typeof result !== "number" || !Number.isFinite(result)) return null;
    return Math.round(result * 100) / 100;
  } catch {
    return null;
  }
}

export function money(n: number) {
  return new Intl.NumberFormat("bn-BD", {
    maximumFractionDigits: 2,
    minimumFractionDigits: 0,
  }).format(n);
}
