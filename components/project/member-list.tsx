"use client";

import { useState, useTransition } from "react";
import { Loader2, MoreHorizontal, Search, Trash2, Users } from "lucide-react";
import { MemberProfileModal } from "@/components/project/member-profile-modal";
import { Dialog, DialogContent } from "@/components/ui/dialog";
import { UserAvatar } from "@/components/ui/user-avatar";
import { removeProjectMemberAction } from "@/actions/project.actions";
import type { BoardMember, BoardProject } from "@/types";

interface MemberListProps {
  project: BoardProject;
  isAdmin: boolean;
}

/** Tab Team Members: daftar anggota, filter role, undang via kode gabung, dan tendang member (admin). */
export function MemberList({ project, isAdmin }: MemberListProps) {
  const [search, setSearch] = useState("");
  const [roleFilter, setRoleFilter] = useState("all");
  const [kickMember, setKickMember] = useState<BoardMember | null>(null);
  const [selectedMember, setSelectedMember] = useState<BoardMember | null>(null);
  const [inviteCopied, setInviteCopied] = useState(false);
  const [isPending, startTransition] = useTransition();

  const handleKick = () => {
    if (!kickMember) return;
    startTransition(async () => {
      await removeProjectMemberAction(project.id, kickMember.id);
      setKickMember(null);
    });
  };

  async function copyInviteCode() {
    try {
      await navigator.clipboard.writeText(project.joinCode);
      setInviteCopied(true);
      window.setTimeout(() => setInviteCopied(false), 1500);
    } catch {
      // Browser dapat menolak akses clipboard.
    }
  }

  const filteredMembers = project.members.filter((member) => {
    if (search && !member.name.toLowerCase().includes(search.toLowerCase())) return false;
    if (roleFilter !== "all" && member.role !== roleFilter) return false;
    return true;
  });

  return (
    <div className="mt-6">
      <div className="rounded-2xl bg-white dark:bg-[#0f172a] text-slate-900 dark:text-slate-200 shadow-sm dark:shadow-xl border border-slate-200 dark:border-slate-800 overflow-hidden">
        {/* Header */}
        <div className="p-6 pb-0">
          <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between mb-6">
            <div>
              <p className="text-sm font-semibold text-blue-600 dark:text-blue-400 mb-1">{project.name}</p>
              <h2 className="text-2xl font-bold text-slate-900 dark:text-white">Team member</h2>
            </div>
            <button
              type="button"
              onClick={copyInviteCode}
              title="Salin kode gabung untuk mengundang anggota"
              className="inline-flex items-center justify-center gap-2 rounded-xl bg-blue-600 px-4 py-2 text-sm font-semibold text-white transition-colors hover:bg-blue-700 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-blue-500 focus-visible:ring-offset-2 dark:focus-visible:ring-offset-slate-900"
            >
              <Users className="h-4 w-4" />
              {inviteCopied ? "Kode tersalin" : "Undang anggota"}
            </button>
          </div>

          <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:gap-4">
            <label className="relative flex-1 sm:max-w-md">
              <Search className="pointer-events-none absolute left-3.5 top-1/2 h-4 w-4 -translate-y-1/2 text-slate-400" />
              <input
                type="text"
                value={search}
                onChange={(e) => setSearch(e.target.value)}
                placeholder="Cari anggota..."
                className="w-full h-10 pl-10 pr-4 rounded-xl bg-slate-50 dark:bg-[#151f32] border border-slate-200 dark:border-slate-800 text-sm focus:border-blue-500 focus:ring-1 focus:ring-blue-500 text-slate-900 dark:text-slate-200 placeholder:text-slate-400 dark:placeholder:text-slate-500 outline-none transition-all"
              />
              <span className="sr-only">Cari anggota</span>
            </label>
            <label className="relative shrink-0">
              <select value={roleFilter} onChange={(e) => setRoleFilter(e.target.value)} className="h-10 w-full appearance-none rounded-xl bg-slate-50 dark:bg-[#151f32] border border-slate-200 dark:border-slate-800 pl-4 pr-9 text-sm font-medium text-slate-700 dark:text-slate-300 outline-none focus:border-blue-500">
                <option value="all">Semua role</option>
                <option value="ADMIN">Admin</option>
                <option value="MEMBER">Member</option>
              </select>
              <span className="sr-only">Filter role</span>
            </label>
          </div>
        </div>

        {/* Table List */}
        <div className="mt-6 overflow-x-auto border-t border-slate-200 dark:border-slate-800/60">
          <table className="w-full text-left text-sm whitespace-nowrap">
            <thead>
              <tr className="border-b border-slate-200 dark:border-slate-800/60 text-slate-500 dark:text-slate-400">
                <th scope="col" className="px-6 py-4 font-semibold text-xs tracking-wider">ANGGOTA</th>
                <th scope="col" className="px-6 py-4 font-semibold text-xs tracking-wider">ROLE</th>
                <th scope="col" className="px-6 py-4 font-semibold text-xs tracking-wider">TASK AKTIF</th>
                <th scope="col" className="px-6 py-4 font-semibold text-xs tracking-wider">STATUS</th>
                <th scope="col" className="px-6 py-4"><span className="sr-only">Aksi</span></th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-200 dark:divide-slate-800/60">
              {filteredMembers.map((member) => {
                const activeTasks = project.tasks.filter((t) => t.assignee?.id === member.id && t.status !== "DONE").length;
                return (
                  <tr key={member.id} className="hover:bg-slate-50 dark:hover:bg-slate-800/30 transition-colors">
                    <td className="px-6 py-4">
                      <div 
                        className="flex items-center gap-3 cursor-pointer group"
                        onClick={() => setSelectedMember(member)}
                      >
                        <UserAvatar name={member.name} image={member.avatarUrl} size="md" className="ring-2 ring-transparent group-hover:ring-blue-500 transition-all" />
                        <div>
                          <p className="font-semibold text-slate-900 dark:text-slate-100 group-hover:text-blue-600 dark:group-hover:text-blue-400 transition-colors">{member.name}</p>
                          <p className="text-xs text-slate-400">{member.email}</p>
                        </div>
                      </div>
                    </td>
                    <td className="px-6 py-4">
                      <span className={`inline-flex items-center px-2.5 py-1 rounded-md text-xs font-bold ${member.role === "ADMIN" ? "bg-blue-100 dark:bg-blue-500/10 text-blue-700 dark:text-blue-400" : "bg-slate-100 dark:bg-slate-700/50 text-slate-600 dark:text-slate-300"}`}>
                        {member.role === "ADMIN" ? "Admin" : "Member"}
                      </span>
                    </td>
                    <td className="px-6 py-4 font-medium text-slate-700 dark:text-slate-300">
                      {activeTasks} task
                    </td>
                    <td className="px-6 py-4">
                      <div className="flex items-center gap-1.5">
                        <span className="w-2 h-2 rounded-full bg-emerald-500"></span>
                        <span className="text-emerald-600 dark:text-emerald-400 font-medium text-xs">Aktif</span>
                      </div>
                    </td>
                    <td className="px-6 py-4 text-right">
                      {isAdmin ? (
                        member.role !== "ADMIN" ? (
                          <button 
                            type="button"
                            onClick={(e) => { e.stopPropagation(); setKickMember(member); }}
                            aria-label={`Tendang ${member.name} dari project`}
                            className="text-red-400 hover:text-red-300 hover:bg-red-500/10 p-2 rounded-lg transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-red-500"
                          >
                            <Trash2 className="w-4 h-4" />
                          </button>
                        ) : null
                      ) : (
                        <button
                          type="button"
                          aria-label={`Lihat profil ${member.name}`}
                          onClick={() => setSelectedMember(member)}
                          className="text-slate-400 hover:text-slate-600 dark:hover:text-slate-200 transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-blue-500 rounded"
                        >
                          <MoreHorizontal className="w-5 h-5" />
                        </button>
                      )}
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      </div>

      {/* Kick Member Modal */}
      <Dialog open={Boolean(kickMember)} onOpenChange={(open) => !open && setKickMember(null)}>
        <DialogContent title="Tendang Member">
          {kickMember && (
            <div className="py-6 text-center space-y-4">
              <div className="w-16 h-16 bg-red-100 dark:bg-red-500/10 text-red-600 rounded-full flex items-center justify-center mx-auto mb-2">
                <Trash2 className="w-8 h-8" />
              </div>
              <h3 className="text-xl font-bold text-slate-900 dark:text-slate-100">Yakin ingin menghapus/menendang {kickMember.name}?</h3>
              <p className="text-sm text-slate-500 dark:text-slate-400 max-w-sm mx-auto">
                Member ini akan dikeluarkan dari proyek dan tidak bisa lagi mengakses task atau informasi di dalamnya.
              </p>
              <div className="flex justify-center gap-3 pt-6">
                <button
                  type="button"
                  onClick={() => setKickMember(null)}
                  disabled={isPending}
                  className="px-6 py-2.5 rounded-xl border border-slate-200 dark:border-slate-700 text-sm font-semibold text-slate-700 dark:text-slate-300 hover:bg-slate-50 dark:hover:bg-slate-800 transition-colors"
                >
                  Cancel
                </button>
                <button
                  type="button"
                  onClick={handleKick}
                  disabled={isPending}
                  className="px-6 py-2.5 rounded-xl bg-red-600 hover:bg-red-700 text-sm font-semibold text-white transition-colors flex items-center gap-2"
                >
                  {isPending && <Loader2 className="w-4 h-4 animate-spin" />}
                  Hapus/Tendang
                </button>
              </div>
            </div>
          )}
        </DialogContent>
      </Dialog>

      <MemberProfileModal
        member={selectedMember}
        tasks={project.tasks}
        onOpenChange={(open) => !open && setSelectedMember(null)}
      />
    </div>
  );
}
