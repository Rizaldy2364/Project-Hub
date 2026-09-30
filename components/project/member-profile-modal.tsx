"use client";

import { Dialog, DialogContent } from "@/components/ui/dialog";
import { UserAvatar } from "@/components/ui/user-avatar";
import { PersonalInfoDetails } from "@/components/profile/personal-info-details";
import { coverGradients, isCoverGradient, type CoverGradient } from "@/lib/cover-gradients";
import type { BoardMember, BoardTask } from "@/types";

interface MemberProfileModalProps {
  member: BoardMember | null;
  tasks: BoardTask[];
  onOpenChange: (open: boolean) => void;
}

/**
 * Detail lengkap seorang member (read-only), datanya diambil dari profil /
 * detail personal user yang bersangkutan (lihat profileUserSelect).
 */
export function MemberProfileModal({ member, tasks, onOpenChange }: MemberProfileModalProps) {
  const activeTasks = member
    ? tasks.filter((task) => task.assignee?.id === member.id && task.status !== "DONE").length
    : 0;
  const doneTasks = member
    ? tasks.filter((task) => task.assignee?.id === member.id && task.status === "DONE").length
    : 0;
  const gradient: CoverGradient = isCoverGradient(member?.coverGradient ?? "")
    ? (member?.coverGradient as CoverGradient)
    : "indigo";

  return (
    <Dialog open={Boolean(member)} onOpenChange={onOpenChange}>
      <DialogContent
        title="Profil Anggota"
        className="w-[calc(100%-2rem)] sm:max-w-2xl"
      >
        {member && (
          <div className="-mr-2 max-h-[75vh] overflow-y-auto pr-2">
            <div
              className="relative h-20 overflow-hidden rounded-2xl border border-slate-200/70 sm:h-24 dark:border-slate-800"
              style={{ background: coverGradients[gradient].background }}
            >
              <div className="absolute inset-0 bg-[radial-gradient(circle_at_82%_18%,rgba(255,255,255,0.22),transparent_34%)]" />
              <div className="absolute inset-x-0 bottom-0 h-10 bg-gradient-to-t from-black/25 to-transparent dark:from-slate-900/70" />
            </div>

            <div className="relative z-10 -mt-12 flex flex-col items-center px-2 text-center">
              <UserAvatar
                name={member.name}
                image={member.avatarUrl}
                className="h-24 w-24 text-2xl shadow-lg ring-4 ring-white dark:ring-slate-900"
              />
              <h3 className="mt-3 text-xl font-bold text-slate-900 dark:text-white">{member.name}</h3>
              <p className="mt-0.5 text-sm text-slate-500 dark:text-slate-400">{member.email}</p>
              <div className="mt-3 flex flex-wrap items-center justify-center gap-2">
                <span
                  className={
                    member.role === "ADMIN"
                      ? "rounded-full bg-blue-600 px-3 py-1 text-[11px] font-bold uppercase tracking-wide text-white"
                      : "rounded-full bg-slate-100 px-3 py-1 text-[11px] font-bold uppercase tracking-wide text-slate-600 dark:bg-slate-800 dark:text-slate-300"
                  }
                >
                  {member.role === "ADMIN" ? "Admin" : "Member"}
                </span>
              </div>
            </div>

            {member.bio && (
              <p className="mt-4 rounded-xl bg-slate-50 px-4 py-3 text-sm leading-6 text-slate-600 dark:bg-slate-800/60 dark:text-slate-300">
                {member.bio}
              </p>
            )}

            <div className="mt-4 flex items-center justify-center gap-4 border-y border-slate-100 py-4 dark:border-slate-800">
              <div className="px-4 text-center">
                <p className="text-2xl font-bold text-slate-900 dark:text-white">{activeTasks}</p>
                <p className="text-xs font-semibold uppercase tracking-wider text-slate-400">Task Aktif</p>
              </div>
              <div className="h-10 w-px bg-slate-200 dark:bg-slate-700" />
              <div className="px-4 text-center">
                <p className="text-2xl font-bold text-slate-900 dark:text-white">{doneTasks}</p>
                <p className="text-xs font-semibold uppercase tracking-wider text-slate-400">Diselesaikan</p>
              </div>
            </div>

            <PersonalInfoDetails
              className="mt-4"
              headline={member.headline}
              company={member.company}
              location={member.location}
              website={member.website}
              githubUrl={member.githubUrl}
              linkedinUrl={member.linkedinUrl}
              birthDate={member.birthDate}
              gender={member.gender}
              skills={member.skills}
              languages={member.languages}
            />

            <div className="mt-5 flex justify-end">
              <button
                type="button"
                onClick={() => onOpenChange(false)}
                className="rounded-xl border border-slate-200 px-5 py-2.5 text-sm font-semibold text-slate-700 transition-colors hover:bg-slate-50 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-blue-500 dark:border-slate-700 dark:text-slate-300 dark:hover:bg-slate-800"
              >
                Tutup
              </button>
            </div>
          </div>
        )}
      </DialogContent>
    </Dialog>
  );
}
