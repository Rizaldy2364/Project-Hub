const fs = require('fs');

let content = fs.readFileSync('components/project/kanban-board-tab.tsx', 'utf8');

// 1. Update KanbanBoardTabProps to include email and role
content = content.replace(
  'members: { id: string; name: string; avatarUrl: string | null }[];',
  'members: { id: string; name: string; email: string; avatarUrl: string | null; role: "ADMIN" | "MEMBER" }[];'
);

// 2. Add MorePower (MoreHorizontal, Mail) icon imports if not there
if (!content.includes('MoreHorizontal')) {
  content = content.replace(
    'Trash2,',
    'Trash2,\n  MoreHorizontal,\n  Mail,'
  );
}

// 3. Add activeTab state
if (!content.includes('activeTab')) {
  content = content.replace(
    'const [search, setSearch] = useState("");',
    'const [activeTab, setActiveTab] = useState<"KANBAN" | "MEMBERS" | "CHAT">("KANBAN");\n  const [search, setSearch] = useState("");'
  );
}

// 4. Update tab buttons to be interactive and conditionally render content
const tabButtonsRegex = /<div className="mt-6 pt-4 border-t border-slate-100 dark:border-slate-800 flex flex-wrap items-center gap-6">([\s\S]*?)<\/div>/;

const newTabButtons = `<div className="mt-6 pt-4 border-t border-slate-100 dark:border-slate-800 flex flex-wrap items-center gap-6">
          <button 
            onClick={() => setActiveTab("KANBAN")}
            className={\`flex items-center gap-2 pb-3 border-b-2 font-semibold text-sm transition-colors \${activeTab === "KANBAN" ? 'border-blue-600 text-blue-700 dark:text-blue-400' : 'border-transparent text-slate-500 dark:text-slate-400 hover:text-slate-700 dark:hover:text-slate-200'}\`}>
             <span className={\`w-5 h-5 flex items-center justify-center rounded \${activeTab === "KANBAN" ? 'bg-blue-50 dark:bg-blue-500/10' : ''}\`}>
               <svg xmlns="http://www.w3.org/2000/svg" width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className={activeTab === "KANBAN" ? "text-blue-600 dark:text-blue-400" : ""}><rect width="18" height="18" x="3" y="3" rx="2"/><path d="M8 7v7"/><path d="M12 7v4"/><path d="M16 7v9"/></svg>
             </span>
             Kanban Board
             <span className={\`w-5 h-5 flex items-center justify-center rounded-full text-[10px] font-bold \${activeTab === "KANBAN" ? 'bg-blue-600 text-white' : 'bg-slate-100 dark:bg-slate-800 text-slate-500 dark:text-slate-400'}\`}>{project.tasks.length}</span>
          </button>
          <button 
            onClick={() => setActiveTab("MEMBERS")}
            className={\`flex items-center gap-2 pb-3 border-b-2 font-semibold text-sm transition-colors \${activeTab === "MEMBERS" ? 'border-blue-600 text-blue-700 dark:text-blue-400' : 'border-transparent text-slate-500 dark:text-slate-400 hover:text-slate-700 dark:hover:text-slate-200'}\`}>
             <span className={\`w-5 h-5 flex items-center justify-center rounded \${activeTab === "MEMBERS" ? 'bg-blue-50 dark:bg-blue-500/10' : ''}\`}>
               <Users className={\`w-4 h-4 \${activeTab === "MEMBERS" ? 'text-blue-600 dark:text-blue-400' : ''}\`} /> 
             </span>
             Team Members
             <span className={\`w-5 h-5 flex items-center justify-center rounded-full text-[10px] font-bold \${activeTab === "MEMBERS" ? 'bg-blue-600 text-white' : 'bg-slate-100 dark:bg-slate-800 text-slate-500 dark:text-slate-400'}\`}>{project.members.length}</span>
          </button>
          <button 
            onClick={() => setActiveTab("CHAT")}
            className={\`flex items-center gap-2 pb-3 border-b-2 font-semibold text-sm transition-colors \${activeTab === "CHAT" ? 'border-blue-600 text-blue-700 dark:text-blue-400' : 'border-transparent text-slate-500 dark:text-slate-400 hover:text-slate-700 dark:hover:text-slate-200'}\`}>
             <span className={\`w-5 h-5 flex items-center justify-center rounded \${activeTab === "CHAT" ? 'bg-blue-50 dark:bg-blue-500/10' : ''}\`}>
               <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className={activeTab === "CHAT" ? "text-blue-600 dark:text-blue-400" : ""}><path d="M7.9 20A9 9 0 1 0 4 16.1L2 22Z"/></svg>
             </span>
             Project Chat
             <span className={\`w-5 h-5 flex items-center justify-center rounded-full text-[10px] font-bold \${activeTab === "CHAT" ? 'bg-blue-600 text-white' : 'bg-slate-100 dark:bg-slate-800 text-slate-500 dark:text-slate-400'}\`}>3</span>
          </button>
        </div>`;

content = content.replace(tabButtonsRegex, newTabButtons);

// 5. Wrap the bottom sections with {activeTab === "KANBAN" && (...)}
const kanbanSectionRegex = /<section className="rounded-2xl border border-slate-200 bg-white p-3 shadow-sm dark:border-slate-800 dark:bg-slate-900">([\s\S]*?)<\/section>\s*<section aria-label="Task List" className="mt-6">([\s\S]*?)<\/section>\s*<TaskDetail/m;

const kanbanSectionsWrapped = `{activeTab === "KANBAN" && (
        <>
          <section className="rounded-2xl border border-slate-200 bg-white p-3 shadow-sm dark:border-slate-800 dark:bg-slate-900">
            $1
          </section>
          <section aria-label="Task List" className="mt-6">
            $2
          </section>
        </>
      )}

      {activeTab === "MEMBERS" && (
        <TeamMembersView project={project} />
      )}

      <TaskDetail`;

content = content.replace(kanbanSectionRegex, kanbanSectionsWrapped);

// 6. Append TeamMembersView component
const teamMembersComponent = `

function TeamMembersView({ project }: { project: KanbanBoardTabProps["project"] }) {
  const [search, setSearch] = useState("");
  const [selectedMember, setSelectedMember] = useState<KanbanBoardTabProps["project"]["members"][0] | null>(null);

  const filteredMembers = project.members.filter(member => {
    if (search && !member.name.toLowerCase().includes(search.toLowerCase())) return false;
    return true;
  });

  return (
    <div className="mt-6">
      <div className="rounded-2xl bg-[#0f172a] text-slate-200 shadow-xl border border-slate-800 overflow-hidden">
        {/* Header */}
        <div className="p-6 pb-0">
          <div className="flex items-center justify-between mb-6">
            <div>
              <p className="text-sm font-semibold text-blue-400 mb-1">{project.name}</p>
              <h2 className="text-2xl font-bold text-white">Team member</h2>
            </div>
            <button className="inline-flex items-center gap-2 rounded-xl bg-blue-600 px-4 py-2 text-sm font-semibold text-white transition-colors hover:bg-blue-700">
              <Users className="h-4 w-4" />
              Undang anggota
            </button>
          </div>

          <div className="flex gap-4 items-center">
            <div className="relative flex-1 max-w-md">
              <Search className="absolute left-3.5 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" />
              <input
                type="text"
                value={search}
                onChange={(e) => setSearch(e.target.value)}
                placeholder="Cari anggota..."
                className="w-full h-10 pl-10 pr-4 rounded-xl bg-[#151f32] border border-slate-800 text-sm focus:border-blue-500 focus:ring-1 focus:ring-blue-500 text-slate-200 placeholder:text-slate-500 outline-none transition-all"
              />
            </div>
            <select className="h-10 rounded-xl bg-[#151f32] border border-slate-800 px-4 text-sm font-medium text-slate-300 outline-none focus:border-blue-500">
              <option value="all">Semua role</option>
              <option value="ADMIN">Admin</option>
              <option value="MEMBER">Member</option>
            </select>
          </div>
        </div>

        {/* Table List */}
        <div className="mt-6 border-t border-slate-800/60">
          <table className="w-full text-left text-sm whitespace-nowrap">
            <thead>
              <tr className="border-b border-slate-800/60 text-slate-400">
                <th className="px-6 py-4 font-semibold text-xs tracking-wider">ANGGOTA</th>
                <th className="px-6 py-4 font-semibold text-xs tracking-wider">ROLE</th>
                <th className="px-6 py-4 font-semibold text-xs tracking-wider">TASK AKTIF</th>
                <th className="px-6 py-4 font-semibold text-xs tracking-wider">STATUS</th>
                <th className="px-6 py-4"></th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-800/60">
              {filteredMembers.map((member) => {
                const activeTasks = project.tasks.filter(t => t.assignee?.id === member.id && t.status !== "DONE").length;
                return (
                  <tr key={member.id} className="hover:bg-slate-800/30 transition-colors">
                    <td className="px-6 py-4">
                      <div 
                        className="flex items-center gap-3 cursor-pointer group"
                        onClick={() => setSelectedMember(member)}
                      >
                        <UserAvatar name={member.name} image={member.avatarUrl} size="md" className="ring-2 ring-transparent group-hover:ring-blue-500 transition-all" />
                        <div>
                          <p className="font-semibold text-slate-100 group-hover:text-blue-400 transition-colors">{member.name}</p>
                          <p className="text-xs text-slate-400">{member.email}</p>
                        </div>
                      </div>
                    </td>
                    <td className="px-6 py-4">
                      <span className={\`inline-flex items-center px-2.5 py-1 rounded-md text-xs font-bold \${member.role === "ADMIN" ? "bg-blue-500/10 text-blue-400" : "bg-slate-700/50 text-slate-300"}\`}>
                        {member.role === "ADMIN" ? "Admin" : "Member"}
                      </span>
                    </td>
                    <td className="px-6 py-4 font-medium text-slate-300">
                      {activeTasks} task
                    </td>
                    <td className="px-6 py-4">
                      <div className="flex items-center gap-1.5">
                        <span className="w-2 h-2 rounded-full bg-emerald-500"></span>
                        <span className="text-emerald-400 font-medium text-xs">Aktif</span>
                      </div>
                    </td>
                    <td className="px-6 py-4 text-right">
                      <button className="text-slate-400 hover:text-slate-200 transition-colors">
                        <MoreHorizontal className="w-5 h-5" />
                      </button>
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      </div>

      {/* User Profile Modal */}
      <Dialog open={Boolean(selectedMember)} onOpenChange={(open) => !open && setSelectedMember(null)}>
        <DialogContent title="Profil User" className="sm:max-w-md">
          {selectedMember && (
            <div className="text-center pt-4 pb-2">
              <UserAvatar name={selectedMember.name} image={selectedMember.avatarUrl} size="lg" className="w-24 h-24 mx-auto mb-4 text-3xl" />
              <h3 className="text-2xl font-bold text-slate-900 dark:text-white">{selectedMember.name}</h3>
              <p className="text-slate-500 dark:text-slate-400 font-medium mb-6">{selectedMember.email}</p>
              
              <div className="flex items-center justify-center gap-4 border-y border-slate-100 dark:border-slate-800 py-4 mb-6">
                <div className="text-center px-4">
                   <p className="text-2xl font-bold text-slate-900 dark:text-white">{project.tasks.filter(t => t.assignee?.id === selectedMember.id && t.status !== "DONE").length}</p>
                   <p className="text-xs font-semibold text-slate-400 uppercase tracking-wider">Task Aktif</p>
                </div>
                <div className="w-px h-10 bg-slate-200 dark:bg-slate-700"></div>
                <div className="text-center px-4">
                   <p className="text-2xl font-bold text-slate-900 dark:text-white">{project.tasks.filter(t => t.assignee?.id === selectedMember.id && t.status === "DONE").length}</p>
                   <p className="text-xs font-semibold text-slate-400 uppercase tracking-wider">Diselesaikan</p>
                </div>
              </div>

              <div className="flex gap-3 justify-center">
                <button className="inline-flex items-center gap-2 px-5 py-2.5 rounded-xl bg-blue-600 hover:bg-blue-700 text-white text-sm font-semibold transition-colors">
                  <Mail className="w-4 h-4" /> Kirim Email
                </button>
                <button 
                  onClick={() => setSelectedMember(null)}
                  className="px-5 py-2.5 rounded-xl border border-slate-200 dark:border-slate-700 text-slate-700 dark:text-slate-300 text-sm font-semibold hover:bg-slate-50 dark:hover:bg-slate-800 transition-colors"
                >
                  Tutup
                </button>
              </div>
            </div>
          )}
        </DialogContent>
      </Dialog>
    </div>
  );
}
`;

content += teamMembersComponent;

fs.writeFileSync('components/project/kanban-board-tab.tsx', content, 'utf8');
console.log('done updating kanban-board-tab');
