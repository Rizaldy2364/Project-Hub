"use client";

import { cn } from "@/lib/utils";
import { UserAvatar } from "@/components/ui/user-avatar";
import type { TeamMemberRow } from "@/types";
import { ROLE_META, formatJoinedAt } from "@/components/team/team-meta";

export function MemberCells({
  member,
  isSelf,
  menu,
}: {
  member: TeamMemberRow;
  isSelf: boolean;
  menu: React.ReactNode;
}) {
  return (
    <>
      <td className="px-4 py-3 sm:px-6 sm:py-4">
        <div className="flex items-center gap-3">
          <UserAvatar name={member.name} image={member.avatarUrl} size="md" />
          <div className="min-w-0">
            <p className="truncate text-sm font-semibold text-slate-900 dark:text-[#E6EAF2]">
              {member.name}
              {isSelf && <span className="font-normal"> (kamu)</span>}
            </p>
            <p className="truncate text-xs text-slate-500 dark:text-[#8B96AD]">
              {member.email}
            </p>
          </div>
        </div>
      </td>
      <td className="hidden px-4 py-3 sm:px-6 sm:py-4 md:table-cell">
        <span
          className={cn(
            "inline-flex rounded-md px-2.5 py-1 text-xs font-bold",
            ROLE_META[member.role].badge
          )}
        >
          {ROLE_META[member.role].label}
        </span>
      </td>
      <td className="hidden px-4 py-3 text-sm text-slate-600 sm:px-6 sm:py-4 lg:table-cell dark:text-slate-300">
        {member.activeTaskCount} task
      </td>
      <td className="hidden px-4 py-3 text-sm text-slate-600 sm:px-6 sm:py-4 sm:table-cell dark:text-slate-300">
        {formatJoinedAt(member.joinedAt)}
      </td>
      <td className="px-4 py-3 text-right sm:px-6 sm:py-4">{menu}</td>
    </>
  );
}

export function MemberCard({
  member,
  isSelf,
  menu,
}: {
  member: TeamMemberRow;
  isSelf: boolean;
  menu: React.ReactNode;
}) {
  return (
    <div className="rounded-xl border border-slate-200 bg-white p-4 dark:border-white/[0.08] dark:bg-[#0F1524]">
      <div className="flex items-start gap-3">
        <UserAvatar name={member.name} image={member.avatarUrl} size="md" />
        <div className="min-w-0 flex-1">
          <p className="truncate text-sm font-semibold text-slate-900 dark:text-[#E6EAF2]">
            {member.name}
            {isSelf && <span className="font-normal"> (kamu)</span>}
          </p>
          <p className="truncate text-xs text-slate-500 dark:text-[#8B96AD]">
            {member.email}
          </p>
        </div>
        {menu}
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
