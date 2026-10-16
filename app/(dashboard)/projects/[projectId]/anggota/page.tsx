import { notFound, redirect } from "next/navigation";
import { auth } from "@/lib/auth";
import { getProjectMembership } from "@/lib/project-guard";
import { canViewJoinCode } from "@/lib/permissions";
import { listMembersQuerySchema } from "@/lib/validations/team.schema";
import {
  findProjectMembers,
  countProjectMembersByRole,
} from "@/repositories/team.repository";
import { TeamView } from "@/components/team/team-view";

interface ProjectAnggotaPageProps {
  params: Promise<{ projectId: string }>;
}

/** Tab Anggota project: komponen Tim & Anggota yang difixed ke satu project. */
export default async function ProjectAnggotaPage({
  params,
}: ProjectAnggotaPageProps) {
  const session = await auth();
  if (!session) redirect("/login");

  const { projectId } = await params;
  const guard = await getProjectMembership(projectId, session.user.id);
  if (!guard) notFound();
  const { project } = guard;
  const myRole = guard.membership.role;
  const canViewCode = canViewJoinCode(myRole);

  // Halaman ini tanpa searchParams — seed daftar dengan query default agar
  // tabel tidak kosong sesaat sebelum TeamView memuat (pola sama dgn /tim).
  const query = listMembersQuerySchema.parse({ projectId: project.id });
  const [result, summary] = await Promise.all([
    findProjectMembers(query),
    countProjectMembersByRole(project.id),
  ]);

  return (
    <div className="space-y-6">
      <TeamView
        projects={[{ id: project.id, name: project.name }]}
        projectId={project.id}
        projectName={project.name}
        joinCode={canViewCode ? project.joinCode : undefined}
        myRole={myRole}
        myUserId={session.user.id}
        initialMembers={result.members}
        initialTotal={result.total}
        initialSummary={summary}
        initialQuery={{
          role: query.role,
          q: query.q,
          sort: query.sort,
          page: query.page,
          pageSize: query.pageSize,
        }}
        showProjectDropdown={false}
      />
    </div>
  );
}
