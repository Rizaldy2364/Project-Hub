"use client";

import { useRef, useState, useTransition } from "react";
import { useRouter } from "next/navigation";
import { updateProjectAction } from "@/actions/project.actions";
import { Toast, toToastError, useToast } from "@/components/ui/toast";
import {
  SettingRow,
  SettingsPanel,
  settingsInputClass,
} from "@/components/settings/settings-panel";
import { formatFullDate } from "@/lib/inbox-format";

export function GeneralSection({
  projectId,
  initialName,
  initialDescription,
  createdAt,
}: {
  projectId: string;
  initialName: string;
  initialDescription: string;
  createdAt: string;
}) {
  const router = useRouter();
  const { toast, show } = useToast();
  const [name, setName] = useState(initialName);
  const [description, setDescription] = useState(initialDescription);
  const [fieldErrors, setFieldErrors] = useState<{ name?: string; description?: string }>({});
  const [error, setError] = useState<string | null>(null);
  const [isPending, startTransition] = useTransition();
  const submittingRef = useRef(false);

  const dirty = name !== initialName || description !== initialDescription;

  function reset() {
    setName(initialName);
    setDescription(initialDescription);
    setFieldErrors({});
    setError(null);
  }

  function handleSubmit(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault();
    if (submittingRef.current || isPending || !dirty) return;
    submittingRef.current = true;
    setFieldErrors({});
    setError(null);
    const formData = new FormData();
    formData.set("name", name.trim());
    formData.set("description", description.trim());
    startTransition(async () => {
      try {
        const result = await updateProjectAction(projectId, formData);
        if (result && "error" in result && result.error) {
          const errs = result.error as { name?: string[]; description?: string[] };
          setFieldErrors({ name: errs.name?.[0], description: errs.description?.[0] });
          if (!errs.name && !errs.description) setError(toToastError(result.error));
          return;
        }
        show("Perubahan disimpan", "success");
        router.refresh();
      } catch (err) {
        setError(toToastError(err));
      } finally {
        submittingRef.current = false;
      }
    });
  }

  const BTN =
    "rounded-xl px-5 py-2.5 text-sm font-semibold transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-blue-500 disabled:opacity-50";

  return (
    <SettingsPanel
      id="umum"
      title="Umum"
      description="Informasi dasar project yang terlihat oleh semua anggota."
      footer={
        <>
          <button
            type="button"
            onClick={reset}
            disabled={!dirty || isPending}
            className={`${BTN} border border-slate-200 text-slate-700 hover:bg-slate-50 dark:border-white/[0.08] dark:text-[#E6EAF2] dark:hover:bg-[#1B2438]`}
          >
            Batal
          </button>
          <button
            type="submit"
            form="umum-form"
            disabled={!dirty || isPending}
            className={`${BTN} bg-blue-600 text-white hover:bg-blue-700`}
          >
            {isPending ? "Menyimpan..." : "Simpan perubahan"}
          </button>
        </>
      }
    >
      <form id="umum-form" onSubmit={handleSubmit}>
        <SettingRow label="Nama project" help="1–100 karakter." htmlFor="settings-name">
          <div>
            <input
              id="settings-name"
              type="text"
              value={name}
              maxLength={100}
              onChange={(e) => setName(e.target.value)}
              className={settingsInputClass(!!fieldErrors.name)}
              aria-invalid={!!fieldErrors.name}
            />
            {fieldErrors.name && (
              <p role="alert" className="mt-1 text-xs text-red-600 dark:text-red-400">{fieldErrors.name}</p>
            )}
          </div>
        </SettingRow>
        <SettingRow label="Deskripsi" help="Maksimal 500 karakter." htmlFor="settings-desc">
          <div>
            <textarea
              id="settings-desc"
              value={description}
              maxLength={500}
              rows={4}
              onChange={(e) => setDescription(e.target.value)}
              className={settingsInputClass(!!fieldErrors.description)}
              aria-invalid={!!fieldErrors.description}
            />
            {fieldErrors.description ? (
              <p role="alert" className="mt-1 text-xs text-red-600 dark:text-red-400">{fieldErrors.description}</p>
            ) : (
              <p className="mt-1 text-xs text-slate-400 dark:text-[#8B96AD]">{description.length}/500</p>
            )}
          </div>
        </SettingRow>
        <SettingRow label="Dibuat" help="Tanggal project pertama kali dibuat.">
          <p className="text-sm text-slate-600 dark:text-[#8B96AD]">{formatFullDate(createdAt)}</p>
        </SettingRow>
        {error && (
          <p role="alert" className="px-7 py-3 text-sm text-red-600 dark:text-red-400">{error}</p>
        )}
      </form>
      <Toast toast={toast} />
    </SettingsPanel>
  );
}
