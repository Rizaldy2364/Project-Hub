"use client";

import { useState } from "react";
import { Copy, Check } from "lucide-react";

export function CopyCodeButton({ code }: { code: string }) {
  const [copied, setCopied] = useState(false);

  async function handleCopy() {
    try {
      await navigator.clipboard.writeText(code);
      setCopied(true);
      setTimeout(() => setCopied(false), 1500);
    } catch {
      // clipboard bisa ditolak browser; abaikan
    }
  }

  return (
    <button
      type="button"
      onClick={handleCopy}
      title="Salin kode join"
      aria-label={`Salin kode join ${code}`}
      className="relative z-10 inline-flex items-center gap-1.5 px-2.5 py-1 rounded-lg border border-slate-200 bg-slate-100 dark:border-slate-700 dark:bg-slate-800 text-slate-600 dark:text-slate-300 text-xs font-mono font-medium hover:bg-slate-200 dark:hover:bg-slate-700 transition-colors"
    >
      <span className="text-slate-400 dark:text-slate-500">Kode:</span>
      {code}
      {copied ? (
        <Check className="w-3 h-3 text-emerald-500" />
      ) : (
        <Copy className="w-3 h-3" />
      )}
    </button>
  );
}