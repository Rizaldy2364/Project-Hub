"use client";

import { useState } from "react";
import * as DialogPrimitive from "@radix-ui/react-dialog";
import { X } from "lucide-react";
import { cn } from "@/lib/utils";
import { UserAvatar } from "@/components/ui/user-avatar";
import { formatJoinedAt } from "@/components/team/team-meta";
import { Dialog, DialogContent } from "@/components/ui/dialog";
import type { TeamMemberRow } from "@/types";

export type ManageableRole = "VIEWER" | "MEMBER" | "MANAGER";

interface MemberManageDialogProps {
  member: TeamMemberRow | null;
  open: boolean;
  saving?: boolean;
  onOpenChange: (open: boolean) => void;
  /** Ubah peran; resolve true bila sukses agar dialog ditutup. */
  onSaveRole: (role: ManageableRole) => Promise<boolean>;
  /** Hapus anggota; resolve true bila sukses agar dialog ditutup. */
  onRemove: () => Promise<boolean>;
}

const ROLE_OPTIONS: { value: ManageableRole; title: string; desc: string }[] = [
  { value: "VIEWER", title: "Viewer", desc: "Hanya bisa melihat project ini." },
  { value: "MEMBER", title: "Member", desc: "Mengerjakan task yang ditugaskan." },
  {
    value: "MANAGER",
    title: "Manager",
    desc: "Membuat dan menugaskan task menggantikan Admin.",
  },
];

/**
 * Dialog "Kelola anggota": ubah peran (radio) dan hapus dari project (dengan
 * dialog konfirmasi kedua). Dipicu tombol "Kelola" di baris anggota, khusus
 * ADMIN. Fokus terkunci di dalam dialog, Escape menutup, fokus kembali ke
 * tombol pemicu (dikelola Radix Dialog).
 */
export function MemberManageDialog({
  member,
  open,
  saving = false,
  onOpenChange,
  onSaveRole,
  onRemove,
}: MemberManageDialogProps) {
  const initialRole: ManageableRole =
    member?.role === "MANAGER" ? "MANAGER" : member?.role === "VIEWER"
      ? "VIEWER"
      : "MEMBER";
  const [selectedRole, setSelectedRole] = useState<ManageableRole>(initialRole);
  const [confirmOpen, setConfirmOpen] = useState(false);
  const [removing, setRemoving] = useState(false);

  const dirty = selectedRole !== initialRole;

  async function handleSave() {
    const ok = await onSaveRole(selectedRole);
    if (ok) onOpenChange(false);
  }

  async function handleConfirmRemove() {
    setRemoving(true);
    const ok = await onRemove();
    setRemoving(false);
    if (ok) {
      setConfirmOpen(false);
      onOpenChange(false);
    }
  }

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogPrimitive.Portal>
        <DialogPrimitive.Overlay className="fixed inset-0 z-40 bg-black/40 backdrop-blur-sm data-[state=open]:animate-slide-up" />
        <DialogPrimitive.Content
          className={cn(
            "fixed top-1/2 left-1/2 z-50 w-full max-w-md -translate-x-1/2 -translate-y-1/2 rounded-2xl border border-slate-200 bg-white p-6 shadow-xl dark:border-slate-800 dark:bg-slate-900"
          )}
        >
          <DialogPrimitive.Title className="sr-only">
            Kelola anggota
          </DialogPrimitive.Title>
          <DialogPrimitive.Description className="sr-only">
            Ubah peran atau hapus {member?.name ?? "anggota"} dari project.
          </DialogPrimitive.Description>

          {/* Header */}
          <div className="flex items-start justify-between gap-3">
            <div className="flex min-w-0 items-center gap-3">
              <UserAvatar name={member?.name} image={member?.avatarUrl} size="md" />
              <div className="min-w-0">
                <p className="truncate text-base font-semibold text-slate-900 dark:text-white">
                  {member?.name}
                </p>
                <p className="truncate text-xs text-slate-500 dark:text-[#8B96AD]">
                  {member
                    ? `${member.email} · Bergabung ${formatJoinedAt(member.joinedAt)}`
                    : ""}
                </p>
              </div>
            </div>
            <DialogPrimitive.Close
              aria-label="Tutup"
              className="rounded-lg p-1 text-slate-400 transition-colors hover:bg-slate-100 hover:text-slate-600 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-blue-500 dark:hover:bg-slate-800 dark:hover:text-slate-200"
            >
              <X className="h-5 w-5" />
            </DialogPrimitive.Close>
          </div>

          {/* PERAN */}
          <fieldset className="mt-5">
            <legend className="text-xs font-bold uppercase tracking-wider text-slate-500 dark:text-[#8B96AD]">
              Peran
            </legend>
            <div className="mt-2 space-y-2">
              {ROLE_OPTIONS.map((opt) => {
                const selected = selectedRole === opt.value;
                return (
                  <button
                    key={opt.value}
                    type="button"
                    role="radio"
                    aria-checked={selected}
                    onClick={() => setSelectedRole(opt.value)}
                    className={cn(
                      "flex w-full items-start gap-3 rounded-xl border p-3 text-left transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-blue-500",
                      selected
                        ? "border-blue-500 bg-blue-50/60 dark:border-blue-500 dark:bg-blue-500/10"
                        : "border-slate-200 bg-white hover:bg-slate-50 dark:border-slate-800 dark:bg-slate-900 dark:hover:bg-slate-800/50"
                    )}
                  >
                    <span
                      className={cn(
                        "mt-0.5 flex h-4 w-4 shrink-0 items-center justify-center rounded-full border",
                        selected
                          ? "border-blue-600"
                          : "border-slate-300 dark:border-slate-600"
                      )}
                    >
                      {selected && <span className="h-2 w-2 rounded-full bg-blue-600" />}
                    </span>
                    <span>
                      <span className="block text-sm font-semibold text-slate-900 dark:text-[#E6EAF2]">
                        {opt.title}
                      </span>
                      <span className="mt-0.5 block text-xs text-slate-500 dark:text-slate-400">
                        {opt.desc}
                      </span>
                    </span>
                  </button>
                );
              })}
            </div>
          </fieldset>

          {/* Hapus dari project */}
          <div className="mt-5 rounded-xl border border-red-200 bg-red-50/50 p-3 dark:border-red-500/30 dark:bg-red-500/5">
            <p className="text-sm font-semibold text-red-700 dark:text-red-300">
              Hapus dari project
            </p>
            <p className="mt-1 text-xs text-red-600/80 dark:text-red-400/80">
              {member && member.activeTaskCount > 0
                ? `${member.activeTaskCount} task aktif milik anggota ini akan menjadi tanpa penanggung jawab.`
                : "Anggota ini tidak punya task aktif."}
            </p>
            <button
              type="button"
              onClick={() => setConfirmOpen(true)}
              className="mt-3 inline-flex h-9 items-center rounded-lg border border-red-300 px-3 text-xs font-semibold text-red-600 transition-colors hover:bg-red-50 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-red-500 dark:border-red-500/40 dark:text-red-400 dark:hover:bg-red-500/10"
            >
              Hapus anggota
            </button>
          </div>

          {/* Footer */}
          <div className="mt-6 flex justify-end gap-3">
            <button
              type="button"
              onClick={() => onOpenChange(false)}
              className="inline-flex h-10 items-center justify-center rounded-xl border border-slate-200 px-4 text-sm font-semibold text-slate-700 transition-colors hover:bg-slate-50 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-blue-500 dark:border-slate-700 dark:text-slate-300 dark:hover:bg-slate-800"
            >
              Batal
            </button>
            <button
              type="button"
              onClick={handleSave}
              disabled={!dirty || saving}
              className="inline-flex h-10 items-center justify-center rounded-xl bg-blue-600 px-4 text-sm font-semibold text-white transition-colors hover:bg-blue-700 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-blue-500 disabled:cursor-not-allowed disabled:opacity-50 dark:focus-visible:ring-offset-slate-900"
            >
              {saving ? "Menyimpan..." : "Simpan perubahan"}
            </button>
          </div>
        </DialogPrimitive.Content>
      </DialogPrimitive.Portal>

      {/* Dialog konfirmasi kedua untuk hapus */}
      <Dialog open={confirmOpen} onOpenChange={setConfirmOpen}>
        <DialogContent title={`Hapus ${member?.name ?? ""} dari project?`}>
          <div className="space-y-4 py-2 text-center">
            <p className="text-sm text-slate-600 dark:text-slate-300">
              Anggota akan dikeluarkan dari project. Task aktifnya akan menjadi
              tanpa penanggung jawab.
            </p>
            <div className="flex justify-center gap-3 pt-2">
              <button
                type="button"
                onClick={() => setConfirmOpen(false)}
                disabled={removing}
                className="rounded-xl border border-slate-200 px-6 py-2.5 text-sm font-semibold text-slate-700 transition-colors hover:bg-slate-50 disabled:opacity-50 dark:border-slate-700 dark:text-slate-300 dark:hover:bg-slate-800"
              >
                Batal
              </button>
              <button
                type="button"
                onClick={handleConfirmRemove}
                disabled={removing}
                className="rounded-xl bg-red-600 px-6 py-2.5 text-sm font-semibold text-white transition-colors hover:bg-red-700 disabled:opacity-50"
              >
                {removing ? "Menghapus..." : "Hapus"}
              </button>
            </div>
          </div>
        </DialogContent>
      </Dialog>
    </Dialog>
  );
}
