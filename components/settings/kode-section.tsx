"use client";

import { useState, useTransition } from "react";
import { useRouter } from "next/navigation";
import { Check, Copy, RefreshCw } from "lucide-react";
import {
  regenerateJoinCodeAction,
  setJoinEnabledAction,
} from "@/actions/project.actions";
import { Dialog, DialogContent, DialogTrigger } from "@/components/ui/dialog";
import {
  SettingRow,
  SettingsPanel,
  settingsInputClass,
} from "@/components/settings/settings-panel";
import { Toast, toToastError, useToast } from "@/components/ui/toast";
import { cn } from "@/lib/utils";

interface KodeSectionProps {
  projectId: string;
  joinCode: string;
  joinEnabled: boolean;
}

/**
 * Panel "Kode gabung": menampilkan kode undangan, menyalinnya, membuat ulang
 * kode, dan mengaktifkan/menonaktifkan pendaftaran lewat kode.
 *
 * Kode hanya sampai ke server untuk role ADMIN/MANAGER (canViewJoinCode);
 * halaman Pengaturan sendiri hanya bisa diakses ADMIN.
 */
export function KodeSection({
  projectId,
  joinCode,
  joinEnabled,
}: KodeSectionProps) {
  const router = useRouter();
  const { toast, show } = useToast();
  const [copied, setCopied] = useState(false);
  const [regenOpen, setRegenOpen] = useState(false);
  const [pending, startTransition] = useTransition();

  async function handleCopy() {
    try {
      await navigator.clipboard.writeText(joinCode);
      setCopied(true);
      show("Kode disalin", "success");
      window.setTimeout(() => setCopied(false), 1500);
    } catch {
      show("Gagal menyalin kode", "error");
    }
  }
  function handleRegenerate() {
    startTransition(async () => {
      const result = await regenerateJoinCodeAction(projectId);
      if (result && "error" in result && result.error) {
        show(toToastError(result.error), "error");
        return;
      }
      setRegenOpen(false);
      show("Kode gabung dibuat ulang", "success");
      router.refresh();
    });
  }

  function handleToggleJoinEnabled(next: boolean) {
    startTransition(async () => {
      const result = await setJoinEnabledAction(projectId, next);
      if (result && "error" in result && result.error) {
        show(toToastError(result.error), "error");
        return;
      }
      show(
        next
          ? "Pendaftaran lewat kode diaktifkan"
          : "Pendaftaran lewat kode ditutup",
        "success"
      );
      router.refresh();
    });
  }
  return (
    <SettingsPanel
      id="kode-gabung"
      title="Kode gabung"
      description="Bagikan kode ini agar anggota lain bisa bergabung ke project."
    >
      <SettingRow
        label="Kode undangan"
        help="8 karakter. Siapa pun yang mengetahui kode ini bisa bergabung sebagai Member (jika pendaftaran lewat kode diaktifkan)."
        htmlFor="join-code"
      >
        <div className="flex flex-col items-stretch gap-2 sm:flex-row sm:items-center sm:justify-end">
          <input
            id="join-code"
            type="text"
            readOnly
            value={joinCode}
            onFocus={(e) => e.currentTarget.select()}
            aria-label="Kode gabung project"
            className={cn(
              settingsInputClass(),
              "sm:max-w-[220px] font-mono tracking-widest"
            )}
          />
          <button
            type="button"
            onClick={handleCopy}
            className="inline-flex items-center justify-center gap-2 rounded-xl border border-slate-200 bg-white px-4 py-2.5 text-sm font-semibold text-slate-700 transition-colors hover:bg-slate-50 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-blue-500 dark:border-white/[0.08] dark:bg-[#0F1524] dark:text-[#E6EAF2] dark:hover:bg-[#1B2438]"
          >
            {copied ? (
              <Check className="h-4 w-4 shrink-0 text-emerald-500" aria-hidden />
            ) : (
              <Copy className="h-4 w-4 shrink-0" aria-hidden />
            )}
            {copied ? "Tersalin" : "Salin"}
          </button>
        </div>
      </SettingRow>
      <SettingRow
        label="Izinkan bergabung lewat kode"
        help="Bila dinonaktifkan, kode gabung tidak lagi bisa dipakai untuk masuk. Anggota yang sudah masuk tetap bisa."
      >
        <button
          type="button"
          role="switch"
          aria-checked={joinEnabled}
          disabled={pending}
          onClick={() => handleToggleJoinEnabled(!joinEnabled)}
          className={cn(
            "relative inline-flex h-6 w-11 shrink-0 items-center rounded-full transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-blue-500 focus-visible:ring-offset-2 disabled:opacity-60 dark:focus-visible:ring-offset-slate-900",
            joinEnabled ? "bg-blue-600" : "bg-slate-300 dark:bg-slate-700"
          )}
        >
          <span
            aria-hidden
            className={cn(
              "inline-block h-5 w-5 transform rounded-full bg-white shadow transition-transform",
              joinEnabled ? "translate-x-5" : "translate-x-0.5"
            )}
          />
          <span className="sr-only">
            {joinEnabled
              ? "Pendaftaran lewat kode aktif"
              : "Pendaftaran lewat kode nonaktif"}
          </span>
        </button>
      </SettingRow>

      <SettingRow
        label="Buat ulang kode"
        help="Kode lama langsung tidak berlaku. Gunakan hanya bila kode bocor."
      >
        <Dialog open={regenOpen} onOpenChange={setRegenOpen}>
          <DialogTrigger asChild>
            <button
              type="button"
              className="inline-flex items-center justify-center gap-2 rounded-xl border border-slate-200 bg-white px-4 py-2.5 text-sm font-semibold text-slate-700 transition-colors hover:bg-slate-50 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-blue-500 dark:border-white/[0.08] dark:bg-[#0F1524] dark:text-[#E6EAF2] dark:hover:bg-[#1B2438]"
            >
              <RefreshCw className="h-4 w-4 shrink-0" aria-hidden />
              Buat ulang kode
            </button>
          </DialogTrigger>
          <DialogContent title="Buat ulang kode gabung">
            <p className="text-sm leading-6 text-slate-600 dark:text-slate-300">
              Kode gabung saat ini (
              <strong className="font-mono">{joinCode}</strong>) akan
              dinonaktifkan dan diganti kode baru. Semua orang yang memakai kode
              lama tidak bisa bergabung lagi.
            </p>
            <div className="mt-6 flex justify-end gap-3">
              <button
                type="button"
                onClick={() => setRegenOpen(false)}
                className="rounded-xl border border-slate-200 px-5 py-2.5 text-sm font-semibold text-slate-700 transition-colors hover:bg-slate-50 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-blue-500 dark:border-white/[0.08] dark:text-[#E6EAF2] dark:hover:bg-[#1B2438]"
              >
                Batal
              </button>
              <button
                type="button"
                onClick={handleRegenerate}
                disabled={pending}
                className="inline-flex items-center gap-2 rounded-xl bg-blue-600 px-5 py-2.5 text-sm font-semibold text-white transition-colors hover:bg-blue-700 disabled:opacity-60 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-blue-500"
              >
                {pending ? "Membuat..." : "Buat ulang kode"}
              </button>
            </div>
          </DialogContent>
        </Dialog>
      </SettingRow>

      <Toast toast={toast} />
    </SettingsPanel>
  );
}
