"use client";

import { useState, type KeyboardEvent } from "react";
import { X } from "lucide-react";

interface TagInputProps {
  id: string;
  label: string;
  values: string[];
  onChange: (values: string[]) => void;
  placeholder?: string;
  hint?: string;
  maxItems: number;
  maxLength: number;
}

/** Input tag: ketik lalu tekan Enter (atau koma) untuk menambah; klik x untuk menghapus. */
export function TagInput({
  id,
  label,
  values,
  onChange,
  placeholder,
  hint,
  maxItems,
  maxLength,
}: TagInputProps) {
  const [draft, setDraft] = useState("");
  const isFull = values.length >= maxItems;

  function addTag(raw: string) {
    const value = raw.trim().slice(0, maxLength);
    setDraft("");
    if (!value || isFull) return;
    if (values.some((item) => item.toLowerCase() === value.toLowerCase())) return;
    onChange([...values, value]);
  }

  function handleKeyDown(event: KeyboardEvent<HTMLInputElement>) {
    if (event.key === "Enter" || event.key === ",") {
      event.preventDefault();
      addTag(draft);
      return;
    }
    if (event.key === "Backspace" && draft === "" && values.length > 0) {
      onChange(values.slice(0, -1));
    }
  }

  return (
    <div>
      <div className="flex items-center justify-between gap-3">
        <label htmlFor={id} className="text-xs font-semibold text-slate-600 dark:text-slate-300">
          {label}
        </label>
        <span className="text-[11px] font-medium text-slate-400 dark:text-slate-500">
          {values.length}/{maxItems}
        </span>
      </div>

      <div className="mt-1.5 flex flex-wrap items-center gap-2 rounded-xl border border-slate-200 bg-white px-3 py-2 transition focus-within:border-blue-500 focus-within:ring-2 focus-within:ring-blue-500/30 dark:border-slate-700 dark:bg-slate-800">
        {values.length > 0 && (
          <ul className="flex flex-wrap items-center gap-1.5">
            {values.map((value) => (
              <li
                key={value}
                className="inline-flex items-center gap-1 rounded-md bg-blue-50 px-2 py-1 text-xs font-semibold text-blue-700 dark:bg-blue-500/15 dark:text-blue-300"
              >
                {value}
                <button
                  type="button"
                  onClick={() => onChange(values.filter((item) => item !== value))}
                  aria-label={`Hapus ${value}`}
                  className="rounded text-blue-600/70 transition-colors hover:text-red-600 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-red-500 dark:text-blue-300/70 dark:hover:text-red-400"
                >
                  <X className="h-3 w-3" />
                </button>
              </li>
            ))}
          </ul>
        )}

        <input
          id={id}
          value={draft}
          onChange={(event) => setDraft(event.target.value)}
          onKeyDown={handleKeyDown}
          onBlur={() => addTag(draft)}
          maxLength={maxLength}
          disabled={isFull}
          placeholder={isFull ? "Batas maksimal tercapai" : placeholder}
          className="min-w-24 flex-1 bg-transparent py-1 text-sm text-slate-800 outline-none placeholder:text-slate-400 disabled:cursor-not-allowed dark:text-slate-100"
        />
      </div>

      {hint && <p className="mt-1.5 text-[11px] text-slate-500 dark:text-slate-400">{hint}</p>}
    </div>
  );
}
