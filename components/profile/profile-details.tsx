"use client";

import { useState, useTransition, type ReactNode } from "react";
import { BadgeCheck, Building2, Mail, Pencil, Trash2, UserRound } from "lucide-react";
import { updateBioAction, updateNameAction } from "@/actions/user.actions";
import { Dialog, DialogContent, DialogTrigger } from "@/components/ui/dialog";

interface ProfileDetailsProps {
  name: string;
  email: string;
  bio: string | null;
  projects: { id: string; name: string; role: "ADMIN" | "MEMBER"; memberCount: number }[];
}

export function ProfileDetails({ name, email, bio, projects }: ProfileDetailsProps) {
  const [isBioDialogOpen, setIsBioDialogOpen] = useState(false);
  const [isNameDialogOpen, setIsNameDialogOpen] = useState(false);
  const [nameDraft, setNameDraft] = useState(name);
  const [nameError, setNameError] = useState<string | null>(null);
  const [bioDraft, setBioDraft] = useState(bio ?? "");
  const [bioError, setBioError] = useState<string | null>(null);
  const [isSavingBio, startSavingBio] = useTransition();
  const [isSavingName, startSavingName] = useTransition();

  function saveName() {
    const formData = new FormData();
    formData.set("name", nameDraft);
    startSavingName(async () => {
      const result = await updateNameAction(formData);
      if (result.error) {
        setNameError(result.error);
        return;
      }
      setNameError(null);
      setIsNameDialogOpen(false);
    });
  }

  function saveBio() {
    const formData = new FormData();
    formData.set("bio", bioDraft);
    startSavingBio(async () => {
      const result = await updateBioAction(formData);
      if (result.error) {
        setBioError(result.error);
        return;
      }
      setBioError(null);
      setIsBioDialogOpen(false);
    });
  }

  function clearBio() {
    setBioDraft("");
    const formData = new FormData();
    formData.set("bio", "");
    startSavingBio(async () => {
      const result = await updateBioAction(formData);
      if (result.error) setBioError(result.error);
    });
  }

  return (
    <div className="grid gap-5 lg:grid-cols-[1.2fr_0.8fr]">
      <section className="rounded-2xl border border-slate-200 bg-white p-5 shadow-sm dark:border-zinc-800 dark:bg-zinc-900 sm:p-6">
        <div className="flex items-start justify-between gap-4">
          <div><h2 className="text-base font-bold text-slate-950 dark:text-white">Personal Information</h2><p className="mt-1 text-sm text-slate-500 dark:text-zinc-400">Your public profile details and bio.</p></div>
          <span className="inline-flex shrink-0 items-center gap-1.5 rounded-full bg-emerald-50 px-2.5 py-1 text-[11px] font-semibold text-emerald-700 dark:bg-emerald-500/10 dark:text-emerald-300"><BadgeCheck className="h-3.5 w-3.5" />Verified</span>
        </div>

        <dl className="mt-6 divide-y divide-slate-100 dark:divide-zinc-800">
          <InfoRow icon={UserRound} label="Full name" value={name}>
            <Dialog open={isNameDialogOpen} onOpenChange={(open) => { setIsNameDialogOpen(open); if (open) { setNameDraft(name); setNameError(null); } }}>
              <DialogTrigger asChild><button type="button" className="rounded-md p-1.5 text-slate-500 transition-colors hover:bg-slate-100 hover:text-indigo-600 dark:text-zinc-400 dark:hover:bg-zinc-800 dark:hover:text-indigo-300" aria-label="Edit full name"><Pencil className="h-4 w-4" /></button></DialogTrigger>
              <DialogContent title="Edit full name">
                <input value={nameDraft} onChange={(event) => setNameDraft(event.target.value)} maxLength={50} className="w-full rounded-xl border border-slate-200 bg-white px-3 py-2.5 text-sm text-slate-800 outline-none ring-indigo-500 transition focus:ring-2 dark:border-zinc-700 dark:bg-zinc-800 dark:text-zinc-100" />
                <div className="mt-2 flex items-center justify-between gap-3"><p className="text-xs text-slate-500 dark:text-zinc-400">{nameDraft.length}/50 characters</p>{nameError && <p className="text-xs font-medium text-red-600 dark:text-red-400">{nameError}</p>}</div>
                <div className="mt-5 flex justify-end gap-2"><button type="button" onClick={() => setIsNameDialogOpen(false)} className="rounded-xl px-3 py-2 text-sm font-semibold text-slate-600 hover:bg-slate-100 dark:text-zinc-300 dark:hover:bg-zinc-800">Cancel</button><button type="button" onClick={saveName} disabled={isSavingName} className="rounded-xl bg-indigo-600 px-4 py-2 text-sm font-semibold text-white transition-colors hover:bg-indigo-700 disabled:cursor-wait disabled:opacity-70">{isSavingName ? "Saving..." : "Save name"}</button></div>
              </DialogContent>
            </Dialog>
          </InfoRow>
          <InfoRow icon={Mail} label="Email address" value={email} />
          <div className="py-4 last:pb-0">
            <div className="flex items-center justify-between gap-3">
              <dt className="text-xs font-semibold uppercase tracking-wide text-slate-500 dark:text-zinc-400">Bio & responsibilities</dt>
              <div className="flex items-center gap-1">
                <Dialog open={isBioDialogOpen} onOpenChange={(open) => { setIsBioDialogOpen(open); if (open) { setBioDraft(bio ?? ""); setBioError(null); } }}>
                  <DialogTrigger asChild><button type="button" className="rounded-md p-1.5 text-slate-500 transition-colors hover:bg-slate-100 hover:text-indigo-600 dark:text-zinc-400 dark:hover:bg-zinc-800 dark:hover:text-indigo-300" aria-label="Edit bio"><Pencil className="h-4 w-4" /></button></DialogTrigger>
                  <DialogContent title="Edit bio">
                    <textarea value={bioDraft} onChange={(event) => setBioDraft(event.target.value)} maxLength={160} placeholder="Tell project members about yourself..." className="min-h-32 w-full resize-none rounded-xl border border-slate-200 bg-white px-3 py-2.5 text-sm text-slate-800 outline-none ring-indigo-500 transition focus:ring-2 dark:border-zinc-700 dark:bg-zinc-800 dark:text-zinc-100" />
                    <div className="mt-2 flex items-center justify-between gap-3"><p className="text-xs text-slate-500 dark:text-zinc-400">{bioDraft.length}/160 characters</p>{bioError && <p className="text-xs font-medium text-red-600 dark:text-red-400">{bioError}</p>}</div>
                    <div className="mt-5 flex justify-end gap-2"><button type="button" onClick={() => setIsBioDialogOpen(false)} className="rounded-xl px-3 py-2 text-sm font-semibold text-slate-600 hover:bg-slate-100 dark:text-zinc-300 dark:hover:bg-zinc-800">Cancel</button><button type="button" onClick={saveBio} disabled={isSavingBio} className="rounded-xl bg-indigo-600 px-4 py-2 text-sm font-semibold text-white transition-colors hover:bg-indigo-700 disabled:cursor-wait disabled:opacity-70">{isSavingBio ? "Saving..." : "Save bio"}</button></div>
                  </DialogContent>
                </Dialog>
                {bio && <button type="button" onClick={clearBio} disabled={isSavingBio} className="rounded-md p-1.5 text-slate-500 transition-colors hover:bg-red-50 hover:text-red-600 disabled:opacity-60 dark:text-zinc-400 dark:hover:bg-red-500/10 dark:hover:text-red-400" aria-label="Delete bio"><Trash2 className="h-4 w-4" /></button>}
              </div>
            </div>
            <dd className="mt-2 text-sm leading-6 text-slate-700 dark:text-zinc-300">{bio || "Add a short bio to introduce yourself and your responsibilities to project members."}</dd>
          </div>
        </dl>
      </section>

      <section className="rounded-2xl border border-slate-200 bg-white p-5 shadow-sm dark:border-zinc-800 dark:bg-zinc-900 sm:p-6">
        <div className="flex items-start justify-between gap-4">
          <div><h2 className="text-base font-bold text-slate-950 dark:text-white">Projects & Roles</h2><p className="mt-1 text-sm text-slate-500 dark:text-zinc-400">Active workspace memberships.</p></div>
          <span className="rounded-full bg-indigo-50 px-2.5 py-1 text-[11px] font-semibold text-indigo-700 dark:bg-indigo-500/10 dark:text-indigo-300">{projects.length} Active</span>
        </div>

        <div className="mt-5 space-y-2.5">
          {projects.length ? projects.map((project) => <ProjectRow key={project.id} {...project} />) : (
            <div className="rounded-xl border border-dashed border-slate-200 px-4 py-7 text-center dark:border-zinc-700"><Building2 className="mx-auto h-5 w-5 text-slate-400" /><p className="mt-2 text-sm font-medium text-slate-600 dark:text-zinc-300">No active projects yet</p></div>
          )}
        </div>
      </section>
    </div>
  );
}

function InfoRow({ icon: Icon, label, value, children }: { icon: typeof UserRound; label: string; value: string; children?: ReactNode }) {
  return <div className="flex items-center gap-3 py-4 first:pt-0"><span className="flex h-8 w-8 shrink-0 items-center justify-center rounded-lg bg-slate-100 text-slate-500 dark:bg-zinc-800 dark:text-zinc-400"><Icon className="h-4 w-4" /></span><div className="min-w-0 flex-1"><dt className="text-xs font-semibold uppercase tracking-wide text-slate-500 dark:text-zinc-400">{label}</dt><dd className="mt-0.5 truncate text-sm font-medium text-slate-800 dark:text-zinc-100">{value}</dd></div>{children}</div>;
}

function ProjectRow({ name, role, memberCount }: ProfileDetailsProps["projects"][number]) {
  return <div className="flex items-center gap-3 rounded-xl bg-slate-50 p-3 dark:bg-zinc-800/70"><span className="flex h-9 w-9 shrink-0 items-center justify-center rounded-lg bg-indigo-100 text-xs font-bold text-indigo-700 dark:bg-indigo-500/20 dark:text-indigo-300">{name.slice(0, 2).toUpperCase()}</span><div className="min-w-0 flex-1"><p className="truncate text-sm font-semibold text-slate-800 dark:text-zinc-100">{name}</p><p className="text-xs text-slate-500 dark:text-zinc-400">{memberCount} member{memberCount === 1 ? "" : "s"}</p></div><span className={role === "ADMIN" ? "rounded-md bg-indigo-600 px-2 py-1 text-[10px] font-bold text-white" : "rounded-md bg-slate-200 px-2 py-1 text-[10px] font-bold text-slate-600 dark:bg-zinc-700 dark:text-zinc-300"}>{role === "ADMIN" ? "Admin" : "Member"}</span></div>;
}
