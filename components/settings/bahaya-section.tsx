"use client";

import { useCallback, useEffect, useRef, useState } from "react";
import { AlertTriangle, Trash2, X } from "lucide-react";
import { Dialog, DialogContent, DialogTrigger } from "@/components/ui/dialog";
import * as DialogPrimitive from "@radix-ui/react-dialog";
import { deleteProjectAction } from "@/actions/project.actions";
import { Toast, toToastError, useToast } from "@/components/ui/toast";
import { cn } from "@/lib/utils";

interface BahayaSectionProps {
  projectId: string;
  projectName: string;
  taskCount: number;
  labelCount: number;
  memberCount: number;
}

export function BahayaSection({
  projectId,
  projectName,
  taskCount,
  labelCount,
  memberCount,
}: BahayaSectionProps) {
  const { toast, show } = useToast();
  const [open, setOpen] = useState(false);
  const [confirmName, setConfirmName] = useState("");
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const triggerRef = useRef<HTMLButtonElement>(null);
  const inputRef = useRef<HTMLInputElement>(null);

  const canDelete = confirmName.trim() === projectName;

  const impactParts = useCallback(() => {
    const parts: string[] = [];
    if (taskCount > 0) parts.push(`${taskCount} task`);
    if (labelCount > 0) parts.push(`${labelCount} label`);
    return parts;
  }, [taskCount, labelCount]);

  const impactText = useCallback(() => {
    const parts = impactParts();
    if (parts.length === 0) return "seluruh komentar dan diskusinya";
    return `${parts.join(", ")}, serta seluruh komentar dan diskusinya`;
  }, [impactParts]);

  const dialogItem2 = useCallback(() => {
    const parts = impactParts();
    if (parts.length === 0) return "Semua komentar dan diskusi tidak akan tampil lagi.";
    return `${parts.join(", ")} dan semua komentar tidak akan tampil lagi.`;
  }, [impactParts]);

  const dialogItem3 = useCallback(() => {
    if (memberCount === 1) return "Tidak ada anggota lain yang terdampak.";
    return `${memberCount} anggota langsung kehilangan akses.`;
  }, [memberCount]);

  const handleOpenChange = (nextOpen: boolean) => {
    if (!nextOpen && submitting) return;
    setOpen(nextOpen);
  };

  useEffect(() => {
    if (open && inputRef.current) {
      inputRef.current.focus();
    }
  }, [open]);

  const handleDelete = async (formData: FormData) => {
    setSubmitting(true);
    setError(null);
    try {
      const result = await deleteProjectAction(projectId, formData);
      if (result && "error" in result && result.error) {
        setError(toToastError(result.error));
        return;
      }
      show("Project dihapus", "success");
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <>
      <section
        id="zona-berbahaya"
        aria-labelledby="zona-berbahaya-title"
        className={cn(
          "overflow-hidden rounded-[16px] border border-red-500/[0.35] bg-white shadow-sm dark:bg-[#131A2B]"
        )}
      >
        <header className="px-7 py-[22px] bg-red-500/[0.05] border-b border-red-500/[0.25]">
          <div className="flex items-start gap-3">
            <div className="h-10 w-10 rounded-[12px] bg-red-500/[0.14] flex items-center justify-center shrink-0">
              <AlertTriangle className="h-5 w-5 text-red-400" aria-hidden="true" />
            </div>
            <div className="min-w-0">
              <h2 id="zona-berbahaya-title" className="text-[18px] font-extrabold text-red-400">
                Zona berbahaya
              </h2>
              <p className="mt-1 text-[13px] text-slate-500 dark:text-[#8B96AD]">
                Tindakan di bawah ini berdampak ke semua anggota project.
              </p>
            </div>
          </div>
        </header>

        <div className="px-7 py-[26px]">
          <div
            className={cn(
              "flex items-center justify-between gap-10",
              "sm:flex-row flex-col gap-3"
            )}
          >
            <div className="flex-1 min-w-0 max-w-[640px]">
              <h3 className="text-[15px] font-bold text-slate-900 dark:text-[#E6EAF2]">
                Hapus project
              </h3>
              <p className="mt-2 text-[13px] leading-[1.65] text-slate-600 dark:text-[#A9B3C7]">
                Project ini akan hilang dari semua halaman untuk semua anggota,
                beserta {impactText()}. Belum ada fitur untuk mengembalikannya
                dari aplikasi.
              </p>
              <p className="mt-3 text-[12px] text-slate-500 dark:text-[#8B96AD]">
                Kamu akan diminta mengetik nama project untuk konfirmasi.
              </p>
            </div>

            <Dialog open={open} onOpenChange={handleOpenChange}>
              <DialogTrigger asChild>
                <button
                  ref={triggerRef}
                  type="button"
                  className={cn(
                    "inline-flex h-[42px] items-center justify-center gap-2 whitespace-nowrap rounded-[12px] border border-red-500/[0.55] px-[18px] text-sm font-bold text-red-400",
                    "bg-red-500/[0.08] hover:bg-red-500/[0.12]",
                    "focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-red-500 focus-visible:ring-offset-2 dark:focus-visible:ring-offset-[#131A2B]",
                    "transition-colors"
                  )}
                >
                  <Trash2 className="h-4 w-4 shrink-0" aria-hidden="true" />
                  Hapus project
                </button>
              </DialogTrigger>

              <DialogContent
                hideHeader
                ariaLabelledby="delete-dialog-title"
                className="w-full max-w-[500px] rounded-[20px] border border-slate-200 dark:border-white/[0.12] shadow-2xl bg-white dark:bg-[#131A2B]"
              >
                <div className="px-6 py-[22px]">
                  <div className="flex items-start justify-between gap-4">
                    <div className="flex items-start gap-3">
                      <div className="h-10 w-10 rounded-[12px] bg-red-500/[0.14] flex items-center justify-center shrink-0 mt-0.5">
                        <Trash2 className="h-5 w-5 text-red-400" aria-hidden="true" />
                      </div>
                      <div className="min-w-0">
                        <h2
                          id="delete-dialog-title"
                          className="text-[18px] font-extrabold text-slate-900 dark:text-red-400 line-clamp-2"
                          title={`Hapus project “${projectName}”?`}
                        >
                          Hapus project “{projectName}”?
                        </h2>
                        <p className="mt-1 text-[13px] text-slate-500 dark:text-[#8B96AD]">
                          Tindakan ini berdampak ke semua anggota.
                        </p>
                      </div>
                    </div>
                    <DialogPrimitive.Close
                      aria-label="Tutup"
                      disabled={submitting}
                      className={cn(
                        "text-slate-400 hover:text-red-400 dark:text-slate-400 dark:hover:text-red-400",
                        "disabled:opacity-50 disabled:cursor-not-allowed"
                      )}
                    >
                      <X className="h-5 w-5" />
                    </DialogPrimitive.Close>
                  </div>
                </div>

                <div className="mt-6 rounded-[14px] border border-red-500/[0.28] bg-red-500/[0.06] px-[16px] py-[14px]">
                  <p className="text-[12px] font-bold text-red-400 tracking-[0.06em] uppercase">
                    YANG AKAN TERJADI
                  </p>
                  <ul className="mt-3 space-y-2 text-[13px] leading-[1.55] text-slate-400 dark:text-[#C3CCDD]">
                    <li>
                      Project hilang dari Project Saya, Dashboard, Diskusi,
                      Laporan, dan Aktivitas.
                    </li>
                    <li>{dialogItem2()}</li>
                    <li>{dialogItem3()}</li>
                    <li>Belum bisa dikembalikan dari aplikasi.</li>
                  </ul>
                </div>

                <form action={handleDelete} className="mt-6 space-y-2">
                  <p className="text-sm text-slate-600 dark:text-[#E6EAF2]">
                    Ketik
                    <span className="rounded-[6px] bg-[#1B2438] px-2 py-0.5 text-xs font-bold text-white">
                      {projectName}
                    </span>
                    untuk melanjutkan.
                  </p>
                  <input
                    ref={inputRef}
                    name="name"
                    type="text"
                    value={confirmName}
                    maxLength={100}
                    onChange={(e) => setConfirmName(e.target.value)}
                    placeholder="Nama project"
                    aria-label="Ketik nama project"
                    className={cn(
                      "w-full h-[44px] rounded-[12px] border px-3.5 text-sm",
                      "bg-white text-slate-900 border-slate-200 placeholder:text-slate-400",
                      "dark:bg-[#0F1524] dark:text-[#E6EAF2] dark:border-white/[0.14] dark:placeholder:text-[#8B96AD]",
                      "focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-red-500"
                    )}
                  />
                  {error && (
                    <p role="alert" className="text-[12px] text-red-400">
                      {error}
                    </p>
                  )}
                  <div className={cn(
                    "mt-4 flex justify-end gap-3 pt-3 border-t",
                    "bg-white/30 dark:bg-[#0F1524]/40",
                    "border-slate-200 dark:border-white/[0.08]"
                  )}>
                    <button
                      type="button"
                      onClick={() => setOpen(false)}
                      disabled={submitting}
                      className={cn(
                        "inline-flex h-[40px] items-center justify-center rounded-[12px] px-4 text-sm font-semibold",
                        "border border-slate-200 bg-white text-slate-700 hover:bg-slate-50",
                        "dark:border-white/[0.08] dark:bg-[#1B2438] dark:text-[#E6EAF2] dark:hover:bg-[#2A3447]",
                        "disabled:opacity-50 disabled:cursor-not-allowed",
                        "focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-blue-500"
                      )}
                    >
                      Batal
                    </button>
                    <button
                      type="submit"
                      disabled={submitting || !canDelete}
                      aria-disabled={submitting || !canDelete ? "true" : undefined}
                      className={cn(
                        "inline-flex h-[40px] items-center justify-center gap-2 rounded-[12px] px-4 text-sm font-bold text-white",
                        "bg-red-600 hover:bg-red-700",
                        "disabled:bg-red-600 disabled:opacity-40 disabled:cursor-not-allowed",
                        "focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-red-500"
                      )}
                    >
                      {submitting ? (
                        <>
                          <svg
                            className="animate-spin h-4 w-4"
                            xmlns="http://www.w3.org/2000/svg"
                            fill="none"
                            viewBox="0 0 24 24"
                          >
                            <circle
                              className="opacity-25"
                              cx="12"
                              cy="12"
                              r="10"
                              stroke="currentColor"
                              strokeWidth="4"
                            ></circle>
                            <path
                              className="opacity-75"
                              fill="currentColor"
                              d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"
                            ></path>
                          </svg>
                          Menghapus...
                        </>
                      ) : (
                        <>
                          <Trash2 className="h-4 w-4 shrink-0" aria-hidden="true" />
                          Hapus project
                        </>
                      )}
                    </button>
                  </div>
                </form>
              </DialogContent>
            </Dialog>

            <Toast toast={toast} />
          </div>
        </div>
      </section>
    </>
  );
}
