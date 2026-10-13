"use client";

import type {
  ProjectRole,
  TeamMemberRow,
  TeamProjectOption,
  TeamRoleFilter,
  TeamSort,
  TeamSummary,
} from "@/types";
import { MemberCard, MemberCells } from "@/components/team/team-row";
import { canShowMenu } from "@/components/team/team-menu";
import { TeamToolbar } from "@/components/team/team-toolbar";
import { TeamEmpty, TeamError, TeamSkeleton } from "@/components/team/team-states";
import { TeamPagination } from "@/components/team/team-pagination";

export interface TeamTableProps {
  projects: TeamProjectOption[];
  projectId: string;
  role: TeamRoleFilter;
  sort: TeamSort;
  qInput: string;
  setQInput: (v: string) => void;
  pushQuery: (next: Record<string, string>) => void;
  summary: TeamSummary;
  error: string | null;
  reload: () => void;
  loading: boolean;
  members: TeamMemberRow[];
  myRole: ProjectRole | null;
  myUserId: string;
  onManage: (member: TeamMemberRow) => void;
  total: number;
  pageSize: 10 | 25 | 50;
  safePage: number;
  from: number;
  to: number;
  pageNumbers: number[];
}

export function TeamTableCard(p: TeamTableProps) {
  const totalPages = Math.max(1, Math.ceil(p.total / p.pageSize));

  function manageFor(m: TeamMemberRow) {
    if (!canShowMenu(p.myRole, m, p.myUserId)) return null;
    return (
      <button
        type="button"
        onClick={() => p.onManage(m)}
        className="inline-flex h-8 items-center rounded-lg border border-slate-300 px-3 text-xs font-semibold text-slate-700 transition-colors hover:bg-slate-50 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-blue-500 dark:border-slate-700 dark:text-slate-200 dark:hover:bg-slate-800"
      >
        Kelola
      </button>
    );
  }

  return (
    <section
      aria-label="Daftar anggota"
      className="rounded-2xl border border-slate-200 bg-white p-4 shadow-sm sm:p-5 dark:border-slate-800 dark:bg-slate-900"
    >
      <TeamToolbar
        projects={p.projects}
        projectId={p.projectId}
        role={p.role}
        sort={p.sort}
        qInput={p.qInput}
        setQInput={p.setQInput}
        pushQuery={p.pushQuery}
        summary={p.summary}
      />

      {p.error && <TeamError message={p.error} onRetry={p.reload} />}

      {p.loading ? (
        <TeamSkeleton />
      ) : p.members.length === 0 ? (
        <TeamEmpty />
      ) : (
        <>
          <div className="mt-4 hidden overflow-x-auto md:block">
            <table className="w-full text-left">
              <thead>
                <tr className="text-[11px] font-bold tracking-wider text-slate-400 dark:text-[#8B96AD]">
                  <th scope="col" className="px-4 py-2 sm:px-6">ANGGOTA</th>
                  <th scope="col" className="hidden px-4 py-2 sm:px-6 md:table-cell">PERAN</th>
                  <th scope="col" className="hidden px-4 py-2 sm:px-6 lg:table-cell">TASK AKTIF</th>
                  <th scope="col" className="hidden px-4 py-2 sm:px-6 sm:table-cell">BERGABUNG</th>
                  <th scope="col" className="px-4 py-2 sm:px-6"><span className="sr-only">Menu</span></th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100 dark:divide-slate-800">
                {p.members.map((m) => (
                  <tr key={m.id}>
                    <MemberCells
                      member={m}
                      isSelf={m.id === p.myUserId}
                      menu={manageFor(m)}
                    />
                  </tr>
                ))}
              </tbody>
            </table>
          </div>

          <div className="mt-4 space-y-3 md:hidden">
            {p.members.map((m) => (
              <MemberCard
                key={m.id}
                member={m}
                isSelf={m.id === p.myUserId}
                menu={manageFor(m)}
              />
            ))}
          </div>

          <TeamPagination
            total={p.total}
            pageSize={p.pageSize}
            safePage={p.safePage}
            from={p.from}
            to={p.to}
            totalPages={totalPages}
            pageNumbers={p.pageNumbers}
            pushQuery={p.pushQuery}
          />
        </>
      )}
    </section>
  );
}
