const fs = require('fs');
let data = fs.readFileSync('app/(dashboard)/layout.tsx', 'utf8');

data = data.replace(
  'import { FolderKanban, KeyRound, LogOut, Plus } from "lucide-react";',
  'import { FolderKanban, KeyRound, LogOut, Plus, Search, Bell } from "lucide-react";'
);

const headerStart = data.indexOf('<header');
const headerEnd = data.indexOf('</header>') + 9;

const newHeader = `      <header className="sticky top-0 z-30 h-16 flex items-center justify-between px-4 lg:px-6 border-b border-slate-200 dark:border-zinc-800 bg-white/80 dark:bg-zinc-900/80 backdrop-blur">
        <div className="flex items-center gap-6">
          <Link href="/dashboard" className="flex items-center gap-2.5">
            <div className="w-8 h-8 rounded-lg bg-indigo-600 flex items-center justify-center">
              <FolderKanban className="w-4 h-4 text-white" />
            </div>
            <span className="font-semibold text-slate-900 dark:text-white">
              ProjectHub
            </span>
          </Link>

          {/* Search Bar - Desktop */}
          <div className="hidden lg:flex items-center relative w-80">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" />
            <input
              type="text"
              placeholder="Search tasks, projects, docs..."
              className="w-full h-9 pl-9 pr-4 rounded-full bg-slate-100 dark:bg-zinc-800 border-none text-sm focus:ring-2 focus:ring-indigo-500 text-slate-900 dark:text-white placeholder:text-slate-500 outline-none"
            />
          </div>
        </div>

        <div className="flex items-center gap-4">
          <CreateProjectModal className="hidden sm:flex items-center gap-1.5 h-9 px-4 rounded-full bg-indigo-600 hover:bg-indigo-700 text-white text-sm font-semibold transition-colors">
            <Plus className="w-4 h-4" />
            New Project
          </CreateProjectModal>

          <button className="relative w-9 h-9 rounded-full flex items-center justify-center text-slate-500 dark:text-slate-400 hover:bg-slate-100 dark:hover:bg-zinc-800 transition-colors">
            <Bell className="w-5 h-5" />
            <span className="absolute top-2 right-2 w-2 h-2 bg-red-500 rounded-full border border-white dark:border-zinc-900"></span>
          </button>

          <div className="hidden lg:flex items-center gap-3 border-l border-slate-200 dark:border-zinc-700 pl-4">
            <div className="flex flex-col items-end">
              <span className="text-sm font-bold text-slate-900 dark:text-white leading-tight">
                {user.name}
              </span>
              <span className="text-xs text-slate-500 dark:text-slate-400">
                Lead Architect
              </span>
            </div>
            <Link href="/profile" title="Profil Saya">
              <UserAvatar name={user.name} image={"avatarUrl" in user ? user.avatarUrl : user.image} size="sm" />
            </Link>
          </div>

          {/* Fallback layar kecil */}
          <div className="flex items-center gap-2 lg:hidden">
            <Link href="/profile" title="Profil Saya">
              <UserAvatar name={user.name} image={"avatarUrl" in user ? user.avatarUrl : user.image} size="sm" />
            </Link>
            <form action={logoutAction}>
              <button
                type="submit"
                title="Keluar"
                className="w-8 h-8 rounded-lg flex items-center justify-center border border-slate-200 dark:border-zinc-800 text-slate-600 dark:text-slate-300 hover:bg-slate-50 dark:hover:bg-zinc-800 transition-colors"
              >
                <LogOut className="w-4 h-4" />
              </button>
            </form>
          </div>

          <ThemeToggle />
        </div>
      </header>`;

data = data.substring(0, headerStart) + newHeader + data.substring(headerEnd);
fs.writeFileSync('app/(dashboard)/layout.tsx', data);
console.log('done');
