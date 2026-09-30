import Link from "next/link";
import { redirect } from "next/navigation";
import { FolderKanban, KeyRound, LogOut, Plus } from "lucide-react";
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
    <div className="min-h-screen bg-slate-50 dark:bg-zinc-950">
      {/* Top Navbar */}
      <header className="sticky top-0 z-30 h-16 flex items-center justify-between px-4 lg:px-6 border-b border-slate-200 dark:border-zinc-800 bg-white/80 dark:bg-zinc-900/80 backdrop-blur">
        <Link href="/dashboard" className="flex items-center gap-2.5">
          <div className="w-8 h-8 rounded-lg bg-indigo-600 flex items-center justify-center">
            <FolderKanban className="w-4 h-4 text-white" />
          </div>
          <span className="font-semibold text-slate-900 dark:text-white">
            ProjectHub
          </span>
        </Link>

        <div className="flex items-center gap-3">
          {/* Fallback layar kecil: sidebar tersembunyi di bawah lg */}
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
      </header>

      <div className="flex">
        {/* Sidebar */}
        <aside className="hidden lg:flex w-64 shrink-0 flex-col sticky top-16 h-[calc(100vh-4rem)] border-r border-slate-200 dark:border-zinc-800 bg-white dark:bg-zinc-900">
          <div className="flex-1 overflow-y-auto p-4 space-y-6">
            <div className="space-y-2">
              <CreateProjectModal className="w-full flex items-center justify-center gap-2 bg-indigo-600 text-white px-4 py-2.5 rounded-xl text-sm font-medium hover:bg-indigo-700 transition-colors">
                <Plus className="w-4 h-4" />
                Buat Project
              </CreateProjectModal>
              <JoinProjectModal className="w-full flex items-center justify-center gap-2 border border-slate-200 dark:border-zinc-700 bg-slate-50 dark:bg-zinc-800/50 text-slate-700 dark:text-slate-300 px-4 py-2.5 rounded-xl text-sm font-medium hover:bg-slate-100 dark:hover:bg-zinc-800 transition-colors">
                <KeyRound className="w-4 h-4" />
                Gabung via Kode
              </JoinProjectModal>
            </div>
            <SidebarNav />
          </div>

          <SidebarUser name={user.name} email={user.email} image={"avatarUrl" in user ? user.avatarUrl : user.image} />
        </aside>

        <main className="flex-1 min-w-0 p-4 lg:p-8">{children}</main>
      </div>
    </div>
  );
}
