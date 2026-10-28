import { redirect } from "next/navigation";
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
      <ProfileHeaderCard
        name={user.name}
        email={user.email}
        image={user.avatarUrl}
        coverGradient={user.coverGradient}
        projectCount={metrics.projectCount}
        adminRoleCount={metrics.adminRoleCount}
        headline={user.headline}
        location={user.location}
      />
      <ProfileDetails
        name={user.name}
        email={user.email}
        bio={user.bio}
        projects={metrics.projects}
        headline={user.headline}
        company={user.company}
        location={user.location}
        website={user.website}
        githubUrl={user.githubUrl}
        linkedinUrl={user.linkedinUrl}
        birthDate={user.birthDate ? user.birthDate.toISOString() : null}
        gender={user.gender}
        skills={user.skills}
        languages={user.languages}
      />
    </div>
  );
}
