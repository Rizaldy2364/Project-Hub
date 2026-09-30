const fs = require('fs');

// 1. UPDATE REPOSITORY
let repo = fs.readFileSync('repositories/project.repository.ts', 'utf8');
if (!repo.includes('removeProjectMember')) {
  repo += `\n\nexport async function removeProjectMember(userId: string, projectId: string) {
  return prisma.projectMember.delete({
    where: {
      userId_projectId: {
        userId,
        projectId,
      },
    },
  });
}\n`;
  fs.writeFileSync('repositories/project.repository.ts', repo, 'utf8');
}

// 2. UPDATE ACTIONS
let actions = fs.readFileSync('actions/project.actions.ts', 'utf8');
if (!actions.includes('removeProjectMemberAction')) {
  actions = actions.replace(
    'regenerateProjectJoinCode,\n  softDeleteProject,',
    'regenerateProjectJoinCode,\n  softDeleteProject,\n  removeProjectMember,'
  );
  actions += `\n\n// REMOVE MEMBER (Admin only)
export async function removeProjectMemberAction(projectId: string, targetUserId: string) {
  const session = await auth();
  if (!session) return { error: "Unauthorized" };

  const member = await findProjectMember(session.user.id, projectId);
  if (!member || member.role !== "ADMIN") {
    return { error: "Hanya admin yang boleh menendang member" };
  }

  // Admin cant kick themselves here, or maybe they can? Safest to prevent.
  if (session.user.id === targetUserId) {
    return { error: "Anda tidak bisa menendang diri sendiri" };
  }

  await removeProjectMember(targetUserId, projectId);
  revalidatePath(\`/projects/\${projectId}\`);
  return { success: true };
}\n`;
  fs.writeFileSync('actions/project.actions.ts', actions, 'utf8');
}

// 3. UPDATE KANBAN BOARD TAB
let kanban = fs.readFileSync('components/project/kanban-board-tab.tsx', 'utf8');

// import the action
if (!kanban.includes('removeProjectMemberAction')) {
  kanban = kanban.replace(
    'import { updateTaskAction, deleteTaskAction } from "@/actions/task.actions";',
    'import { updateTaskAction, deleteTaskAction } from "@/actions/task.actions";\nimport { removeProjectMemberAction } from "@/actions/project.actions";'
  );
}

// update TeamMembersView signature and state
let kanbanReplaced = kanban.replace(
  /function TeamMembersView\(\{ project \}: \{ project: KanbanBoardTabProps\["project"\] \}\) \{/,
  `function TeamMembersView({ project, isAdmin }: { project: KanbanBoardTabProps["project"], isAdmin: boolean }) {
  const [roleFilter, setRoleFilter] = useState("all");
  const [kickMember, setKickMember] = useState<KanbanBoardTabProps["project"]["members"][0] | null>(null);
  const [isPending, startTransition] = useTransition();

  const handleKick = () => {
    if (!kickMember) return;
    startTransition(async () => {
      await removeProjectMemberAction(project.id, kickMember.id);
      setKickMember(null);
    });
  };`
);

// modify filteredMembers logic
kanbanReplaced = kanbanReplaced.replace(
  /const filteredMembers = project\.members\.filter\(member => \{\s*if \(search && !member\.name\.toLowerCase\(\)\.includes\(search\.toLowerCase\(\)\)\) return false;\s*return true;\s*\}\);/,
  `const filteredMembers = project.members.filter(member => {
    if (search && !member.name.toLowerCase().includes(search.toLowerCase())) return false;
    if (roleFilter !== "all" && member.role !== roleFilter) return false;
    return true;
  });`
);

// modify the role filter dropdown
kanbanReplaced = kanbanReplaced.replace(
  /<select className="h-10 rounded-xl bg-\[#151f32\] border border-slate-800 px-4 text-sm font-medium text-slate-300 outline-none focus:border-blue-500">/,
  `<select value={roleFilter} onChange={(e) => setRoleFilter(e.target.value)} className="h-10 rounded-xl bg-[#151f32] border border-slate-800 px-4 text-sm font-medium text-slate-300 outline-none focus:border-blue-500">`
);

// modify the MoreHorizontal button and render Trash if admin
kanbanReplaced = kanbanReplaced.replace(
  /<button className="text-slate-400 hover:text-slate-200 transition-colors">\s*<MoreHorizontal className="w-5 h-5" \/>\s*<\/button>/g,
  `{isAdmin && member.role !== "ADMIN" ? (
                        <button 
                          onClick={() => setKickMember(member)}
                          className="text-red-400 hover:text-red-300 hover:bg-red-500/10 p-2 rounded-lg transition-colors"
                        >
                          <Trash2 className="w-4 h-4" />
                        </button>
                      ) : (
                        <button className="text-slate-400 hover:text-slate-200 transition-colors">
                          <MoreHorizontal className="w-5 h-5" />
                        </button>
                      )}`
);

// add the kick modal
const kickModalStr = `
      {/* Kick Member Modal */}
      <Dialog open={Boolean(kickMember)} onOpenChange={(open) => !open && setKickMember(null)}>
        <DialogContent title="Tendang Member" className="sm:max-w-md">
          {kickMember && (
            <div className="py-6 text-center space-y-4">
              <div className="w-16 h-16 bg-red-100 dark:bg-red-500/10 text-red-600 rounded-full flex items-center justify-center mx-auto mb-2">
                 <Trash2 className="w-8 h-8" />
              </div>
              <h3 className="text-xl font-bold text-slate-900 dark:text-zinc-100">Yakin ingin menghapus/menendang {kickMember.name}?</h3>
              <p className="text-sm text-slate-500 dark:text-zinc-400 max-w-sm mx-auto">
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
`;

kanbanReplaced = kanbanReplaced.replace(
  /\{\/\* User Profile Modal \*\/\}/,
  kickModalStr + '\n      {/* User Profile Modal */}'
);

// Finally, pass isAdmin to TeamMembersView
kanbanReplaced = kanbanReplaced.replace(
  /\{activeTab === "MEMBERS" && \(\s*<TeamMembersView project=\{project\} \/>\s*\)\}/,
  `{activeTab === "MEMBERS" && (
        <TeamMembersView project={project} isAdmin={project.role === "ADMIN"} />
      )}`
);

fs.writeFileSync('components/project/kanban-board-tab.tsx', kanbanReplaced, 'utf8');

console.log('done fixing kick member feature');
