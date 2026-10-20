"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { Plus, Trash2, Edit3 } from "lucide-react";
import { Dialog, DialogContent } from "@/components/ui/dialog";
import { SettingRow, SettingsPanel, settingsInputClass } from "@/components/settings/settings-panel";
import { adminCreateLabelAction, adminUpdateLabelAction, adminDeleteLabelAction } from "@/actions/label.actions";
import { Toast, toToastError, useToast } from "@/components/ui/toast";
import { cn } from "@/lib/utils";

interface LabelRow { id: string; name: string; color: string; taskCount: number; }
interface LabelSectionProps { projectId: string; labels: LabelRow[]; }

const PRESET_COLORS = ["#3B66EE","#10B981","#F59E0B","#EF4444","#8B5CF6","#EC4899","#06B6D4","#84CC16","#F97316","#6366F1"];

export function LabelSection({ projectId, labels }: LabelSectionProps) {
  const router = useRouter();
  const { toast, show } = useToast();
  const [dialogOpen, setDialogOpen] = useState(false);
  const [editMode, setEditMode] = useState(false);
  const [editingId, setEditingId] = useState<string | null>(null);
  const [deleteOpen, setDeleteOpen] = useState(false);
  const [deletingId, setDeletingId] = useState<string | null>(null);
  const [deletingName, setDeletingName] = useState("");
  const [deletingCount, setDeletingCount] = useState(0);
  const [name, setName] = useState("");
  const [color, setColor] = useState(PRESET_COLORS[0]);
  const [hexInput, setHexInput] = useState(PRESET_COLORS[0]);
  const [fieldErrors, setFieldErrors] = useState<{ name?: string; color?: string }>({});
  const [error, setError] = useState<string | null>(null);
  const [submitting, setSubmitting] = useState(false);

  function openCreate() { setEditMode(false); setEditingId(null); setName(""); setColor(PRESET_COLORS[0]); setHexInput(PRESET_COLORS[0]); setFieldErrors({}); setError(null); setDialogOpen(true); }
  function openEdit(label: LabelRow) { setEditMode(true); setEditingId(label.id); setName(label.name); setColor(label.color); setHexInput(label.color); setFieldErrors({}); setError(null); setDialogOpen(true); }
  function openDelete(label: LabelRow) { setDeletingId(label.id); setDeletingName(label.name); setDeletingCount(label.taskCount); setDeleteOpen(true); }
  const validHex = /^#[0-9A-Fa-f]{6}$/.test(hexInput);

  const handleSubmit = async () => {
    setSubmitting(true); setFieldErrors({}); setError(null);
    try {
      const result = editMode && editingId
        ? await adminUpdateLabelAction(editingId, { name: name.trim(), color })
        : await adminCreateLabelAction(projectId, { name: name.trim(), color });
      if (result && "error" in result && result.error) {
        const errs = result.error as { name?: string[]; color?: string[] };
        setFieldErrors({ name: errs.name?.[0], color: errs.color?.[0] });
        if (!errs.name && !errs.color) setError(toToastError(result.error));
        return;
      }
      show(editMode ? "Label diperbarui" : "Label dibuat", "success");
      setDialogOpen(false); router.refresh();
    } finally { setSubmitting(false); }
  };

  const handleDelete = async () => {
    if (!deletingId) return;
    const result = await adminDeleteLabelAction(deletingId);
    if (result && "error" in result && result.error) { show(toToastError(result.error), "error"); setDeleteOpen(false); return; }
    show("Label dihapus", "success"); setDeleteOpen(false); router.refresh();
  };

  return (
    <SettingsPanel id="label" title="Label" description="Kategori berwarna untuk task di project ini." headerAction={
      <button type="button" onClick={openCreate} className="inline-flex items-center gap-2 rounded-xl bg-blue-600 px-3.5 py-2.5 text-xs font-semibold text-white hover:bg-blue-700 focus-visible:ring-2 focus-visible:ring-blue-500"><Plus className="h-3.5 w-3.5 shrink-0" aria-hidden="true" />Label baru</button>
    }>

      {/* Daftar label: satu baris per label (dot warna, nama, chip preview
          persis seperti di kartu task, jumlah task, aksi edit/hapus). */}
      <div>
        {labels.map((label) => (
          <div key={label.id} className="flex h-14 items-center gap-3 border-b border-slate-100 px-7 last:border-b-0 hover:bg-slate-50 dark:border-white/[0.06] dark:hover:bg-[#1B2438]/50">
            <span className="h-2.5 w-2.5 shrink-0 rounded-full" style={{ backgroundColor: label.color }} aria-hidden="true" />
            <span className="min-w-0 flex-1 truncate text-sm font-semibold text-slate-900 dark:text-[#E6EAF2]">{label.name}</span>
            <span className="hidden shrink-0 rounded-md px-2 py-0.5 text-[10px] font-bold sm:inline-block" style={{ backgroundColor: `${label.color}1a`, color: label.color }}>#{label.name}</span>
            <span className="shrink-0 text-sm text-slate-500 dark:text-[#8B96AD]">{label.taskCount} task</span>
            <div className="flex shrink-0 items-center gap-1">
              <button type="button" onClick={() => openEdit(label)} className="shrink-0 rounded-lg p-1.5 text-slate-400 hover:text-blue-600 dark:hover:text-blue-400 focus-visible:ring-2 focus-visible:ring-blue-500" title="Edit label" aria-label={`Edit ${label.name}`}><Edit3 className="h-4 w-4" aria-hidden="true" /></button>
              <button type="button" onClick={() => openDelete(label)} className="shrink-0 rounded-lg p-1.5 text-slate-400 hover:text-red-600 dark:hover:text-red-400 focus-visible:ring-2 focus-visible:ring-red-500" title="Hapus label" aria-label={`Hapus ${label.name}`}><Trash2 className="h-4 w-4" aria-hidden="true" /></button>
            </div>
          </div>
        ))}
        {labels.length === 0 && (
          <div className="px-7 py-8 text-center text-sm text-slate-500 dark:text-[#8B96AD]">Belum ada label. Klik <span className="font-semibold text-blue-600 dark:text-blue-400">Label baru</span> untuk menambahkan.</div>
        )}
      </div>

      <Dialog open={dialogOpen} onOpenChange={setDialogOpen}>
        <DialogContent title={editMode ? "Edit label" : "Label baru"}>
          <form action={handleSubmit} className="space-y-4">
            <SettingRow label="Nama label" help="1–30 karakter, unik dalam project (case-insensitive)." htmlFor="label-name" className="grid-cols-[1fr] gap-2 border-b-0 px-0 py-1 md:grid-cols-[1fr]">
              <input id="label-name" type="text" value={name} maxLength={30} onChange={(e) => setName(e.target.value)} className={settingsInputClass(!!fieldErrors.name)} aria-invalid={!!fieldErrors.name} />
              {fieldErrors.name && <p role="alert" className="mt-1 text-xs text-red-600 dark:text-red-400">{fieldErrors.name}</p>}
            </SettingRow>
            <SettingRow label="Warna" help="Pilih preset atau ketik kode hex." className="grid-cols-[1fr] gap-2 border-b-0 px-0 py-1 md:grid-cols-[1fr]">
              <div className="flex flex-wrap gap-2">
                {PRESET_COLORS.map((c) => (
                  <button key={c} type="button" onClick={() => { setColor(c); setHexInput(c); }} className={`shrink-0 rounded-full border p-1.5 ${cn(color === c ? "ring-2 ring-blue-500" : "")}`} style={{ borderColor: c }} aria-label={c}><span className="block rounded-full" style={{ width: 16, height: 16, backgroundColor: c }} aria-hidden="true" /></button>
                ))}
                <input type="text" value={hexInput} maxLength={7} onChange={(e) => { setHexInput(e.target.value); if (validHex) setColor(e.target.value); }} className="w-full rounded-xl border bg-white px-3 py-2 text-xs text-slate-900 outline-none focus:ring-2 focus:ring-blue-500 dark:bg-[#0F1524] dark:text-[#E6EAF2] dark:border-white/[0.08]" placeholder="#3B66EE" />
                {!validHex && hexInput && <p className="mt-1 text-xs text-red-600 dark:text-red-400">Format hex tidak valid (mis. #3B66EE)</p>}
              </div>
            </SettingRow>
            {error && <p role="alert" className="px-1 py-3 text-sm text-red-600 dark:text-red-400">{error}</p>}
            <div className="flex justify-end gap-3 border-t pt-4">
              <button type="button" onClick={() => setDialogOpen(false)} className="rounded-xl border border-slate-200 px-5 py-2.5 text-sm font-semibold text-slate-700 hover:bg-slate-50 dark:border-white/[0.08] dark:bg-[#0F1524] dark:text-[#E6EAF2] dark:hover:bg-[#1B2438] focus-visible:ring-2 focus-visible:ring-blue-500">Batal</button>
              <button type="submit" disabled={submitting || !name.trim() || !validHex} className="rounded-xl bg-blue-600 px-5 py-2.5 text-sm font-semibold text-white hover:bg-blue-700 disabled:opacity-60 focus-visible:ring-2 focus-visible:ring-blue-500">{submitting ? "Menyimpan..." : editMode ? "Simpan perubahan" : "Buat label"}</button>
            </div>
          </form>
        </DialogContent>
      </Dialog>
      <Dialog open={deleteOpen} onOpenChange={setDeleteOpen}>
        <DialogContent title="Hapus label">
          <p className="text-sm leading-6 text-slate-600 dark:text-slate-300">Label <strong>{deletingName}</strong> digunakan oleh <strong>{deletingCount}</strong> task. Setelah dihapus, label tidak akan muncul di kartu task, filter, pemilih label, dan laporan.</p>
          <form action={handleDelete} className="mt-6 flex justify-end gap-3">
            <button type="button" onClick={() => setDeleteOpen(false)} className="rounded-xl border border-slate-200 px-5 py-2.5 text-sm font-semibold text-slate-700 hover:bg-slate-50 dark:border-white/[0.08] dark:bg-[#0F1524] dark:text-[#E6EAF2] dark:hover:bg-[#1B2438] focus-visible:ring-2 focus-visible:ring-blue-500">Batal</button>
            <button type="submit" className="rounded-xl bg-red-600 px-5 py-2.5 text-sm font-semibold text-white hover:bg-red-700 focus-visible:ring-2 focus-visible:ring-red-500">Hapus label</button>
          </form>
        </DialogContent>
      </Dialog>
      <Toast toast={toast} />
    </SettingsPanel>
  );
}
