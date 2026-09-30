const fs = require('fs');

let kanban = fs.readFileSync('components/project/kanban-board-tab.tsx', 'utf8');

// --- Fix Task List Container ---
kanban = kanban.replace(
  /className="rounded-2xl bg-\[#0f172a\] text-slate-200 overflow-hidden shadow-xl border border-slate-800"/,
  'className="rounded-2xl bg-white dark:bg-[#0f172a] text-slate-900 dark:text-slate-200 overflow-hidden shadow-sm dark:shadow-xl border border-slate-200 dark:border-slate-800"'
);

// --- Fix TaskRow ---
kanban = kanban.replace(
  /className="group flex flex-col md:flex-row md:items-center gap-3 md:gap-4 px-3 py-3 hover:bg-slate-800\/50 rounded-xl transition-colors border-b border-transparent md:border-slate-800\/50 last:border-transparent cursor-pointer"/g,
  'className="group flex flex-col md:flex-row md:items-center gap-3 md:gap-4 px-3 py-3 hover:bg-slate-50 dark:hover:bg-slate-800/50 rounded-xl transition-colors border-b border-transparent md:border-slate-100 dark:md:border-slate-800/50 last:border-transparent cursor-pointer"'
);

kanban = kanban.replace(
  /className="shrink-0 flex items-center justify-center w-5 h-5 rounded border border-slate-600 text-transparent hover:border-emerald-500 data-\[state=checked\]:bg-emerald-500 data-\[state=checked\]:border-emerald-500 data-\[state=checked\]:text-white transition-all disabled:opacity-50"/g,
  'className="shrink-0 flex items-center justify-center w-5 h-5 rounded border border-slate-300 dark:border-slate-600 text-transparent hover:border-emerald-500 data-[state=checked]:bg-emerald-500 data-[state=checked]:border-emerald-500 data-[state=checked]:text-white transition-all disabled:opacity-50"'
);

kanban = kanban.replace(
  /className=\{`text-sm font-semibold truncate \$\{done \? 'text-slate-400 line-through' : 'text-slate-100'\}`\}/g,
  'className={`text-sm font-semibold truncate ${done ? "text-slate-400 line-through" : "text-slate-900 dark:text-slate-100"}`}'
);

kanban = kanban.replace(
  /className="text-xs font-medium text-slate-300 truncate"/g,
  'className="text-xs font-medium text-slate-700 dark:text-slate-300 truncate"'
);

kanban = kanban.replace(
  /className="px-3\.5 py-1\.5 text-xs font-semibold text-slate-300 bg-slate-700\/50 hover:bg-slate-700 hover:text-white rounded-lg transition-colors"/g,
  'className="px-3.5 py-1.5 text-xs font-semibold text-slate-700 dark:text-slate-300 bg-slate-100 dark:bg-slate-700/50 hover:bg-slate-200 dark:hover:bg-slate-700 hover:text-slate-900 dark:hover:text-white rounded-lg transition-colors"'
);

kanban = kanban.replace(
  /className=\{`w-24 text-center px-2\.5 py-1\.5 text-\[10px\] font-bold rounded-md tracking-wide \$\{\s*done \? 'bg-emerald-500\/20 text-emerald-400' : \s*inProgress \? 'bg-blue-500 text-white' : \s*'bg-slate-700 text-slate-300'\s*\}`\}/g,
  'className={`w-24 text-center px-2.5 py-1.5 text-[10px] font-bold rounded-md tracking-wide ${done ? "bg-emerald-500/20 text-emerald-600 dark:text-emerald-400" : inProgress ? "bg-blue-500 text-white" : "bg-slate-100 dark:bg-slate-700 text-slate-600 dark:text-slate-300"}`}'
);

// --- Fix TeamMembersView ---
kanban = kanban.replace(
  /className="rounded-2xl bg-\[#0f172a\] text-slate-200 shadow-xl border border-slate-800 overflow-hidden"/g,
  'className="rounded-2xl bg-white dark:bg-[#0f172a] text-slate-900 dark:text-slate-200 shadow-sm dark:shadow-xl border border-slate-200 dark:border-slate-800 overflow-hidden"'
);

kanban = kanban.replace(
  /className="text-2xl font-bold text-white"/g,
  'className="text-2xl font-bold text-slate-900 dark:text-white"'
);

kanban = kanban.replace(
  /className="w-full h-10 pl-10 pr-4 rounded-xl bg-\[#151f32\] border border-slate-800 text-sm focus:border-blue-500 focus:ring-1 focus:ring-blue-500 text-slate-200 placeholder:text-slate-500 outline-none transition-all"/g,
  'className="w-full h-10 pl-10 pr-4 rounded-xl bg-slate-50 dark:bg-[#151f32] border border-slate-200 dark:border-slate-800 text-sm focus:border-blue-500 focus:ring-1 focus:ring-blue-500 text-slate-900 dark:text-slate-200 placeholder:text-slate-400 dark:placeholder:text-slate-500 outline-none transition-all"'
);

kanban = kanban.replace(
  /className="h-10 rounded-xl bg-\[#151f32\] border border-slate-800 px-4 text-sm font-medium text-slate-300 outline-none focus:border-blue-500"/g,
  'className="h-10 rounded-xl bg-slate-50 dark:bg-[#151f32] border border-slate-200 dark:border-slate-800 px-4 text-sm font-medium text-slate-700 dark:text-slate-300 outline-none focus:border-blue-500"'
);

kanban = kanban.replace(
  /className="mt-6 border-t border-slate-800\/60"/g,
  'className="mt-6 border-t border-slate-200 dark:border-slate-800/60"'
);

kanban = kanban.replace(
  /className="border-b border-slate-800\/60 text-slate-400"/g,
  'className="border-b border-slate-200 dark:border-slate-800/60 text-slate-500 dark:text-slate-400"'
);

kanban = kanban.replace(
  /className="divide-y divide-slate-800\/60"/g,
  'className="divide-y divide-slate-200 dark:divide-slate-800/60"'
);

kanban = kanban.replace(
  /className="hover:bg-slate-800\/30 transition-colors"/g,
  'className="hover:bg-slate-50 dark:hover:bg-slate-800/30 transition-colors"'
);

kanban = kanban.replace(
  /className="font-semibold text-slate-100 group-hover:text-blue-400 transition-colors"/g,
  'className="font-semibold text-slate-900 dark:text-slate-100 group-hover:text-blue-600 dark:group-hover:text-blue-400 transition-colors"'
);

kanban = kanban.replace(
  /className=\{`inline-flex items-center px-2\.5 py-1 rounded-md text-xs font-bold \$\{member\.role === "ADMIN" \? "bg-blue-500\/10 text-blue-400" : "bg-slate-700\/50 text-slate-300"\}`\}/g,
  'className={`inline-flex items-center px-2.5 py-1 rounded-md text-xs font-bold ${member.role === "ADMIN" ? "bg-blue-100 dark:bg-blue-500/10 text-blue-700 dark:text-blue-400" : "bg-slate-100 dark:bg-slate-700/50 text-slate-600 dark:text-slate-300"}`}'
);

kanban = kanban.replace(
  /className="px-6 py-4 font-medium text-slate-300"/g,
  'className="px-6 py-4 font-medium text-slate-700 dark:text-slate-300"'
);

kanban = kanban.replace(
  /className="text-emerald-400 font-medium text-xs"/g,
  'className="text-emerald-600 dark:text-emerald-400 font-medium text-xs"'
);

fs.writeFileSync('components/project/kanban-board-tab.tsx', kanban, 'utf8');

console.log('done fixing light mode themes');
