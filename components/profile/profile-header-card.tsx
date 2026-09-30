"use client";

import { useRef, useState, type ChangeEvent } from "react";
import { useRouter } from "next/navigation";
import { BadgeCheck, Camera, Check, CloudUpload, FolderKanban, ShieldCheck } from "lucide-react";
import { updateCoverGradientAction } from "@/actions/user.actions";
import { coverGradients, isCoverGradient, type CoverGradient } from "@/lib/cover-gradients";
import { useUploadThing } from "@/lib/uploadthing";
import { UserAvatar } from "@/components/ui/user-avatar";

interface ProfileHeaderCardProps {
  name: string;
  email: string;
  image?: string | null;
  coverGradient?: string | null;
  projectCount: number;
  adminRoleCount: number;
}

export function ProfileHeaderCard({ name, email, image, coverGradient, projectCount, adminRoleCount }: ProfileHeaderCardProps) {
  const router = useRouter();
  const fileInputRef = useRef<HTMLInputElement>(null);
  const providedGradient = coverGradient ?? "";
  const initialGradient: CoverGradient = isCoverGradient(providedGradient)
    ? providedGradient
    : "indigo";
  const [isCoverPickerOpen, setIsCoverPickerOpen] = useState(false);
  const [selectedGradient, setSelectedGradient] = useState<CoverGradient>(initialGradient);
  const [isSavingCover, setIsSavingCover] = useState(false);
  const { startUpload, isUploading } = useUploadThing("profileImageUploader", {
    onClientUploadComplete: () => router.refresh(),
  });

  async function handlePhotoChange(event: ChangeEvent<HTMLInputElement>) {
    const file = event.target.files?.[0];
    if (file) await startUpload([file]);
    event.target.value = "";
  }

  async function handleGradientChange(gradient: CoverGradient) {
    setSelectedGradient(gradient);
    setIsSavingCover(true);
    const result = await updateCoverGradientAction(gradient);
    setIsSavingCover(false);
    if (!result.error) {
      setIsCoverPickerOpen(false);
      router.refresh();
    }
  }

  return (
    <section className="overflow-hidden rounded-2xl border border-slate-200 bg-white shadow-sm dark:border-slate-800 dark:bg-slate-900">
      <div className="relative h-52 px-5 py-5 sm:px-7" style={{ background: coverGradients[selectedGradient].background }}>
        <div className="absolute inset-0 bg-[radial-gradient(circle_at_82%_18%,rgba(255,255,255,0.2),transparent_24%),radial-gradient(circle_at_22%_100%,rgba(167,139,250,0.34),transparent_38%)]" />
        <div className="relative flex justify-end">
          <button type="button" onClick={() => setIsCoverPickerOpen((open) => !open)} className="inline-flex items-center gap-2 rounded-xl border border-white/20 bg-white/20 px-3.5 py-2 text-sm font-semibold text-white backdrop-blur-md transition-colors hover:bg-white/30 focus:outline-none focus:ring-2 focus:ring-white/80" aria-expanded={isCoverPickerOpen}>
            <Camera className="h-4 w-4" />
            <span className="hidden sm:inline">Edit Cover</span>
          </button>
          {isCoverPickerOpen && (
            <div className="absolute right-0 top-12 w-64 rounded-2xl border border-white/20 bg-slate-950/80 p-3 shadow-xl backdrop-blur-xl">
              <p className="mb-2 px-1 text-xs font-semibold text-white/80">Choose a cover gradient</p>
              <div className="grid grid-cols-2 gap-2">
                {Object.entries(coverGradients).map(([key, gradient]) => {
                  const gradientKey = key as CoverGradient;
                  const active = selectedGradient === gradientKey;
                  return <button key={key} type="button" disabled={isSavingCover} onClick={() => handleGradientChange(gradientKey)} className="relative h-16 rounded-xl border border-white/20 transition-transform hover:scale-[1.03] disabled:cursor-wait" style={{ background: gradient.background }} aria-label={`Use ${gradient.label} gradient`}>
                    <span className="absolute bottom-1.5 left-2 text-[10px] font-bold text-white">{gradient.label}</span>
                    {active && <span className="absolute right-1.5 top-1.5 flex h-5 w-5 items-center justify-center rounded-full bg-white text-blue-700"><Check className="h-3.5 w-3.5" /></span>}
                  </button>;
                })}
              </div>
            </div>
          )}
        </div>
      </div>

      <div className="flex min-h-36 items-center px-5 py-6 sm:px-7 sm:py-7">
        <div className="flex w-full flex-col gap-5 md:flex-row md:items-center md:justify-between">
          <div className="flex flex-col gap-4 sm:flex-row sm:items-center">
            <div className="relative shrink-0">
              <UserAvatar name={name} image={image} className="h-28 w-28 ring-4 ring-white shadow-lg dark:ring-slate-900" />
              <span aria-label="Online" className="absolute bottom-1 right-1 h-4 w-4 rounded-full bg-emerald-500 ring-2 ring-white dark:ring-slate-900" />
            </div>

            <div className="min-w-0">
              <div className="flex flex-wrap items-center gap-2">
                <h1 className="text-2xl font-bold tracking-tight text-slate-950 dark:text-white">{name}</h1>
                <BadgeCheck className="h-5 w-5 fill-blue-100 text-blue-600 dark:fill-blue-500/25 dark:text-blue-300" aria-label="Verified account" />
              </div>
              <div className="mt-2 flex flex-wrap items-center gap-2.5 text-sm">
                <span className="inline-flex max-w-full items-center gap-2 rounded-full bg-slate-100 px-3 py-1.5 font-medium text-slate-600 dark:bg-slate-800 dark:text-slate-300">
                  <span className="font-bold text-[#4285F4]" aria-hidden="true">G</span>
                  <span className="truncate">{email}</span>
                </span>
                <span className="inline-flex items-center gap-1.5 text-slate-500 dark:text-slate-400"><span className="h-2 w-2 rounded-full bg-emerald-500" />Active today</span>
              </div>
            </div>
          </div>

          <div className="flex flex-wrap items-center gap-2 md:justify-end">
            <input ref={fileInputRef} type="file" accept="image/*" className="sr-only" onChange={handlePhotoChange} />
            <button type="button" onClick={() => fileInputRef.current?.click()} disabled={isUploading} className="inline-flex items-center gap-2 rounded-xl border border-blue-200 bg-white px-3 py-2 text-xs font-semibold text-blue-700 transition-colors hover:bg-blue-50 disabled:cursor-wait disabled:opacity-70 dark:border-blue-400/30 dark:bg-slate-900 dark:text-blue-300 dark:hover:bg-blue-500/10">
              <CloudUpload className="h-4 w-4" />
              {isUploading ? "Uploading..." : "Choose New Photo"}
            </button>
            <MetricBadge icon={FolderKanban} label={`${projectCount} Projects`} />
            <MetricBadge icon={ShieldCheck} label={`${adminRoleCount} Admin Roles`} />
            <div className="flex items-center gap-2 rounded-xl border border-slate-200 bg-slate-50 px-3 py-2 text-xs font-semibold text-slate-600 dark:border-slate-800 dark:bg-slate-800/70 dark:text-slate-300">
              <span className="whitespace-nowrap">Trust Score 98%</span>
              <span className="h-1.5 w-12 overflow-hidden rounded-full bg-slate-200 dark:bg-slate-700"><span className="block h-full w-[98%] rounded-full bg-emerald-500" /></span>
            </div>
          </div>
        </div>
      </div>
    </section>
  );
}

function MetricBadge({ icon: Icon, label }: { icon: typeof FolderKanban; label: string }) {
  return <span className="inline-flex items-center gap-2 rounded-xl border border-slate-200 bg-slate-50 px-3 py-2 text-xs font-semibold text-slate-600 dark:border-slate-800 dark:bg-slate-800/70 dark:text-slate-300"><Icon className="h-4 w-4 text-blue-600 dark:text-blue-300" />{label}</span>;
}
