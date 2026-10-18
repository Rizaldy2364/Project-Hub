"use client";

import { cn } from "@/lib/utils";
import { UserAvatar } from "@/components/ui/user-avatar";
import type { TeamMemberRow } from "@/types";
import { ROLE_META, formatJoinedAt } from "@/components/team/team-meta";

export function MemberIdentity({
  member,
  isSelf,
  onViewProfile,
}: {
  member: TeamMemberRow;
  isSelf: boolean;
  onViewProfile: (member: TeamMemberRow) => void;
}) {
  return (
    <button
      type="button"
      onClick={() => onViewProfile(member)}
      aria-label={`Lihat profil ${member.name}`}
      className="flex min-w-0 items-center gap-3 text-left"
    >
      <UserAvatar
        name={member.name}
        image={member.avatarUrl}
        size="md"
        className="h-9 w-9 shrink-0 self-center"
      />
      <span className="flex min-w-0 flex-col items-start text-left">
        <span className="flex min-w-0 items-center gap-1.5">
          <span
            title={member.name}
            className="truncate text-sm font-semibold text-slate-900 dark:text-[#E6EAF2]"
          >
            {member.name}
          </span>
          {isSelf && (
            <span className="shrink-0 rounded-md bg-slate-100 px-1.5 py-0.5 text-[10px] font-semibold text-slate-500 dark:bg-slate-800 dark:text-slate-400">
              Kamu
            </span>
          )}
        </span>
        <span
          title={member.email}
          className="block w-full truncate text-xs text-slate-500 dark:text-[#8B96AD]"
        >
          {member.email}
        </span>
      </span>
    </button>
  );
}

export function MemberCells({
  member,
  isSelf,
  onViewProfile,
  menu,
}: {
  member: TeamMemberRow;
  isSelf: boolean;
  onViewProfile: (member: TeamMemberRow) => void;
  menu: React.ReactNode;
}) {
  return (
    <>
      <td className="min-w-0 px-4 py-3 align-middle sm:px-6 sm:py-4">
        <MemberIdentity member={member} isSelf={isSelf} onViewProfile={onViewProfile} />
      </td>
      <td className="hidden whitespace-nowrap px-4 py-3 align-middle sm:px-6 sm:py-4 lg:table-cell">
        <span
          className={cn(
            "inline-flex rounded-md px-2.5 py-1 text-xs font-bold",
            ROLE_META[member.role].badge
          )}
        >
          {ROLE_META[member.role].label}
        </span>
      </td>
      <td className="hidden whitespace-nowrap px-4 py-3 align-middle text-sm text-slate-600 sm:px-6 sm:py-4 lg:table-cell dark:text-slate-300">
        {member.activeTaskCount} task
      </td>
      <td className="hidden whitespace-nowrap px-4 py-3 align-middle text-sm text-slate-600 sm:px-6 sm:py-4 lg:table-cell dark:text-slate-300">
        {formatJoinedAt(member.joinedAt)}
      </td>
      <td className="whitespace-nowrap px-4 py-3 text-right align-middle sm:px-6 sm:py-4">{menu}</td>
    </>
  );
}

export function MemberCard({
  member,
  isSelf,
  onViewProfile,
  menu,
}: {
  member: TeamMemberRow;
  isSelf: boolean;
  onViewProfile: (member: TeamMemberRow) => void;
  menu: React.ReactNode;
}) {
  return (
    <div className="rounded-xl border border-slate-200 bg-white p-4 dark:border-white/[0.08] dark:bg-[#0F1524]">
      <div className="flex items-center gap-3">
        <MemberIdentity member={member} isSelf={isSelf} onViewProfile={onViewProfile} />
        <span className="ml-auto shrink-0">{menu}</span>
      </div>
      <div className="mt-3 flex flex-wrap items-center gap-2 text-xs">
        <span
          className={cn(
            "inline-flex rounded-md px-2.5 py-1 font-bold",
            ROLE_META[member.role].badge
          )}
        >
          {ROLE_META[member.role].label}
        </span>
        <span className="text-slate-500 dark:text-[#8B96AD]">
          {member.activeTaskCount} task aktif
        </span>
        <span className="text-slate-400 dark:text-[#8B96AD]">
          • {formatJoinedAt(member.joinedAt)}
        </span>
      </div>
    </div>
  );
}
