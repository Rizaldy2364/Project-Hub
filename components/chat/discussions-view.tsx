"use client";

import { useCallback, useEffect, useState } from "react";
import { usePathname, useRouter, useSearchParams } from "next/navigation";
import { cn } from "@/lib/utils";
import { ConversationList } from "@/components/chat/conversation-list";
import { ChatPanel } from "@/components/chat/chat-panel";
import type { DiscussionSummaryItem } from "@/types";

interface DiscussionsViewProps {
  initialItems: DiscussionSummaryItem[];
  initialSelectedId: string | null;
  initialHighlightMessageId: string | null;
  currentUserId: string;
}

/**
 * Halaman /diskusi: dua pane di dalam satu kartu tinggi tetap (daftar 340px +
 * ChatPanel). Polling ringkasan 15 detik hanya saat tab terlihat. Di bawah
 * lg menampilkan daftar ATAU chat (state ?project= menentukan).
 */
export function DiscussionsView({
  initialItems,
  initialSelectedId,
  initialHighlightMessageId,
  currentUserId,
}: DiscussionsViewProps) {
  const router = useRouter();
  const pathname = usePathname();
  const searchParams = useSearchParams();

  const [items, setItems] = useState<DiscussionSummaryItem[]>(initialItems);
  const [selectedId, setSelectedId] = useState<string | null>(
    initialSelectedId
  );
  const [filter, setFilter] = useState<"all" | "unread">("all");
  const [query, setQuery] = useState("");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  /** Highlight dari Inbox (?message=) — dihapus setelah dipakai/pindah chat. */
  const [highlightMessageId, setHighlightMessageId] = useState<string | null>(
    initialHighlightMessageId
  );
  /** Di mobile: chat terbuka menyembunyikan daftar. */
  const [mobileChatOpen, setMobileChatOpen] = useState(
    initialSelectedId !== null
  );

  // ===== Polling ringkasan 15 detik — hanya saat tab terlihat =====
  const refreshSummary = useCallback(async (signal?: AbortSignal) => {
    try {
      const res = await fetch("/api/discussions/summary", {
        cache: "no-store",
        signal,
      });
      if (!res.ok) throw new Error("gagal");
      const data: { items: DiscussionSummaryItem[] } = await res.json();
      setItems(data.items);
      setError(null);
    } catch (err) {
      // AbortError terjadi saat komponen unmount — bukan error sebenarnya.
      if (err instanceof DOMException && err.name === "AbortError") return;
      console.error("[diskusi] gagal memuat ringkasan:", err);
      // Jangan tampilkan error keras saat polling — hanya saat load awal/retry.
      setError((prev) => prev ?? "Gagal memuat daftar percakapan. Coba lagi.");
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    const controller = new AbortController();
    let timer: number | null = null;
    let cancelled = false;

    const tick = async () => {
      if (cancelled) return;
      if (document.visibilityState === "visible") {
        await refreshSummary(controller.signal);
      }
      if (!cancelled) timer = window.setTimeout(tick, 15_000);
    };
    timer = window.setTimeout(tick, 15_000);

    const onVisibility = () => {
      if (document.visibilityState === "visible" && !cancelled) {
        void refreshSummary(controller.signal);
      }
    };
    document.addEventListener("visibilitychange", onVisibility);
    return () => {
      cancelled = true;
      controller.abort();
      if (timer !== null) window.clearTimeout(timer);
      document.removeEventListener("visibilitychange", onVisibility);
    };
  }, [refreshSummary]);

  // ===== Pilih percakapan -> URL ?project= =====
  const selectProject = useCallback(
    (projectId: string) => {
      setSelectedId(projectId);
      setMobileChatOpen(true);
      setHighlightMessageId(null); // highlight hanya untuk chat awal dari Inbox
      const params = new URLSearchParams(searchParams.toString());
      params.set("project", projectId);
      params.delete("message"); // highlight sekali pakai dari Inbox
      router.replace(`${pathname}?${params.toString()}`, { scroll: false });
    },
    [router, pathname, searchParams]
  );

  // Optimistic: kosongkan badge saat chat dibuka.
  const handleUnreadCleared = useCallback((projectId: string) => {
    setItems((prev) =>
      prev.map((item) =>
        item.projectId === projectId ? { ...item, unreadCount: 0 } : item
      )
    );
  }, []);

  return (
    <div className="flex h-full w-full overflow-hidden rounded-2xl border border-slate-200 bg-white shadow-sm dark:border-white/[0.08] dark:bg-slate-900">
      {/* Pane kiri: daftar percakapan */}
      <aside
        aria-label="Daftar percakapan"
        className={cn(
          "w-full shrink-0 flex-col border-r border-slate-200 dark:border-white/[0.08] lg:flex lg:w-[340px]",
          mobileChatOpen ? "hidden" : "flex"
        )}
      >
        <ConversationList
          items={items}
          selectedId={selectedId}
          filter={filter}
          query={query}
          loading={loading}
          error={error}
          onFilterChange={setFilter}
          onQueryChange={setQuery}
          onSelect={selectProject}
          onRetry={() => {
            setLoading(true);
            setError(null);
            void refreshSummary();
          }}
        />
      </aside>

      {/* Pane kanan: ChatPanel — flex-1 + min-w-0 agar tepi kanannya menyentuh
          tepi kanan kartu (tanpa area kosong). */}
      <div
        className={cn(
          "min-w-0 flex-1 lg:flex",
          mobileChatOpen ? "flex" : "hidden"
        )}
      >
        {selectedId ? (
          <ChatPanel
            key={selectedId}
            projectId={selectedId}
            currentUserId={currentUserId}
            highlightMessageId={highlightMessageId}
            onUnreadCleared={handleUnreadCleared}
            onBack={() => setMobileChatOpen(false)}
            className="h-full min-w-0 flex-1 rounded-none border-0"
          />
        ) : (
          <div className="flex h-full w-full flex-col items-center justify-center gap-2 p-6 text-center">
            <p className="text-sm font-medium text-slate-700 dark:text-slate-200">
              {items.length === 0
                ? "Kamu belum punya project"
                : "Pilih percakapan untuk mulai berdiskusi"}
            </p>
            <p className="text-xs text-slate-500 dark:text-[#8B96AD]">
              Diskusi berlaku khusus anggota project.
            </p>
          </div>
        )}
      </div>
    </div>
  );
}
