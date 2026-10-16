"use client";

import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import { ArrowDown, ArrowLeft, Loader2, Pin } from "lucide-react";
import { cn, wibDayKey } from "@/lib/utils";
import {
  dayChipLabel,
  daySeparatorFullLabel,
  formatChatTime,
  projectAvatarClass,
  projectInitial,
} from "@/components/chat/chat-utils";
import { MessageBubble } from "@/components/chat/message-bubble";
import { Composer } from "@/components/chat/composer";
import {
  deleteMessageAction,
  markChatReadAction,
  pinMessageAction,
  sendMessageAction,
  unpinMessageAction,
} from "@/actions/message.actions";
import { canDeleteChatMessage, canPinChatMessage } from "@/lib/permissions";
import type { ChatMember, ChatMessage, ProjectRole } from "@/types";

interface InitialPayload {
  messages: ChatMessage[];
  hasMoreBefore: boolean;
  pinned: ChatMessage | null;
  othersMinLastReadAt: string | null;
  readAnchor: string | null;
  members: ChatMember[];
  myRole: ProjectRole;
  projectName: string;
}

interface ChatPanelProps {
  projectId: string;
  currentUserId: string;
  /** Dari ?message= (Inbox) — scroll ke pesan + sorot sebentar. */
  highlightMessageId?: string | null;
  /** Optimistic: kosongkan badge daftar percakapan saat chat dibuka. */
  onUnreadCleared?: (projectId: string) => void;
  /** Tombol kembali (mobile) di header. */
  onBack?: () => void;
  className?: string;
}

const UNREAD_DIVIDER_ID = "chat-unread-divider";

/**
 * Panel chat satu project: header + strip tersemat + daftar pesan (scroll
 * sendiri) + komposer. Polling 5 detik hanya saat tab terlihat; berhenti saat
 * unmount. Semua data lewat GET route yang memeriksa keanggotaan di server.
 */
export function ChatPanel({
  projectId,
  currentUserId,
  highlightMessageId = null,
  onUnreadCleared,
  onBack,
  className,
}: ChatPanelProps) {
  const [messages, setMessages] = useState<ChatMessage[]>([]);
  const [members, setMembers] = useState<ChatMember[]>([]);
  // Tick 1 menit: label separator tanggal ("Hari ini"→"Kemarin") dievaluasi
  // ulang setelah lewat tengah malam tanpa reload.
  const [, setNowTick] = useState(0);
  const [pinned, setPinned] = useState<ChatMessage | null>(null);
  const [othersMinLastReadAt, setOthersMinLastReadAt] = useState<string | null>(
    null
  );
  const [readAnchor, setReadAnchor] = useState<string | null>(null);
  const [hasMoreBefore, setHasMoreBefore] = useState(false);
  const [myRole, setMyRole] = useState<ProjectRole | null>(null);
  const [projectName, setProjectName] = useState("");
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [sendError, setSendError] = useState<string | null>(null);
  const [sending, setSending] = useState(false);
  const [replyTo, setReplyTo] = useState<ChatMessage | null>(null);
  const [newMessagesAvailable, setNewMessagesAvailable] = useState(false);
  const [loadingOlder, setLoadingOlder] = useState(false);
  const [highlightId, setHighlightId] = useState<string | null>(
    highlightMessageId
  );

  const scrollRef = useRef<HTMLDivElement>(null);
  const lastIdRef = useRef<string | null>(null);
  const atBottomRef = useRef(true);
  const loadingOlderRef = useRef(false);
  /** scrollHeight sebelum prepend — dipakai memulihkan posisi scroll. */
  const restoreScrollRef = useRef<number | null>(null);
  const markedReadRef = useRef(false);

  const myId = currentUserId;

  // Evaluasi ulang label tanggal tiap 1 menit (rollover tengah malam:
  // "Hari ini" menjadi "Kemarin" tanpa reload).
  useEffect(() => {
    const timer = window.setInterval(() => setNowTick((n) => n + 1), 60_000);
    return () => window.clearInterval(timer);
  }, []);

  // ===== Muat halaman terbaru =====
  // Catatan: `setLoading(true)` TIDAK dipanggil di sini agar tidak ada
  // setState sinkron dari dalam effect (reaksi lint React). Loading awal
  // sudah `true`; retry mengatur ulang state lewat event handler.
  const loadInitial = useCallback(async () => {
    try {
      const res = await fetch(`/api/projects/${projectId}/messages`, {
        cache: "no-store",
      });
      if (!res.ok) throw new Error(await res.text());
      const data: InitialPayload = await res.json();
      setMessages(data.messages);
      setMembers(data.members);
      setPinned(data.pinned);
      setOthersMinLastReadAt(data.othersMinLastReadAt);
      setReadAnchor(data.readAnchor);
      setHasMoreBefore(data.hasMoreBefore);
      setMyRole(data.myRole);
      setProjectName(data.projectName);
      lastIdRef.current = data.messages[data.messages.length - 1]?.id ?? null;
      markedReadRef.current = false;
      setError(null);
      return data;
    } catch (err) {
      console.error("[chat] gagal memuat pesan:", err);
      setError("Gagal memuat pesan. Coba lagi.");
      return null;
    } finally {
      setLoading(false);
    }
  }, [projectId]);

  useEffect(() => {
    // Pola fetch di effect memang memanggil setState; ini disengaja untuk
    // sinkron dengan server (sama seperti team-view).
    // eslint-disable-next-line react-hooks/set-state-in-effect
    void loadInitial();
  }, [loadInitial]);

  // ===== Gulir: posisi awal (highlight / divider unread / bawah) =====
  const scrollToBottom = useCallback((behavior: ScrollBehavior = "auto") => {
    const el = scrollRef.current;
    if (!el) return;
    el.scrollTo({ top: el.scrollHeight, behavior });
  }, []);

  const scrollToMessage = useCallback((id: string) => {
    const el = scrollRef.current;
    if (!el) return;
    const target = el.querySelector<HTMLElement>(`[data-message-id="${id}"]`);
    target?.scrollIntoView({ block: "center", behavior: "auto" });
  }, []);

  useEffect(() => {
    if (loading || messages.length === 0) return;
    if (highlightId) {
      if (messages.some((m) => m.id === highlightId)) {
        scrollToMessage(highlightId);
        const timer = window.setTimeout(() => setHighlightId(null), 2400);
        return () => window.clearTimeout(timer);
      }
      // Pesan tujuan lebih tua dari halaman terbaru — muat beberapa halaman.
      void (async () => {
        for (let attempt = 0; attempt < 5; attempt++) {
          const current = messages[0];
          if (!current || !hasMoreBefore) break;
          const res = await fetch(
            `/api/projects/${projectId}/messages?before=${current.id}`,
            { cache: "no-store" }
          );
          if (!res.ok) break;
          const data: { messages: ChatMessage[]; hasMoreBefore: boolean } =
            await res.json();
          setHasMoreBefore(data.hasMoreBefore);
          if (data.messages.some((m) => m.id === highlightId)) {
            setMessages((prev) => [...data.messages, ...prev]);
            requestAnimationFrame(() => scrollToMessage(highlightId));
            window.setTimeout(() => setHighlightId(null), 2400);
            return;
          }
          setMessages((prev) => [...data.messages, ...prev]);
          if (!data.hasMoreBefore) break;
        }
        // Tidak ketemu (sangat lama) — fallback ke bawah.
        setHighlightId(null);
        scrollToBottom();
      })();
      return;
    }
    // Divider "Pesan belum dibaca": pesan pertama orang lain setelah anchor.
    const firstUnread = messages.find(
      (m) =>
        m.kind === "USER" &&
        m.author.id !== myId &&
        (!readAnchor || new Date(m.createdAt) > new Date(readAnchor))
    );
    if (firstUnread) {
      const el = scrollRef.current;
      const target = el?.querySelector<HTMLElement>(
        `[data-message-id="${firstUnread.id}"]`
      );
      if (el && target) {
        el.scrollTop = target.offsetTop - el.clientHeight / 2;
        return;
      }
    }
    scrollToBottom();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [loading]);

  // ===== Tandai dibaca (chat terbuka + tab terlihat / pesan baru masuk) =====
  const markRead = useCallback(() => {
    if (markedReadRef.current) return;
    markedReadRef.current = true;
    onUnreadCleared?.(projectId);
    void markChatReadAction({ projectId }).catch((err) =>
      console.error("[chat] gagal menandai dibaca:", err)
    );
  }, [projectId, onUnreadCleared]);

  useEffect(() => {
    if (loading) return;
    if (document.visibilityState !== "visible") return;
    markRead();
  }, [loading, markRead]);

  // ===== Polling 5 detik — hanya saat tab terlihat; berhenti saat unmount =====
  const pollMessages = useCallback(async () => {
    const afterId = lastIdRef.current;
    if (!afterId) return; // chat kosong — tidak ada yang bisa di-poll
    try {
      const res = await fetch(
        `/api/projects/${projectId}/messages?after=${afterId}`,
        { cache: "no-store" }
      );
      if (!res.ok) return;
      const data: {
        messages: ChatMessage[];
        othersMinLastReadAt: string | null;
      } = await res.json();
      setOthersMinLastReadAt(data.othersMinLastReadAt);
      if (data.messages.length === 0) return;
      const wasAtBottom = atBottomRef.current;
      setMessages((prev) => {
        const known = new Set(prev.map((m) => m.id));
        const incoming = data.messages.filter((m) => !known.has(m.id));
        if (incoming.length === 0) return prev;
        lastIdRef.current = incoming[incoming.length - 1].id;
        if (wasAtBottom) {
          requestAnimationFrame(() => scrollToBottom());
        } else {
          setNewMessagesAvailable(true);
        }
        return [...prev, ...incoming];
      });
      // Pesan orang lain masuk saat tab terlihat = sudah dibaca.
      if (data.messages.some((m) => m.author.id !== myId)) {
        markedReadRef.current = false;
        markRead();
      }
    } catch (err) {
      console.error("[chat] polling gagal:", err);
    }
  }, [projectId, scrollToBottom, myId, markRead]);

  useEffect(() => {
    let timer: number | null = null;
    let cancelled = false;

    const tick = async () => {
      if (cancelled) return;
      if (document.visibilityState === "visible") {
        await pollMessages();
      }
      if (!cancelled) timer = window.setTimeout(tick, 5000);
    };
    timer = window.setTimeout(tick, 5000);

    // Tab terlihat lagi: langsung fetch sekali (tanpa menunggu interval).
    const onVisibility = () => {
      if (document.visibilityState === "visible" && !cancelled) {
        void pollMessages();
      }
    };
    document.addEventListener("visibilitychange", onVisibility);
    return () => {
      cancelled = true;
      if (timer !== null) window.clearTimeout(timer);
      document.removeEventListener("visibilitychange", onVisibility);
    };
  }, [pollMessages]);

  // ===== Kirim pesan (optimistic + retry saat gagal) =====
  const sendChatMessage = useCallback(
    async (content: string, retryReplyTo?: ChatMessage["replyTo"]) => {
      if (sending) return;
      setSending(true);
      setSendError(null);

      const me = members.find((m) => m.id === myId);
      // Balasan dipakai dari argumen retry, atau dari state composer.
      const replySource = replyTo
        ? {
            id: replyTo.id,
            content: replyTo.content,
            deleted: replyTo.deleted,
            authorName: replyTo.author.name,
            createdAt: replyTo.createdAt,
          }
        : (retryReplyTo ?? null);
      const tempId = `temp-${Date.now()}`;
      const optimistic: ChatMessage = {
        id: tempId,
        kind: "USER",
        content,
        pinned: false,
        createdAt: new Date().toISOString(),
        deleted: false,
        author: {
          id: myId,
          name: me?.name ?? "Kamu",
          avatarUrl: me?.avatarUrl ?? null,
          role: myRole ?? "MEMBER",
        },
        replyTo: replySource,
        pending: true,
      };
      setMessages((prev) => [...prev, optimistic]);
      setReplyTo(null);
      requestAnimationFrame(() => scrollToBottom("smooth"));

      const res = await sendMessageAction({
        projectId,
        content,
        ...(replySource ? { replyToId: replySource.id } : {}),
      });
      setSending(false);

      if ("error" in res) {
        const message =
          typeof res.error === "string"
            ? res.error
            : "Gagal terkirim. Coba lagi.";
        setMessages((prev) =>
          prev.map((m) =>
            m.id === tempId ? { ...m, pending: false, failed: true } : m
          )
        );
        setSendError(message);
        return;
      }

      setMessages((prev) =>
        prev.map((m) => (m.id === tempId ? res.message : m))
      );
      lastIdRef.current = res.message.id;
    },
    [sending, myId, myRole, members, replyTo, projectId, scrollToBottom]
  );

  /** Coba kirim ulang pesan yang gagal (konten sudah ber-token; balasan ikut). */
  async function retryMessage(message: ChatMessage) {
    // Gagal → keluarkan bubble gagal, kirim ulang konten SAMA (composer tidak
    // disentuh, teks tidak hilang).
    setMessages((prev) => prev.filter((m) => m.id !== message.id));
    await sendChatMessage(message.content, message.replyTo ?? undefined);
  }

  /** Buang bubble gagal dari daftar (tanpa dialog pemblokir). */
  function discardFailedMessage(message: ChatMessage) {
    setMessages((prev) => prev.filter((m) => m.id !== message.id));
  }

  // ===== Muat pesan lebih tua saat scroll ke atas (tanpa lompatan) =====
  const loadOlder = useCallback(async () => {
    if (loadingOlderRef.current || !hasMoreBefore) return;
    const first = messages[0];
    if (!first || first.pending || first.failed) return;
    loadingOlderRef.current = true;
    setLoadingOlder(true);
    const el = scrollRef.current;
    restoreScrollRef.current = el?.scrollHeight ?? null;
    try {
      const res = await fetch(
        `/api/projects/${projectId}/messages?before=${first.id}`,
        { cache: "no-store" }
      );
      if (!res.ok) throw new Error("gagal memuat pesan lama");
      const data: { messages: ChatMessage[]; hasMoreBefore: boolean } =
        await res.json();
      setHasMoreBefore(data.hasMoreBefore);
      setMessages((prev) => {
        const known = new Set(data.messages.map((m) => m.id));
        return [...data.messages, ...prev.filter((m) => !known.has(m.id))];
      });
    } catch (err) {
      console.error("[chat] gagal memuat pesan lama:", err);
      restoreScrollRef.current = null;
    } finally {
      loadingOlderRef.current = false;
      setLoadingOlder(false);
    }
  }, [hasMoreBefore, messages, projectId]);

  // Pulihkan posisi scroll setelah prepend (useLayoutEffect via ref value).
  useEffect(() => {
    const el = scrollRef.current;
    const prevHeight = restoreScrollRef.current;
    if (!el || prevHeight === null) return;
    restoreScrollRef.current = null;
    el.scrollTop = el.scrollHeight - prevHeight;
  }, [messages]);

  function handleScroll() {
    const el = scrollRef.current;
    if (!el) return;
    const distanceFromBottom = el.scrollHeight - el.scrollTop - el.clientHeight;
    const wasAtBottom = atBottomRef.current;
    atBottomRef.current = distanceFromBottom < 60;
    if (atBottomRef.current && !wasAtBottom) {
      setNewMessagesAvailable(false);
    }
    if (el.scrollTop < 80 && hasMoreBefore) {
      void loadOlder();
    }
  }

  // ===== Aksi pesan =====
  async function handlePinToggle(message: ChatMessage) {
    const action = message.pinned ? unpinMessageAction : pinMessageAction;
    const res = await action({ projectId, messageId: message.id });
    if ("error" in res) {
      setSendError(
        typeof res.error === "string" ? res.error : "Gagal mengubah sematan."
      );
      return;
    }
    if (message.pinned) {
      setPinned(null);
      setMessages((prev) =>
        prev.map((m) => (m.id === message.id ? { ...m, pinned: false } : m))
      );
    } else {
      setPinned({ ...message, pinned: true });
      setMessages((prev) =>
        prev.map((m) =>
          m.id === message.id
            ? { ...m, pinned: true }
            : m.pinned
              ? { ...m, pinned: false }
              : m
        )
      );
    }
  }

  async function handleDelete(message: ChatMessage) {
    const res = await deleteMessageAction({ projectId, messageId: message.id });
    if ("error" in res) {
      setSendError(
        typeof res.error === "string" ? res.error : "Gagal menghapus pesan."
      );
      return;
    }
    setMessages((prev) =>
      prev.map((m) =>
        m.id === message.id
          ? { ...m, deleted: true, pinned: false, content: "" }
          : m
      )
    );
    if (pinned?.id === message.id) setPinned(null);
  }

  // ===== Kelompokkan pesan: nama tampil hanya di pesan pertama grup =====
  const grouped = useMemo(() => {
    const readCutoff = readAnchor ? new Date(readAnchor) : null;
    const isUnread = (m: ChatMessage) =>
      m.kind === "USER" &&
      m.author.id !== myId &&
      (!readCutoff || new Date(m.createdAt) > readCutoff);

    return messages.map((message, index) => {
      const prev = messages[index - 1];
      const showHeader =
        !prev ||
        prev.author.id !== message.author.id ||
        prev.kind !== message.kind ||
        new Date(message.createdAt).getTime() -
          new Date(prev.createdAt).getTime() >
          5 * 60_000;
      const showDayChip =
        prev !== undefined && wibDayKey(prev.createdAt) !== wibDayKey(message.createdAt);
      // Divider "Pesan belum dibaca" sebelum pesan pertama yang belum dibaca.
      const isUnreadBoundary = isUnread(message) && !(prev && isUnread(prev));
      return { message, showHeader, showDayChip, isUnreadBoundary };
    });
  }, [messages, myId, readAnchor]);

  const canPin = myRole ? canPinChatMessage(myRole) : false;

  // ===== Render =====
  if (loading) {
    return (
      <div
        className={cn(
          "flex h-full flex-col overflow-hidden rounded-2xl border border-slate-200 bg-slate-50 dark:border-white/[0.08] dark:bg-[#0D1220]",
          className
        )}
      >
        <div className="flex items-center gap-3 border-b border-slate-200 bg-white p-4 dark:border-white/[0.08] dark:bg-[#131A2B]">
          <div className="h-9 w-9 animate-pulse rounded-lg bg-slate-200 dark:bg-[#1B2438]" />
          <div className="space-y-1.5">
            <div className="h-3.5 w-32 animate-pulse rounded bg-slate-200 dark:bg-[#1B2438]" />
            <div className="h-2.5 w-48 animate-pulse rounded bg-slate-200 dark:bg-[#1B2438]" />
          </div>
        </div>
        <div className="flex flex-1 flex-col justify-end gap-3 p-4">
          <div className="h-10 w-2/3 animate-pulse rounded-2xl bg-slate-200 dark:bg-[#1B2438]" />
          <div className="ml-auto h-10 w-1/2 animate-pulse rounded-2xl bg-slate-200 dark:bg-[#1B2438]" />
          <div className="h-10 w-3/5 animate-pulse rounded-2xl bg-slate-200 dark:bg-[#1B2438]" />
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div
        className={cn(
          "flex h-full flex-col items-center justify-center gap-3 rounded-2xl border border-slate-200 bg-white p-6 text-center dark:border-white/[0.08] dark:bg-[#0D1220]",
          className
        )}
      >
        <p className="text-sm text-slate-500 dark:text-[#8B96AD]">{error}</p>
        <button
          type="button"
          onClick={() => {
            setLoading(true);
            void loadInitial();
          }}
          className="rounded-xl bg-blue-600 px-4 py-2 text-sm font-semibold text-white transition-colors hover:bg-blue-700 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-blue-500"
        >
          Coba lagi
        </button>
      </div>
    );
  }

  return (
    <div
      className={cn(
        "relative flex h-full min-w-0 flex-col overflow-hidden rounded-2xl border border-slate-200 bg-slate-50 dark:border-white/[0.08]",
        // Latar titik-titik halus via radial-gradient (tanpa gambar).
        "bg-[length:18px_18px] bg-[radial-gradient(rgba(15,23,42,0.05)_1px,transparent_1px)] dark:bg-[#0D1220] dark:bg-[radial-gradient(rgba(255,255,255,0.04)_1px,transparent_1px)]",
        className
      )}
    >
      {/* Header */}
      <div className="flex items-center gap-3 border-b border-slate-200 bg-white px-4 py-3 dark:border-white/[0.08] dark:bg-[#131A2B]">
        {onBack && (
          <button
            type="button"
            onClick={onBack}
            aria-label="Kembali ke daftar percakapan"
            className="flex h-8 w-8 items-center justify-center rounded-lg text-slate-500 transition-colors hover:bg-slate-100 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-blue-500 dark:text-[#8B96AD] dark:hover:bg-[#1B2438] lg:hidden"
          >
            <ArrowLeft className="h-4 w-4" />
          </button>
        )}
        <span
          aria-hidden
          className={cn(
            "flex h-10 w-10 shrink-0 items-center justify-center rounded-lg text-sm font-bold text-white",
            projectAvatarClass(projectId)
          )}
        >
          {projectInitial(projectName || "?")}
        </span>
        <div className="min-w-0 flex-1">
          <p className="truncate text-sm font-semibold text-slate-900 dark:text-[#E6EAF2]">
            {projectName}
          </p>
          <p className="truncate text-xs text-slate-500 dark:text-[#8B96AD]">
            {members.length} anggota
          </p>
        </div>
      </div>

      {/* Strip pesan tersemat */}
      {pinned && (
        <button
          type="button"
          onClick={() => scrollToMessage(pinned.id)}
          className="flex w-full items-center gap-2 border-b border-slate-200 bg-white/70 px-4 py-2 text-left transition-colors hover:bg-white focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-blue-500 dark:border-white/[0.08] dark:bg-[#131A2B]/70 dark:hover:bg-[#131A2B]"
        >
          <Pin className="h-3.5 w-3.5 shrink-0 text-blue-600 dark:text-[#8FAAFF]" />
          <span className="min-w-0 flex-1">
            <span className="block text-[11px] font-bold tracking-wider text-slate-400 dark:text-[#8B96AD]">
              PESAN TERSEMAT
            </span>
            <span className="block truncate text-xs text-slate-700 dark:text-slate-200">
              {pinned.deleted
                ? "Pesan ini dihapus"
                : `${pinned.author.name}: ${pinned.content}`}
            </span>
          </span>
        </button>
      )}

      {/* Area pesan */}
      <div
        ref={scrollRef}
        onScroll={handleScroll}
        role="log"
        aria-live="polite"
        aria-label={`Pesan diskusi ${projectName}`}
        className="relative flex flex-1 flex-col overflow-y-auto px-4 py-3"
      >
        <p className="mb-3 shrink-0 text-center text-[11px] italic text-slate-400 dark:text-[#8B96AD]">
          Percakapan ini khusus anggota project {projectName || "ini"}.
        </p>

        {loadingOlder && (
          <p className="mb-2 flex shrink-0 items-center justify-center gap-2 text-[11px] text-slate-400 dark:text-[#8B96AD]">
            <Loader2 className="h-3 w-3 animate-spin" aria-hidden /> Memuat
            pesan lama...
          </p>
        )}

        {messages.length === 0 && (
          <div className="flex min-h-[240px] flex-1 items-center justify-center py-10">
            <p className="text-sm text-slate-500 dark:text-[#8B96AD]">
              Belum ada pesan. Jadilah yang pertama menyapa!
            </p>
          </div>
        )}

        <div className="shrink-0 space-y-1.5">
          {grouped.map(
            ({ message, showHeader, showDayChip, isUnreadBoundary }) => (
              <div key={message.id}>
                {showDayChip && (
                  <div className="flex justify-center pb-2 pt-3.5">
                    <span
                      role="separator"
                      aria-label={`Pesan tanggal ${daySeparatorFullLabel(message.createdAt)}`}
                      className="rounded-full bg-slate-200 px-3 py-1 text-xs font-semibold text-slate-500 dark:bg-[#1B2438] dark:text-[#8B96AD]"
                    >
                      {dayChipLabel(message.createdAt)}
                    </span>
                  </div>
                )}
                {isUnreadBoundary && (
                  <div
                    id={UNREAD_DIVIDER_ID}
                    className="my-3 flex items-center gap-3"
                  >
                    <span className="h-px flex-1 bg-blue-500/40" />
                    <span className="text-[10px] font-bold tracking-wider text-blue-600 dark:text-[#8FAAFF]">
                      PESAN BELUM DIBACA
                    </span>
                    <span className="h-px flex-1 bg-blue-500/40" />
                  </div>
                )}
                {message.kind === "SYSTEM" ? (
                  <div
                    data-message-id={message.id}
                    className="flex justify-center py-1"
                  >
                    <span className="rounded-full bg-slate-200 px-3 py-1 text-[11px] text-slate-500 dark:bg-[#131A2B] dark:text-[#8B96AD]">
                      {formatChatTime(message.createdAt)} · {message.content}
                    </span>
                  </div>
                ) : message.pending || message.failed ? (
                  <MessageBubble
                    message={message}
                    own
                    showHeader={false}
                    readByOthers={false}
                    canPin={false}
                    canDelete={false}
                    members={members}
                    highlighted={highlightId === message.id}
                    onReply={setReplyTo}
                    onPinToggle={(m) => void handlePinToggle(m)}
                    onDelete={(m) => void handleDelete(m)}
                    onRetry={(m) => void retryMessage(m)}
                    onDiscard={discardFailedMessage}
                  />
                ) : (
                  <MessageBubble
                    message={message}
                    own={message.author.id === myId}
                    showHeader={showHeader}
                    readByOthers={
                      othersMinLastReadAt !== null &&
                      new Date(message.createdAt) <=
                        new Date(othersMinLastReadAt)
                    }
                    canPin={canPin}
                    canDelete={canDeleteChatMessage(
                      myRole ?? "MEMBER",
                      message.author.id === myId
                    )}
                    members={members}
                    highlighted={highlightId === message.id}
                    onReply={setReplyTo}
                    onPinToggle={(m) => void handlePinToggle(m)}
                    onDelete={(m) => void handleDelete(m)}
                    onRetry={(m) => void retryMessage(m)}
                    onDiscard={discardFailedMessage}
                  />
                )}
              </div>
            )
          )}
        </div>
      </div>

      {/* Tombol "Pesan baru" melayang */}
      {newMessagesAvailable && (
        <button
          type="button"
          onClick={() => {
            setNewMessagesAvailable(false);
            scrollToBottom("smooth");
          }}
          className="absolute bottom-24 left-1/2 z-10 -translate-x-1/2 rounded-full bg-[#3B66EE] px-3 py-1.5 text-xs font-semibold text-white shadow-lg transition-colors hover:bg-blue-700 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-blue-500"
        >
          <span className="inline-flex items-center gap-1">
            <ArrowDown className="h-3.5 w-3.5" aria-hidden /> Pesan baru
          </span>
        </button>
      )}

      <Composer
        members={members.filter((m) => m.id !== myId)}
        projectName={projectName}
        disabled={sending}
        error={sendError}
        replyTo={replyTo}
        onCancelReply={() => setReplyTo(null)}
        onSend={(content) => void sendChatMessage(content)}
      />
    </div>
  );
}

      