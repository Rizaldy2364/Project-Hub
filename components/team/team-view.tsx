"use client";

import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import { usePathname, useRouter, useSearchParams } from "next/navigation";
import type {
  ProjectRole,
  TeamMemberRow,
  TeamProjectOption,
  TeamRoleFilter,
  TeamSort,
  TeamSummary,
} from "@/types";
import { TeamSummaryCards } from "@/components/team/team-summary";
import { TeamTableCard } from "@/components/team/team-table";
import { TeamHeader } from "@/components/team/team-cards";
import { MemberManageDialog } from "@/components/team/member-manage-dialog";
import {
  listTeamMembersAction,
  removeTeamMemberAction,
  updateMemberRoleAction,
} from "@/actions/team.actions";

interface TeamViewProps {
  projects: TeamProjectOption[];
  projectId: string | null;
  projectName: string | null;
  joinCode?: string;
  myRole: ProjectRole | null;
  myUserId: string;
  initialMembers: TeamMemberRow[];
  initialTotal: number;
  initialSummary: TeamSummary;
  initialQuery: {
    role: TeamRoleFilter;
    q: string;
    sort: TeamSort;
    page: number;
    pageSize: 10 | 25 | 50;
  };
}

export function TeamView(props: TeamViewProps) {
  const router = useRouter();
  const pathname = usePathname();
  const searchParams = useSearchParams();

  const [members, setMembers] = useState<TeamMemberRow[]>(props.initialMembers);
  const [total, setTotal] = useState(props.initialTotal);
  const [summary, setSummary] = useState<TeamSummary>(props.initialSummary);
  const [joinCode, setJoinCode] = useState<string | null>(props.joinCode ?? null);
  const [projectName, setProjectName] = useState<string | null>(props.projectName);
  const [myRole, setMyRole] = useState<ProjectRole | null>(props.myRole);

  const [qInput, setQInput] = useState(props.initialQuery.q);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [toast, setToast] = useState<string | null>(null);
  const [manageMember, setManageMember] = useState<TeamMemberRow | null>(null);
  const [acting, setActing] = useState(false);
  const debounceRef = useRef<number | null>(null);

  const role = (searchParams.get("role") as TeamRoleFilter) || props.initialQuery.role;
  const q = searchParams.get("q") ?? props.initialQuery.q;
  const sort = (searchParams.get("sort") as TeamSort) || props.initialQuery.sort;
  const page = Math.max(1, Number.parseInt(searchParams.get("page") ?? "", 10) || props.initialQuery.page);
  const rawSize = Number.parseInt(searchParams.get("pageSize") ?? "", 10);
  const pageSize = (rawSize === 25 || rawSize === 50 ? rawSize : 10) as 10 | 25 | 50;
  const projectId = searchParams.get("project") ?? props.projectId;

  function showToast(message: string) {
    setToast(message);
    window.setTimeout(() => setToast(null), 2500);
  }

  function pushQuery(next: Record<string, string>) {
    const sp = new URLSearchParams(searchParams.toString());
    for (const [k, v] of Object.entries(next)) {
      if (v) sp.set(k, v);
      else sp.delete(k);
    }
    router.push(`${pathname}?${sp.toString()}`);
  }

  const reload = useCallback(async () => {
    if (!projectId) return;
    setLoading(true);
    setError(null);
    const res = await listTeamMembersAction({
      projectId,
      role,
      q,
      sort,
      page,
      pageSize,
    });
    setLoading(false);
    if ("error" in res) {
      setError("Gagal memuat anggota. Coba lagi.");
      return;
    }
    setMembers(res.members);
    setTotal(res.total);
    setSummary(res.summary);
    setJoinCode("joinCode" in res.project ? (res.project.joinCode ?? null) : null);
    setProjectName(res.project.name);
    setMyRole(res.myRole as ProjectRole);
  }, [projectId, role, q, sort, page, pageSize]);

  // Muat ulang saat query (project/role/q/sort/page) berubah. Pola fetch di
  // effect memang memanggil setState; ini disengaja untuk sinkron dengan URL.
  useEffect(() => {
    // eslint-disable-next-line react-hooks/set-state-in-effect
    void reload();
  }, [reload]);

  // Debounce 300 ms untuk pencarian.
  useEffect(() => {
    if (qInput === q) return;
    if (debounceRef.current) window.clearTimeout(debounceRef.current);
    debounceRef.current = window.setTimeout(() => {
      pushQuery({ q: qInput.trim(), page: "1" });
    }, 300);
    return () => {
      if (debounceRef.current) window.clearTimeout(debounceRef.current);
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [qInput]);

  const totalPages = Math.max(1, Math.ceil(total / pageSize));
  const safePage = Math.min(page, totalPages);
  const from = total === 0 ? 0 : (safePage - 1) * pageSize + 1;
  const to = Math.min(total, safePage * pageSize);

  const pageNumbers = useMemo(() => {
    const nums: number[] = [];
    for (let i = Math.max(1, safePage - 2); i <= Math.min(totalPages, safePage + 2); i++) {
      nums.push(i);
    }
    return nums;
  }, [safePage, totalPages]);

  async function handleRoleChange(nextRole: "MANAGER" | "VIEWER" | "MEMBER"): Promise<boolean> {
    if (!manageMember || !projectId || acting) return false;
    const member = manageMember;
    setActing(true);
    const res = await updateMemberRoleAction({
      projectId,
      targetUserId: member.id,
      role: nextRole,
    });
    setActing(false);
    if ("error" in res) {
      showToast(typeof res.error === "string" ? res.error : "Gagal mengubah peran.");
      return false;
    }
    showToast(
      nextRole === "MANAGER"
        ? `${member.name} kini Manager.`
        : nextRole === "VIEWER"
          ? `${member.name} kini Viewer.`
          : `${member.name} kini Member.`
    );
    await reload();
    return true;
  }

  async function handleRemove(): Promise<boolean> {
    if (!manageMember || !projectId || acting) return false;
    const member = manageMember;
    setActing(true);
    const res = await removeTeamMemberAction({
      projectId,
      targetUserId: member.id,
    });
    setActing(false);
    if ("error" in res) {
      showToast(typeof res.error === "string" ? res.error : "Gagal menghapus anggota.");
      return false;
    }
    showToast(`${member.name} dihapus dari project.`);
    await reload();
    return true;
  }

  if (!projectId || props.projects.length === 0) {
    return (
      <div className="space-y-5">
        <TeamHeader />
        <div className="rounded-2xl border border-slate-200 bg-white p-12 text-center shadow-sm dark:border-slate-800 dark:bg-slate-900">
          <p className="text-sm font-semibold text-slate-700 dark:text-slate-200">
            Kamu belum tergabung di project mana pun.
          </p>
          <p className="mt-1 text-xs text-slate-500 dark:text-slate-400">
            Buat project baru atau gabung lewat kode gabung untuk melihat anggota tim.
          </p>
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-5">
      <TeamHeader />

      <TeamSummaryCards
        summary={summary}
        joinCode={joinCode}
        projectName={projectName ?? ""}
      />

      <TeamTableCard
        projects={props.projects}
        projectId={projectId}
        role={role}
        sort={sort}
        qInput={qInput}
        setQInput={setQInput}
        pushQuery={pushQuery}
        summary={summary}
        error={error}
        reload={reload}
        loading={loading}
        members={members}
        myRole={myRole}
        myUserId={props.myUserId}
        onManage={setManageMember}
        total={total}
        pageSize={pageSize}
        safePage={safePage}
        from={from}
        to={to}
        pageNumbers={pageNumbers}
      />

      <MemberManageDialog
        member={manageMember}
        open={Boolean(manageMember)}
        saving={acting}
        onOpenChange={(open) => !open && setManageMember(null)}
        onSaveRole={handleRoleChange}
        onRemove={handleRemove}
      />

      {toast && (
        <div
          role="status"
          className="fixed bottom-6 left-1/2 z-50 -translate-x-1/2 rounded-xl bg-slate-900 px-4 py-2.5 text-sm font-medium text-white shadow-lg dark:bg-slate-100 dark:text-slate-900"
        >
          {toast}
        </div>
      )}
    </div>
  );
}
