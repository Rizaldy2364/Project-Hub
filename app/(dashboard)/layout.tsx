import Link from "next/link";
import { redirect } from "next/navigation";
import { FolderKanban } from "lucide-react";
import { auth } from "@/lib/auth";
import { NotifBellDropdown } from "@/components/notifications/notif-bell";
import { UnreadCountProvider } from "@/components/notifications/unread-provider";
import { ThemeToggle } from "@/components/ui/theme-toggle";
import { SidebarNav } from "@/components/layout/sidebar-nav";
import { SidebarUser } from "@/components/layout/sidebar-user";
import { TopBarSearch } from "@/components/search/topbar-search";
import { MobileNav } from "@/components/layout/mobile-nav";
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
      {/* Satu sumber kebenaran angka belum dibaca: lonceng top bar + badge Inbox. */}
      <UnreadCountProvider>
      {/* Top Navbar */}
      <header className="sticky top-0 z-30 h-16 flex items-center justify-between px-4 lg:px-6 border-b border-slate-200 dark:border-slate-800 bg-white/80 dark:bg-slate-900/80 backdrop-blur">
        <div className="flex items-center">
          <MobileNav
            name={user.name}
            email={user.email}
            image={"avatarUrl" in user ? user.avatarUrl : user.image}
          />
          <Link href="/dashboard" className="hidden lg:flex items-center gap-2.5 w-[200px] shrink-0">
            <div className="w-8 h-8 rounded-lg bg-blue-600 flex items-center justify-center">
              <FolderKanban className="w-4 h-4 text-white" />
            </div>
            <span className="font-semibold text-slate-900 dark:text-white">
              ProjectHub
            </span>
          </Link>

          {/* Search Bar - Desktop */}
          <div className="hidden lg:flex items-center relative w-[320px] lg:w-[420px] ml-4 lg:ml-8">
            <TopBarSearch />
          </div>
        </div>

        <div className="flex items-center gap-4">
          <NotifBellDropdown />




          <ThemeToggle />
        </div>
      </header>

      <div className="flex">
        {/* Sidebar */}
        <aside className="hidden lg:flex w-56 shrink-0 flex-col sticky top-16 h-[calc(100vh-4rem)] border-r border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900">
          <div className="flex-1 min-h-0 overflow-y-auto p-4 [scrollbar-width:thin]">
            <SidebarNav />
          </div>

          <SidebarUser name={user.name} email={user.email} image={"avatarUrl" in user ? user.avatarUrl : user.image} />
        </aside>

        <main className="flex-1 min-w-0 p-4 lg:p-8">{children}</main>
      </div>
      </UnreadCountProvider>
    </div>
  );
}
