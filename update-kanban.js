const fs = require('fs');
let data = fs.readFileSync('components/project/kanban-board-tab.tsx', 'utf8');

// Replace the Kanban board section rendering
const kanbanSectionRegex = /<section aria-label="Papan Kanban"[^>]*>([\s\S]*?)<\/section>/;

const newListView = `<section aria-label="Task List" className="mt-6">
        <div className="rounded-2xl bg-[#0f172a] text-slate-200 overflow-hidden shadow-xl border border-slate-800">
          <header className="flex items-center justify-between px-5 py-4 border-b border-slate-700/50 bg-[#151f32]">
            <div className="flex items-center gap-2.5">
              <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="text-slate-400"><path d="M4 20h16a2 2 0 0 0 2-2V8a2 2 0 0 0-2-2h-7.93a2 2 0 0 1-1.66-.9l-.82-1.2A2 2 0 0 0 7.93 3H4a2 2 0 0 0-2 2v13c0 1.1.9 2 2 2Z"/></svg>
              <h2 className="text-xs font-bold tracking-wider text-slate-300 uppercase">Tambah Tugas Ke Sprint 8</h2>
            </div>
            <span className="text-xs font-semibold text-slate-400">{visibleTasks.length} Tasks</span>
          </header>
          <div className="p-2">
            {visibleTasks.length ? visibleTasks.map((task) => (
              <TaskRow key={task.id} task={task} onClick={() => setSelectedTask(task)} />
            )) : (
              <p className="py-8 text-center text-sm text-slate-500">Belum ada task</p>
            )}
          </div>
        </div>
      </section>`;

data = data.replace(kanbanSectionRegex, newListView);

// Now remove KanbanColumn and TaskCard components and insert TaskRow
const componentsToRemoveRegex = /function KanbanColumn[\s\S]*?(?=function TaskDetail)/;

const taskRowComponent = `function TaskRow({ task, onClick }: { task: BoardTask; onClick: () => void }) {
  const done = task.status === "DONE";
  const inProgress = task.status === "IN_PROGRESS";
  
  return (
    <div className="group flex flex-col md:flex-row md:items-center gap-3 md:gap-4 px-3 py-3 hover:bg-slate-800/50 rounded-xl transition-colors border-b border-transparent md:border-slate-800/50 last:border-transparent">
      <button 
        className="shrink-0 flex items-center justify-center w-5 h-5 rounded border border-slate-600 text-transparent hover:border-emerald-500 data-[state=checked]:bg-emerald-500 data-[state=checked]:border-emerald-500 data-[state=checked]:text-white transition-all"
        data-state={done ? "checked" : "unchecked"}
      >
        <CheckCircle2 className="w-3.5 h-3.5 opacity-0 data-[state=checked]:opacity-100" />
      </button>
      
      <div className="flex-1 min-w-0">
        <h3 className={\`text-sm font-semibold truncate \${done ? 'text-slate-400 line-through' : 'text-slate-100'}\`}>
          {task.title}
        </h3>
      </div>

      <div className="flex flex-wrap items-center gap-3 md:gap-4 shrink-0">
        {task.labels.length > 0 && (
          <span className="px-2.5 py-1 text-[10px] font-bold rounded-md bg-emerald-500/10 text-emerald-400 border border-emerald-500/20">
            {task.labels[0].name}
          </span>
        )}
        
        <span className="flex items-center gap-1.5 px-2.5 py-1 text-[10px] font-bold rounded-md border border-amber-500/30 text-amber-500 bg-amber-500/5">
          <span className="w-2 h-2 border-[1.5px] border-amber-500 rounded-sm"></span>
          MEDIUM
        </span>
        
        <span className="flex items-center justify-center w-6 h-6 rounded-full bg-amber-200/90 text-amber-900 text-xs font-bold">
          5
        </span>

        <span className={\`w-24 text-center px-2.5 py-1.5 text-[10px] font-bold rounded-md tracking-wide \${
          done ? 'bg-emerald-500/20 text-emerald-400' : 
          inProgress ? 'bg-indigo-500 text-white' : 
          'bg-slate-700 text-slate-300'
        }\`}>
          {done ? 'DONE' : inProgress ? 'IN PROGRESS' : 'TO DO'}
        </span>

        <div className="flex items-center gap-2 w-36">
          {task.assignee ? (
            <>
              <UserAvatar name={task.assignee.name} image={task.assignee.avatarUrl} size="sm" className="w-6 h-6" />
              <span className="text-xs font-medium text-slate-300 truncate">{task.assignee.name}</span>
            </>
          ) : (
            <span className="text-xs text-slate-500">Unassigned</span>
          )}
        </div>

        <div className="flex flex-col justify-center text-[10px] font-medium text-slate-400 w-16">
          <span>28 Sep</span>
          <span>30 Sep</span>
        </div>

        <button 
          onClick={onClick}
          className="px-3.5 py-1.5 text-xs font-semibold text-slate-300 bg-slate-700/50 hover:bg-slate-700 hover:text-white rounded-lg transition-colors"
        >
          Detail
        </button>
      </div>
    </div>
  );
}

`;

data = data.replace(componentsToRemoveRegex, taskRowComponent);

fs.writeFileSync('components/project/kanban-board-tab.tsx', data);
console.log('done kanban');
