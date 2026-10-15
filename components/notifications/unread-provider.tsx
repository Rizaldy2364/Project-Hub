"use client";

import { createContext, useCallback, useContext, useEffect, useState } from "react";

/**
 * Satu sumber kebenaran untuk angka notifikasi belum dibaca di top bar.
 *
 * - Polling `GET /api/notifications/unread-count` setiap 30 s, **hanya** saat
 *   `document.visibilityState === "visible"`.
 * - Refetch langsung bila tab menjadi visible / window mendapatkan focus.
 * - Berhenti saat unmount.
 *
 * Expose: `count` + `setCount` + `refresh`.
 */
export interface UnreadCountState {
  count: number;
  loading: boolean;
  error: string | null;
  setCount: (n: number) => void;
  refresh: () => Promise<void>;
}

const POLL_MS = 30_000;

/** Payload endpoint: `{ count: number }`. */
async function fetchUnreadCount(): Promise<{ count: number }> {
  const res = await fetch("/api/notifications/unread-count", { cache: "no-store" });
  if (!res.ok) {
    const body = (await res.json().catch(() => null)) as { error?: string };
    throw new Error(body?.error ?? "Gagal memuat jumlah notifikasi.");
  }
  return res.json();
}

export function UnreadCountProvider({
  children,
}: {
  children: React.ReactNode;
}) {
  const [state, setState] = useState<UnreadCountState>({
    count: 0,
    loading: true,
    error: null,
    setCount: () => undefined,
    refresh: async () => {},
  });

  const refresh = useCallback(async () => {
    setState((prev) => ({ ...prev, loading: true, error: null }));
    try {
      const data = await fetchUnreadCount();
      setState((prev) => ({ ...prev, count: data.count, loading: false }));
    } catch (err) {
      setState((prev) => ({
        ...prev,
        error: err instanceof Error ? err.message : "Gagal memuat.",
        loading: false,
      }));
    }
  }, []);

  const setCount = useCallback((n: number) => {
    setState((prev) => ({ ...prev, count: n, error: null }));
  }, []);

  // Poling awal + interval (hanya saat tab terlihat), plus refetch saat visible/focus.
  useEffect(() => {
    const run = async () => {
      if (document.visibilityState === "visible") {
        try {
          const data = await fetchUnreadCount();
          setState({
            count: data.count,
            loading: false,
            error: null,
            setCount,
            refresh,
          });
          return;
        } catch (err) {
          const message =
            err instanceof Error ? err.message : "Gagal memuat jumlah notifikasi.";
          setState({
            count: 0,
            loading: false,
            error: message,
            setCount,
            refresh,
          });
        }
      }
    };
    run();

    let timer: number | undefined;

    const tick = async () => {
      if (document.visibilityState === "visible") {
        await refresh();
      }
      if (document.visibilityState === "visible") {
        timer = window.setTimeout(tick, POLL_MS);
      }
    };

    const onVisibility = () => {
      if (document.visibilityState === "visible") {
        void refresh();
      }
    };

    const onFocus = () => {
      if (document.visibilityState === "visible") {
        void refresh();
      }
    };

    timer = window.setTimeout(tick, POLL_MS);
    document.addEventListener("visibilitychange", onVisibility);
    window.addEventListener("focus", onFocus);

    return () => {
      if (timer !== undefined) window.clearTimeout(timer);
      document.removeEventListener("visibilitychange", onVisibility);
      window.removeEventListener("focus", onFocus);
    };
  }, [refresh, setCount]);

  const value = {
    count: state.count,
    loading: state.loading,
    error: state.error,
    setCount,
    refresh,
  };

  return (
    <UnreadCountContext.Provider value={value}>
      {children}
    </UnreadCountContext.Provider>
  );
}

const UnreadCountContext = createContext<UnreadCountState | null>(null);

export function useUnreadCount(): UnreadCountState {
  const ctx = useContext(UnreadCountContext);
  if (!ctx) throw new Error("useUnreadCount harus dipakai di dalam UnreadCountProvider");
  return ctx;
}
