const fs = require('fs');

// 1. Update CreateTaskModal to remove DONE option
let createModalData = fs.readFileSync('components/task/create-task-modal.tsx', 'utf8');
createModalData = createModalData.replace(
  'const statuses = [{ value: "TODO", label: "To Do", dot: "bg-slate-500" }, { value: "IN_PROGRESS", label: "In Progress", dot: "bg-indigo-500" }, { value: "DONE", label: "Done", dot: "bg-emerald-500" }] as const;',
  'const statuses = [{ value: "TODO", label: "To Do", dot: "bg-slate-500" }, { value: "IN_PROGRESS", label: "In Progress", dot: "bg-indigo-500" }] as const;'
);
fs.writeFileSync('components/task/create-task-modal.tsx', createModalData);

// 2. Update Kanban Board Tab
let kanbanData = fs.readFileSync('components/project/kanban-board-tab.tsx', 'utf8');

// Add imports
if (!kanbanData.includes('updateTaskAction')) {
  kanbanData = kanbanData.replace(
    'import { CreateTaskModal } from "@/components/task/create-task-modal";',
    'import { CreateTaskModal } from "@/components/task/create-task-modal";\nimport { updateTaskAction } from "@/actions/task.actions";\nimport { useTransition } from "react";'
  );
}

// Add Tabs right after the header ends
const tabsInjectionPoint = '</section>';
if (!kanbanData.includes('<div className="mt-6 pt-4 border-t border-slate-100')) {
  const tabsHTML = `        <div className="mt-6 pt-4 border-t border-slate-100 dark:border-zinc-800 flex flex-wrap items-center gap-6">
          <button className="flex items-center gap-2 pb-3 border-b-2 border-indigo-600 text-indigo-700 dark:text-indigo-400 font-semibold text-sm">
             <span className="w-5 h-5 flex items-center justify-center bg-indigo-50 dark:bg-indigo-500/10 rounded">
               <svg xmlns="http://www.w3.org/2000/svg" width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="text-indigo-600 dark:text-indigo-400"><rect width="18" height="18" x="3" y="3" rx="2"/><path d="M8 7v7"/><path d="M12 7v4"/><path d="M16 7v9"/></svg>
             </span>
             Kanban Board
             <span className="w-5 h-5 flex items-center justify-center bg-indigo-600 text-white rounded-full text-[10px] font-bold">{project.tasks.length}</span>
          </button>
          <button className="flex items-center gap-2 pb-3 border-b-2 border-transparent text-slate-500 dark:text-slate-400 font-medium text-sm hover:text-slate-700 dark:hover:text-slate-200 transition-colors">
             <Users className="w-4 h-4" /> Team Members
             <span className="w-5 h-5 flex items-center justify-center bg-slate-100 dark:bg-zinc-800 text-slate-500 dark:text-slate-400 rounded-full text-[10px] font-bold">{project.members.length}</span>
          </button>
          <button className="flex items-center gap-2 pb-3 border-b-2 border-transparent text-slate-500 dark:text-slate-400 font-medium text-sm hover:text-slate-700 dark:hover:text-slate-200 transition-colors">
             <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M7.9 20A9 9 0 1 0 4 16.1L2 22Z"/></svg>
             Project Chat
             <span className="w-5 h-5 flex items-center justify-center bg-slate-100 dark:bg-zinc-800 text-slate-500 dark:text-slate-400 rounded-full text-[10px] font-bold">3</span>
          </button>
        </div>
      </section>`;
  kanbanData = kanbanData.replace(tabsInjectionPoint, tabsHTML);
}

// Modify TaskRow to include toggle functionality
const taskRowRegex = /function TaskRow[\s\S]*?(?=function TaskDetail)/;
const newTaskRow = `function TaskRow({ task, onClick }: { task: BoardTask; onClick: () => void }) {
  const [isPending, startTransition] = useTransition();
  const done = task.status === "DONE";
  const inProgress = task.status === "IN_PROGRESS";
  
  const toggleDone = (e: React.MouseEvent) => {
    e.stopPropagation();
    if (isPending) return;
    startTransition(async () => {
      const data = new FormData();
      data.set("status", done ? "TODO" : "DONE");
      await updateTaskAction(task.id, data);
    });
  };

  return (
    <div className="group flex flex-col md:flex-row md:items-center gap-3 md:gap-4 px-3 py-3 hover:bg-slate-800/50 rounded-xl transition-colors border-b border-transparent md:border-slate-800/50 last:border-transparent">
      <button 
        type="button"
        onClick={toggleDone}
        disabled={isPending}
        className="shrink-0 flex items-center justify-center w-5 h-5 rounded border border-slate-600 text-transparent hover:border-emerald-500 data-[state=checked]:bg-emerald-500 data-[state=checked]:border-emerald-500 data-[state=checked]:text-white transition-all disabled:opacity-50"
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

kanbanData = kanbanData.replace(taskRowRegex, newTaskRow);
fs.writeFileSync('components/project/kanban-board-tab.tsx', kanbanData);

// 3. Update Layout
let layoutData = fs.readFileSync('app/(dashboard)/layout.tsx', 'utf8');

// replace search bar section
const oldSearchBar = \`          {/* Search Bar - Desktop */}
          <div className="hidden lg:flex items-center relative w-80">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" />
            <input
              type="text"
              placeholder="Search tasks, projects, docs..."
              className="w-full h-9 pl-9 pr-4 rounded-full bg-slate-100 dark:bg-zinc-800 border-none text-sm focus:ring-2 focus:ring-indigo-500 text-slate-900 dark:text-white placeholder:text-slate-500 outline-none"
            />
          </div>\`;

const newSearchBar = \`          {/* Search Bar - Desktop */}
          <div className="hidden lg:flex items-center relative w-72 lg:w-96">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" />
            <input
              type="text"
              placeholder="Search tasks, projects, docs..."
              className="w-full h-10 pl-9 pr-4 rounded-full bg-slate-50 dark:bg-zinc-800 border border-slate-200 dark:border-zinc-700 text-sm focus:bg-white focus:ring-2 focus:ring-indigo-500/50 text-slate-900 dark:text-white placeholder:text-slate-400 outline-none transition-all shadow-sm"
            />
          </div>\`;

layoutData = layoutData.replace(oldSearchBar, newSearchBar);

// remove profile section
const profileRegex = /<div className="hidden lg:flex items-center gap-3 border-l[\s\S]*?<\/div>[\s\S]*?{/\* Fallback layar kecil \*\/}[\s\S]*?<div className="flex items-center gap-2 lg:hidden">[\s\S]*?<\/div>/;
layoutData = layoutData.replace(profileRegex, '');

fs.writeFileSync('app/(dashboard)/layout.tsx', layoutData);

console.log('done steps');
