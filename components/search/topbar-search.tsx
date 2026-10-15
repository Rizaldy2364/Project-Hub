"use client";

import {
  useCallback,
  useEffect,
  useMemo,
  useRef,
  useState,
  type ReactNode,
} from "react";
import { createPortal } from "react-dom";
import { usePathname, useRouter } from "next/navigation";
import { Search } from "lucide-react";
import { cn, formatDayMonthWib } from "@/lib/utils";
import {
  projectAvatarClass,
  projectInitial,
} from "@/components/chat/chat-utils";
import type {
  BoardTaskStatus,
  SearchResponse,
  SearchProjectResult,
  SearchTaskResult,
} from "@/types";

const DEBOUNCE_MS = 300;

const STATUS_LABEL: Record<BoardTaskStatus, string> = {
  TODO: "Belum",
  IN_PROGRESS: "Dikerjakan",
  DONE: "Selesai",
};

type FlatOption =
  | { kind: "project"; id: string; name: string }
  | {
      kind: "task";
      id: string;
      title: string;
      projectId: string;
      projectName: string;
    };

function optionDomId(opt: FlatOption): string {
  return `topbar-search-opt-${opt.kind}-${opt.id}`;
}

/** Tandai bagian teks yang cocok dengan query (bold), tanpa HTML mentah. */
function highlight(text: string, query: string): ReactNode {
  const q = query.trim();
  if (!q) return text;
  const idx = text.toLowerCase().indexOf(q.toLowerCase());
  if (idx === -1) return text;
  return (
    <>
      {text.slice(0, idx)}
      <strong className="font-bold">{text.slice(idx, idx + q.length)}</strong>
      {text.slice(idx + q.length)}
    </>
  );
}

export function TopBarSearch() {
  const router = useRouter();
  const pathname = usePathname();

  const containerRef = useRef<HTMLDivElement>(null);
  const panelRef = useRef<HTMLDivElement>(null);
  const inputRef = useRef<HTMLInputElement>(null);
  const abortRef = useRef<AbortController | null>(null);
  const reqIdRef = useRef(0);

  const [query, setQuery] = useState("");
  const [open, setOpen] = useState(false);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [results, setResults] = useState<SearchResponse | null>(null);
  const [activeIndex, setActiveIndex] = useState(-1);
  const [isMac, setIsMac] = useState(false);
  const [pos, setPos] = useState<{
    top: number;
    left: number;
    width: number;
  } | null>(null);

  const trimmed = query.trim();

  useEffect(() => {
    // Deteksi platform hanya di client (hindari hydration mismatch) — pola yang
    // sama seperti theme-toggle; setState di mount disengaja.
    // eslint-disable-next-line react-hooks/set-state-in-effect
    setIsMac(/Mac|iPhone|iPad/.test(navigator.platform || navigator.userAgent));
  }, []);

  const flatOptions = useMemo<FlatOption[]>(() => {
    if (!results) return [];
    const arr: FlatOption[] = [];
    for (const p of results.projects)
      arr.push({ kind: "project", id: p.id, name: p.name });
    for (const t of results.tasks)
      arr.push({
        kind: "task",
        id: t.id,
        title: t.title,
        projectId: t.project.id,
        projectName: t.project.name,
      });
    return arr;
  }, [results]);

  const runSearch = useCallback(async (term: string) => {
    abortRef.current?.abort();
    const controller = new AbortController();
    abortRef.current = controller;
    const myId = ++reqIdRef.current;
    try {
      const res = await fetch(`/api/search?q=${encodeURIComponent(term)}`, {
        signal: controller.signal,
        cache: "no-store",
      });
      const data = (await res.json().catch(() => null)) as
        | (SearchResponse & { error?: string })
        | null;
      if (myId !== reqIdRef.current) return; // respons lama, abaikan
      if (res.status === 429) {
        setResults(null);
        setError(data?.error ?? "Terlalu banyak pencarian, coba lagi sebentar");
        setLoading(false);
        return;
      }
      if (!res.ok) {
        setResults(null);
        setError(data?.error ?? "Gagal memuat hasil pencarian.");
        setLoading(false);
        return;
      }
      setResults({ projects: data?.projects ?? [], tasks: data?.tasks ?? [] });
      setActiveIndex(-1);
      setError(null);
      setLoading(false);
    } catch (err) {
      if (err instanceof DOMException && err.name === "AbortError") return;
      if (myId !== reqIdRef.current) return;
      setResults(null);
      setError("Gagal memuat hasil pencarian.");
      setLoading(false);
    }
  }, []);

  // Debounce 300 ms; mulai saat >= 2 karakter; tanpa request saat mount atau
  // tab tersembunyi. Tiap perubahan query membatalkan request sebelumnya.
  // (setState ada di dalam callback timer/async, bukan sinkron di badan effect.)
  useEffect(() => {
    const delay = trimmed.length < 2 ? 0 : DEBOUNCE_MS;
    const timer = window.setTimeout(() => {
      if (document.visibilityState === "hidden") return;
      if (trimmed.length < 2) {
        abortRef.current?.abort();
        setLoading(false);
        setError(null);
        setResults(null);
        setActiveIndex(-1);
        return;
      }
      void runSearch(trimmed);
    }, delay);
    return () => window.clearTimeout(timer);
  }, [trimmed, runSearch]);

  // Hitung posisi panel (di bawah input) + ikut scroll/resize saat terbuka.
  const computePos = useCallback(() => {
    const el = containerRef.current;
    if (!el) return;
    const rect = el.getBoundingClientRect();
    const vw = window.innerWidth;
    if (vw < 640) {
      setPos({ top: 72, left: 12, width: vw - 24 });
      return;
    }
    const width = Math.min(Math.max(rect.width, 420), vw - 24);
    let left = rect.left;
    if (left + width > vw - 12) left = Math.max(12, vw - 12 - width);
    setPos({ top: rect.bottom + 8, left, width });
  }, []);

  useEffect(() => {
    if (!open) return;
    // Ukur posisi panel dari DOM saat terbuka (sinkron dengan layout).
    // eslint-disable-next-line react-hooks/set-state-in-effect
    computePos();
    const handler = () => computePos();
    window.addEventListener("resize", handler);
    window.addEventListener("scroll", handler, true);
    return () => {
      window.removeEventListener("resize", handler);
      window.removeEventListener("scroll", handler, true);
    };
  }, [open, computePos]);

  // Pindah route menutup panel.
  useEffect(() => {
    // eslint-disable-next-line react-hooks/set-state-in-effect
    setOpen(false);
  }, [pathname]);

  // Klik di luar menutup panel.
  useEffect(() => {
    if (!open) return;
    const onPointerDown = (e: PointerEvent) => {
      const target = e.target as Node;
      if (containerRef.current?.contains(target)) return;
      if (panelRef.current?.contains(target)) return;
      setOpen(false);
    };
    document.addEventListener("pointerdown", onPointerDown);
    return () => document.removeEventListener("pointerdown", onPointerDown);
  }, [open]);

  // Ctrl/Cmd+K fokus input dari mana saja (kecuali saat dialog terbuka).
  useEffect(() => {
    const onKey = (e: KeyboardEvent) => {
      if ((e.metaKey || e.ctrlKey) && e.key.toLowerCase() === "k") {
        e.preventDefault();
        if (document.querySelector('[role="dialog"]')) return;
        inputRef.current?.focus();
        inputRef.current?.select();
        setOpen(true);
      }
    };
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, []);

  const go = useCallback(
    (opt: FlatOption) => {
      setOpen(false);
      const target =
        opt.kind === "project" ? opt.id : opt.projectId;
      router.push(`/projects/${target}`);
    },
    [router]
  );

  const retry = useCallback(() => {
    if (trimmed.length >= 2) void runSearch(trimmed);
  }, [trimmed, runSearch]);

  function onInputKeyDown(e: React.KeyboardEvent<HTMLInputElement>) {
    if (e.key === "ArrowDown" || e.key === "ArrowUp") {
      if (flatOptions.length === 0) return;
      e.preventDefault();
      if (!open) setOpen(true);
      setActiveIndex((prev) => {
        const len = flatOptions.length;
        if (e.key === "ArrowDown") return prev >= len - 1 ? 0 : prev + 1;
        return prev <= 0 ? len - 1 : prev - 1;
      });
      return;
    }
    if (e.key === "Enter") {
      if (open && activeIndex >= 0 && activeIndex < flatOptions.length) {
        e.preventDefault();
        go(flatOptions[activeIndex]);
      }
      return;
    }
    if (e.key === "Escape") {
      e.preventDefault();
      if (open) setOpen(false);
      else setQuery("");
      return;
    }
    if (e.key === "Tab") {
      setOpen(false);
    }
  }

  let body: ReactNode;
  if (loading) {
    body = <Skeleton />;
  } else if (error) {
    body = (
      <div className="flex flex-col items-center gap-3 px-4 py-8 text-center">
        <p className="text-sm text-slate-600 dark:text-slate-300">{error}</p>
        <button
          type="button"
          onClick={retry}
          className="rounded-lg bg-blue-600 px-3 py-1.5 text-xs font-semibold text-white transition-colors hover:bg-blue-700 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-blue-500"
        >
          Coba lagi
        </button>
      </div>
    );
  } else if (results) {
    const isEmpty =
      results.projects.length === 0 && results.tasks.length === 0;
    body = isEmpty ? (
      <p className="px-4 py-8 text-center text-sm text-slate-500 dark:text-slate-400">
        Tidak ada hasil untuk &ldquo;{trimmed}&rdquo;
      </p>
    ) : (
      <ResultsList
        results={results}
        query={trimmed}
        activeIndex={activeIndex}
        onHover={setActiveIndex}
        onPick={go}
      />
    );
  } else if (trimmed.length === 1) {
    body = (
      <p className="px-4 py-8 text-center text-sm text-slate-500 dark:text-slate-400">
        Ketik minimal 2 huruf
      </p>
    );
  } else {
    body = (
      <p className="px-4 py-8 text-center text-sm text-slate-500 dark:text-slate-400">
        Ketik untuk mencari project atau task
      </p>
    );
  }

  const activeId =
    open && activeIndex >= 0 && activeIndex < flatOptions.length
      ? optionDomId(flatOptions[activeIndex])
      : undefined;

  return (
    <div ref={containerRef} className="relative w-full">
      <Search
        aria-hidden
        className="pointer-events-none absolute left-3.5 top-1/2 h-4 w-4 -translate-y-1/2 text-slate-400"
      />
      <input
        ref={inputRef}
        type="text"
        role="combobox"
        aria-expanded={open}
        aria-controls="topbar-search-listbox"
        aria-activedescendant={activeId}
        aria-haspopup="listbox"
        aria-autocomplete="list"
        aria-label="Cari task atau project"
        autoComplete="off"
        spellCheck={false}
        placeholder="Cari task atau project..."
        value={query}
        onChange={(e) => {
          const value = e.target.value;
          setQuery(value);
          setOpen(true);
          if (value.trim().length >= 2) setLoading(true);
        }}
        onFocus={() => setOpen(true)}
        onKeyDown={onInputKeyDown}
        className="h-9 w-full rounded-full border border-transparent bg-slate-100 pl-10 pr-14 text-sm text-slate-900 outline-none transition-all placeholder:text-slate-500 focus:border-blue-500/50 focus:bg-white focus:ring-2 focus:ring-blue-500/20 dark:border-white/5 dark:bg-slate-800/80 dark:text-slate-200 dark:placeholder:text-slate-400 dark:focus:bg-slate-800"
      />
      {query.length === 0 && (
        <span
          aria-hidden
          className="pointer-events-none absolute right-3 top-1/2 -translate-y-1/2 select-none rounded border border-slate-300 px-1.5 py-0.5 text-[10px] font-semibold text-slate-500 dark:border-slate-600 dark:text-slate-400"
        >
          {isMac ? "⌘K" : "Ctrl K"}
        </span>
      )}

      {open &&
        createPortal(
          <div
            ref={panelRef}
            id="topbar-search-listbox"
            role="listbox"
            aria-label="Hasil pencarian"
            style={
              pos
                ? { top: pos.top, left: pos.left, width: pos.width }
                : { top: 0, left: -9999, width: 420 }
            }
            className="fixed z-50 max-h-[420px] overflow-y-auto rounded-xl border border-slate-200 bg-white p-1.5 shadow-2xl dark:border-slate-700 dark:bg-slate-900"
          >
            {body}
          </div>,
          document.body
        )}
    </div>
  );
}
function Skeleton() {
  return (
    <div aria-hidden className="space-y-1 py-1">
      {[0, 1, 2, 3].map((i) => (
        <div key={i} className="flex items-center gap-3 rounded-lg px-2.5 py-2">
          <div className="h-8 w-8 shrink-0 animate-pulse rounded-lg bg-slate-200 dark:bg-slate-700" />
          <div className="flex-1 space-y-1.5">
            <div className="h-3 w-1/2 animate-pulse rounded bg-slate-200 dark:bg-slate-700" />
            <div className="h-2.5 w-1/3 animate-pulse rounded bg-slate-200 dark:bg-slate-700" />
          </div>
        </div>
      ))}
    </div>
  );
}

function ResultsList({
  results,
  query,
  activeIndex,
  onHover,
  onPick,
}: {
  results: SearchResponse;
  query: string;
  activeIndex: number;
  onHover: (index: number) => void;
  onPick: (opt: FlatOption) => void;
}) {
  let index = 0;
  return (
    <div className="space-y-2 py-0.5">
      {results.projects.length > 0 && (
        <Section label="Project">
          {results.projects.map((p: SearchProjectResult) => {
            const i = index++;
            const opt: FlatOption = { kind: "project", id: p.id, name: p.name };
            return (
              <OptionRow
                key={p.id}
                opt={opt}
                active={activeIndex === i}
                onHover={() => onHover(i)}
                onPick={onPick}
              >
                <span
                  aria-hidden
                  className={cn(
                    "flex h-8 w-8 shrink-0 items-center justify-center rounded-lg text-xs font-bold text-white",
                    projectAvatarClass(p.id)
                  )}
                >
                  {projectInitial(p.name)}
                </span>
                <span className="min-w-0 flex-1 truncate text-sm font-medium text-slate-900 dark:text-slate-100">
                  {highlight(p.name, query)}
                </span>
                <span className="shrink-0 text-xs text-slate-500 dark:text-slate-400">
                  {p.memberCount} anggota
                </span>
              </OptionRow>
            );
          })}
        </Section>
      )}

      {results.tasks.length > 0 && (
        <Section label="Task">
          {results.tasks.map((t: SearchTaskResult) => {
            const i = index++;
            const opt: FlatOption = {
              kind: "task",
              id: t.id,
              title: t.title,
              projectId: t.project.id,
              projectName: t.project.name,
            };
            return (
              <OptionRow
                key={t.id}
                opt={opt}
                active={activeIndex === i}
                onHover={() => onHover(i)}
                onPick={onPick}
              >
                <span className="min-w-0 flex-1">
                  <span className="block truncate text-sm font-medium text-slate-900 dark:text-slate-100">
                    {highlight(t.title, query)}
                  </span>
                  <span className="mt-0.5 flex items-center gap-1.5 text-xs text-slate-500 dark:text-slate-400">
                    <span className="max-w-[160px] truncate">
                      {t.project.name}
                    </span>
                    <span aria-hidden>&middot;</span>
                    <span>{STATUS_LABEL[t.status]}</span>
                    {t.dueDate && (
                      <>
                        <span aria-hidden>&middot;</span>
                        <span>{formatDayMonthWib(new Date(t.dueDate))}</span>
                      </>
                    )}
                  </span>
                </span>
              </OptionRow>
            );
          })}
        </Section>
      )}
    </div>
  );
}

function Section({ label, children }: { label: string; children: ReactNode }) {
  return (
    <div role="group" aria-label={label}>
      <div className="px-2.5 pb-1 pt-1.5 text-[11px] font-semibold uppercase tracking-wide text-slate-400 dark:text-slate-500">
        {label}
      </div>
      <div className="space-y-0.5">{children}</div>
    </div>
  );
}

function OptionRow({
  opt,
  active,
  onHover,
  onPick,
  children,
}: {
  opt: FlatOption;
  active: boolean;
  onHover: () => void;
  onPick: (opt: FlatOption) => void;
  children: ReactNode;
}) {
  return (
    <div
      id={optionDomId(opt)}
      role="option"
      aria-selected={active}
      onMouseEnter={onHover}
      onMouseDown={(e) => e.preventDefault()}
      onClick={() => onPick(opt)}
      className={cn(
        "flex cursor-pointer items-center gap-3 rounded-lg px-2.5 py-2",
        active
          ? "bg-blue-50 dark:bg-slate-800"
          : "hover:bg-slate-100 dark:hover:bg-slate-800/60"
      )}
    >
      {children}
    </div>
  );
}



