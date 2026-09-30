import Link from "next/link";
import { redirect } from "next/navigation";
import { FolderKanban, KeyRound, LogOut, Plus, Search, Bell } from "lucide-react";
import { auth } from "@/lib/auth";
import { logoutAction } from "@/actions/user.actions";
import { ThemeToggle } from "@/components/ui/theme-toggle";
import { UserAvatar } from "@/components/ui/user-avatar";
import { SidebarNav } from "@/components/layout/sidebar-nav";
import { SidebarUser } from "@/components/layout/sidebar-user";
import { CreateProjectModal } from "@/components/project/create-project-modal";
import { JoinProjectModal } from "@/components/project/join-project-modal";
import { findProfileUserById } from "@/repositories/user.repository";

export default async function DashboardLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const session = await auth();
  if (!session) redirect("/login");
  const profileUser = await findProfileUserById(session.user.id);
  const user = profileUser ?? session.user;

  return (
    <div className="min-h-screen bg-slate-50 dark:bg-slate-950">
      {/* Top Navbar */}
            <header className="sticky top-0 z-30 h-16 flex items-center justify-between px-4 lg:px-6 border-b border-slate-200 dark:border-slate-800 bg-white/80 dark:bg-slate-900/80 backdrop-blur">
        <div className="flex items-center">
          <Link href="/dashboard" className="flex items-center gap-2.5 w-[200px] shrink-0">
            <div className="w-8 h-8 rounded-lg bg-blue-600 flex items-center justify-center">
              <FolderKanban className="w-4 h-4 text-white" />
            </div>
            <span className="font-semibold text-slate-900 dark:text-white">
              ProjectHub
            </span>
          </Link>

          {/* Search Bar - Desktop */}
          <div className="hidden lg:flex items-center relative w-[320px] lg:w-[420px] ml-4 lg:ml-8">
            <Search className="absolute left-3.5 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" />
            <input
              type="text"
              placeholder="Search tasks, projects, docs..."
              className="w-full h-9 pl-10 pr-4 rounded-full bg-slate-100 dark:bg-slate-800/80 border border-transparent dark:border-white/5 text-sm focus:bg-white focus:border-blue-500/50 focus:ring-2 focus:ring-blue-500/20 text-slate-900 dark:text-slate-200 placeholder:text-slate-500 dark:placeholder:text-slate-400 outline-none transition-all"
            />
          </div>
        </div>

        <div className="flex items-center gap-4">
          <CreateProjectModal className="hidden sm:flex items-center gap-1.5 h-9 px-4 rounded-full bg-blue-600 hover:bg-blue-700 text-white text-sm font-semibold transition-colors">
            <Plus className="w-4 h-4" />
            New Project
          </CreateProjectModal>

          <button className="relative w-9 h-9 rounded-full flex items-center justify-center text-slate-500 dark:text-slate-400 hover:bg-slate-100 dark:hover:bg-slate-800 transition-colors">
            <Bell className="w-5 h-5" />
            <span className="absolute top-2 right-2 w-2 h-2 bg-red-500 rounded-full border border-white dark:border-slate-900"></span>
          </button>


          <ThemeToggle />
        </div>
      </header>

      <div className="flex">
        {/* Sidebar */}
        <aside className="hidden lg:flex w-56 shrink-0 flex-col sticky top-16 h-[calc(100vh-4rem)] border-r border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900">
          <div className="flex-1 overflow-y-auto p-4 space-y-6">
            <SidebarNav />
          </div>

          <SidebarUser name={user.name} email={user.email} image={"avatarUrl" in user ? user.avatarUrl : user.image} />
        </aside>

        <main className="flex-1 min-w-0 p-4 lg:p-8">{children}</main>
      </div>
    </div>
  );
}
