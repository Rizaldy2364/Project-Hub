"use client";

import { useEffect, useRef, useState } from "react";
import { Loader2 } from "lucide-react";
import { cn } from "@/lib/utils";
import { UserAvatar } from "@/components/ui/user-avatar";
import { Toast, toToastError, useToast } from "@/components/ui/toast";
import {
  createCommentAction,
  listTaskCommentsAction,
} from "@/actions/comment.actions";

export interface TaskCommentItem {
  id: string;
  content: string;
  createdAt: string;
  author: { id: string; name: string; avatarUrl: string | null };
}

interface TaskCommentsProps {
  taskId: string;
  currentUser?: { id: string; name: string; avatarUrl: string | null };
}

function formatCommentTime(iso: string): string {
  const date = new Date(iso);
  if (Number.isNaN(date.getTime())) return "";
  return new Intl.DateTimeFormat("id-ID", {
    day: "numeric",
    month: "short",
    hour: "2-digit",
    minute: "2-digit",
    timeZone: "Asia/Jakarta",
  }).format(date);
}

/**
 * Daftar + kotak komentar di detail task.
 * Tulis lewat `createCommentAction` (aktivitas + notifikasi ikut di server).
 */
export function TaskComments({ taskId, currentUser }: TaskCommentsProps) {
  const [items, setItems] = useState<TaskCommentItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [loadError, setLoadError] = useState<string | null>(null);
  const [draft, setDraft] = useState("");
  const [sending, setSending] = useState(false);
  const textareaRef = useRef<HTMLTextAreaElement>(null);
  const sendingRef = useRef(false);
  const { toast, show } = useToast();

  const [reloadKey, setReloadKey] = useState(0);

  useEffect(() => {
    let cancelled = false;
    listTaskCommentsAction(taskId).then(
      (res) => {
        if (cancelled) return;
        if ("error" in res) {
          setLoadError(
            typeof res.error === "string" ? res.error : "Gagal memuat komentar."
          );
        } else {
          setItems(res.items);
          setLoadError(null);
        }
        setLoading(false);
      },
      () => {
        if (cancelled) return;
        setLoadError("Gagal memuat komentar. Coba lagi.");
        setLoading(false);
      }
    );
    return () => {
      cancelled = true;
    };
  }, [taskId, reloadKey]);

  async function handleSend() {
    const content = draft.trim();
    // Cegah dobel submit: abaikan saat kosong atau request masih jalan.
    if (!content || sendingRef.current) return;
    sendingRef.current = true;
    setSending(true);
    try {
      const formData = new FormData();
      formData.set("taskId", taskId);
      formData.set("content", content);
      const res = await createCommentAction(formData);
      if ("error" in res) {
        // Gagal: toast merah + isi dipertahankan + fokus kembali.
        show(toToastError(res.error), "error");
        textareaRef.current?.focus();
        return;
      }
      // Sukses: muncul langsung (tanpa refresh manual), field dibersihkan,
      // fokus kembali, toast singkat.
      const fallbackAuthor = currentUser ?? {
        id: "me",
        name: "Kamu",
        avatarUrl: null,
      };
      setItems((prev) => [
        ...prev,
        {
          id: `optimistic-${Date.now()}`,
          content,
          createdAt: new Date().toISOString(),
          author: fallbackAuthor,
        },
      ]);
      setDraft("");
      show("Komentar terkirim", "success");
      requestAnimationFrame(() => textareaRef.current?.focus());
    } catch {
      show("Gagal mengirim, coba lagi", "error");
      textareaRef.current?.focus();
    } finally {
      sendingRef.current = false;
      setSending(false);
    }
  }

  return (
    <section aria-label="Komentar task" className="space-y-3">
      <h4 className="text-sm font-semibold text-slate-900 dark:text-slate-100">
        Komentar{" "}
        <span className="font-normal text-slate-400">({items.length})</span>
      </h4>

      {loading ? (
        <div className="space-y-2" aria-label="Memuat komentar">
          {[0, 1].map((i) => (
            <div
              key={i}
              className="h-14 animate-pulse rounded-xl bg-slate-100 dark:bg-slate-800"
            />
          ))}
        </div>
      ) : loadError ? (
        <div className="rounded-xl border border-red-200 bg-red-50 p-3 text-sm dark:border-red-900/40 dark:bg-red-900/10">
          <p role="alert" className="font-medium text-red-600 dark:text-red-400">
            {loadError}
          </p>
          <button
            type="button"
            onClick={() => {
              setLoading(true);
              setLoadError(null);
              setReloadKey((n) => n + 1);
            }}
            className="mt-2 text-xs font-semibold text-red-600 underline underline-offset-2 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-blue-500 dark:text-red-400"
          >
            Coba lagi
          </button>
        </div>
      ) : items.length === 0 ? (
        <p className="rounded-xl bg-slate-50 px-3 py-4 text-center text-sm text-slate-500 dark:bg-slate-800/60 dark:text-slate-400">
          Belum ada komentar. Tulis yang pertama di bawah.
        </p>
      ) : (
        <ul className="space-y-3">
          {items.map((item) => (
            <li key={item.id} className="flex items-start gap-2.5">
              <UserAvatar
                name={item.author.name}
                image={item.author.avatarUrl}
                size="sm"
              />
              <div className="min-w-0 flex-1 rounded-xl bg-slate-50 px-3 py-2 dark:bg-slate-800/60">
                <p className="flex flex-wrap items-baseline gap-x-2">
                  <span className="text-xs font-semibold text-slate-800 dark:text-slate-100">
                    {item.author.name}
                  </span>
                  <span className="text-[11px] text-slate-400 dark:text-slate-500">
                    {formatCommentTime(item.createdAt)}
                  </span>
                </p>
                <p className="mt-0.5 whitespace-pre-wrap break-words text-sm text-slate-700 dark:text-slate-200">
                  {item.content}
                </p>
              </div>
            </li>
          ))}
        </ul>
      )}

      <form
        onSubmit={(e) => {
          e.preventDefault();
          void handleSend();
        }}
        className="space-y-2"
      >
        <label
          htmlFor={`comment-${taskId}`}
          className="text-xs font-semibold text-slate-600 dark:text-slate-300"
        >
          Tulis komentar
        </label>
        <textarea
          ref={textareaRef}
          id={`comment-${taskId}`}
          value={draft}
          onChange={(e) => setDraft(e.target.value)}
          onKeyDown={(e) => {
            // Enter kirim, Shift+Enter baris baru; abaikan saat mengirim.
            if (e.key === "Enter" && !e.shiftKey) {
              e.preventDefault();
              if (!sendingRef.current) void handleSend();
            }
          }}
          rows={3}
          maxLength={1000}
          disabled={sending}
          placeholder="Tulis komentar... (maks 1000 karakter)"
          aria-label="Tulis komentar"
          className={cn(
            "block w-full resize-y rounded-xl border border-slate-200 bg-white px-3 py-2.5 text-sm text-slate-800 outline-none transition placeholder:text-slate-400 focus:border-blue-500 focus:ring-2 focus:ring-blue-500/20 disabled:opacity-60 dark:border-slate-700 dark:bg-slate-800 dark:text-slate-100 dark:placeholder:text-slate-500"
          )}
        />
        <div className="flex items-center justify-end gap-2">
          <span className="mr-auto text-[11px] text-slate-400">
            {draft.length}/1000
          </span>
          <button
            type="submit"
            disabled={sending || !draft.trim()}
            className="inline-flex h-9 items-center gap-2 rounded-xl bg-blue-600 px-4 text-sm font-semibold text-white transition-colors hover:bg-blue-700 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-blue-500 disabled:opacity-50"
          >
            {sending && (
              <Loader2 className="h-4 w-4 animate-spin" aria-hidden />
            )}
            {sending ? "Mengirim..." : "Kirim"}
          </button>
        </div>
      </form>
      <Toast toast={toast} />
    </section>
  );
}
