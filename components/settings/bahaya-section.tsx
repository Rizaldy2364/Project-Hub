"use client";

import { useState } from "react";
import { AlertTriangle } from "lucide-react";
import { Dialog, DialogContent, DialogTrigger } from "@/components/ui/dialog";
import { SettingRow, SettingsPanel, settingsInputClass } from "@/components/settings/settings-panel";
import { deleteProjectAction } from "@/actions/project.actions";
import { Toast, toToastError, useToast } from "@/components/ui/toast";

interface BahayaSectionProps { projectId: string; projectName: string; }

export function BahayaSection({ projectId, projectName }: BahayaSectionProps) {
  const { toast, show } = useToast();
  const [open, setOpen] = useState(false);
  const [confirmName, setConfirmName] = useState("");
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const handleDelete = async (formData: FormData) => {
    setSubmitting(true); setError(null);
    try {
      const result = await deleteProjectAction(projectId, formData);
      if (result && "error" in result && result.error) { setError(toToastError(result.error)); return; }
      show("Project dihapus", "success");
    } finally { setSubmitting(false); }
  };

  return (
    <SettingsPanel title="Zona berbahaya" description="Tindakan yang tidak dapat diubah. Hanya admin project yang dapat melakukannya.">
      <SettingRow label="Hapus project" help="Project dan semua tugas, label, serta aktivitas di dalamnya akan dihapus secara permanen.">
        <Dialog open={open} onOpenChange={setOpen}>
          <DialogTrigger asChild>
            <button type="button" className="rounded-lg border border-red-200 bg-white px-3.5 py-2.5 text-sm font-semibold text-red-600 hover:bg-red-50 disabled:opacity-50 dark:border-white/[0.08] dark:bg-[#131A2B] dark:text-red-400 dark:hover:bg-red-50/20 focus-visible:ring-2 focus-visible:ring-red-500"><AlertTriangle className="mr-1.5 h-3.5 w-3.5 shrink-0" aria-hidden="true" />Hapus project</button>
          </DialogTrigger>
          <DialogContent title="Hapus project">
            <p className="text-sm leading-6 text-slate-600 dark:text-slate-300">Masukkan nama project <strong>{projectName}</strong> untuk mengonfirmasi penghapusan. Tindakan ini tidak dapat diurungkan.</p>
            <form action={handleDelete} className="mt-4 space-y-3">
              <SettingRow label="Konfirmasi nama project" htmlFor="delete-confirm">
                <input id="delete-confirm" name="name" type="text" value={confirmName} maxLength={100} onChange={(e) => setConfirmName(e.target.value)} className={settingsInputClass()} placeholder="Ketik nama project" />
              </SettingRow>
              {error && <p role="alert" className="px-1 py-3 text-sm text-red-600 dark:text-red-400">{error}</p>}
              <div className="flex justify-end gap-3 border-t pt-4">
                <button type="button" onClick={() => setOpen(false)} className="rounded-xl border border-slate-200 px-5 py-2.5 text-sm font-semibold text-slate-700 hover:bg-slate-50 dark:border-white/[0.08] dark:bg-[#0F1524] dark:text-[#E6EAF2] dark:hover:bg-[#1B2438] focus-visible:ring-2 focus-visible:ring-blue-500">Batal</button>
                <button type="submit" disabled={submitting || confirmName !== projectName} className="rounded-xl bg-red-600 px-5 py-2.5 text-sm font-semibold text-white hover:bg-red-700 disabled:opacity-60 focus-visible:ring-2 focus-visible:ring-red-500">{submitting ? "Menghapus..." : "Hapus project"}</button>
              </div>
            </form>
          </DialogContent>
        </Dialog>
      </SettingRow>
      <Toast toast={toast} />
    </SettingsPanel>
  );
}
