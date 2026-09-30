import { redirect } from "next/navigation";
import Link from "next/link";
import { ArrowLeft } from "lucide-react";
import { auth } from "@/lib/auth";
import { getProfileProjectMetrics } from "@/repositories/project.repository";
import { findProfileUserById } from "@/repositories/user.repository";
import { ProfileHeaderCard } from "@/components/profile/profile-header-card";
import { ProfileDetails } from "@/components/profile/profile-details";

export default async function ProfilePage() {
  const session = await auth();
  if (!session) redirect("/login");

  const [metrics, user] = await Promise.all([
    getProfileProjectMetrics(session.user.id),
    findProfileUserById(session.user.id),
  ]);
  if (!user) redirect("/login");

  return (
    <div className="mx-auto max-w-6xl space-y-5">
      <Link
        href="/dashboard"
        className="inline-flex items-center gap-2 rounded-xl border border-slate-200 bg-white px-3.5 py-2.5 text-sm font-semibold text-slate-700 shadow-sm transition-colors hover:bg-slate-50 dark:border-zinc-800 dark:bg-zinc-900 dark:text-zinc-200 dark:hover:bg-zinc-800 lg:hidden"
      >
        <ArrowLeft className="h-4 w-4" />
        Back to Dashboard
      </Link>
      <ProfileHeaderCard
        name={user.name}
        email={user.email}
        image={user.avatarUrl}
        coverGradient={user.coverGradient}
        projectCount={metrics.projectCount}
        adminRoleCount={metrics.adminRoleCount}
      />
      <ProfileDetails name={user.name} email={user.email} bio={user.bio} projects={metrics.projects} />
    </div>
  );
}
