import { redirect } from "next/navigation";
import { auth } from "@/lib/auth";
import {
  listMembersQuerySchema,
  memberPageSizeSchema,
  memberRoleFilterSchema,
  memberSortSchema,
} from "@/lib/validations/team.schema";
import {
  findProjectsForMemberDropdown,
  findProjectMembers,
  countProjectMembersByRole,
} from "@/repositories/team.repository";
import { findProjectMember } from "@/repositories/project.repository";
import { prisma } from "@/lib/prisma";
import { TeamView } from "@/components/team/team-view";

interface TeamPageProps {
  searchParams: Promise<{
    project?: string;
    role?: string;
    q?: string;
    sort?: string;
    page?: string;
    pageSize?: string;
  }>;
}

export default async function TeamPage({ searchParams }: TeamPageProps) {
  const session = await auth();
  if (!session) redirect("/login");

  const params = await searchParams;
  const projects = await findProjectsForMemberDropdown(session.user.id);

  const projectId =
    params.project && projects.some((p) => p.id === params.project)
      ? params.project
      : (projects[0]?.id ?? null);

  if (!projectId) {
    return (
      <div className="mx-auto max-w-6xl">
        <TeamView
          projects={[]}
          projectId={null}
          projectName={null}
          joinCode={null}
          myRole={null}
          myUserId={session.user.id}
          initialMembers={[]}
          initialTotal={0}
          initialSummary={{ total: 0, admin: 0, deputy: 0, member: 0 }}
          initialQuery={{
            role: "all",
            q: "",
            sort: "joined_desc",
            page: 1,
            pageSize: 10,
          }}
        />
      </div>
    );
  }

  const parsedRole = memberRoleFilterSchema.safeParse(params.role ?? "all");
  const parsedSort = memberSortSchema.safeParse(params.sort ?? "joined_desc");
  const parsedSize = memberPageSizeSchema.safeParse(params.pageSize ?? "10");
  const page = Math.max(1, Number.parseInt(params.page ?? "1", 10) || 1);

  const query = listMembersQuerySchema.parse({
    projectId,
    role: parsedRole.success ? parsedRole.data : "all",
    q: params.q ?? "",
    sort: parsedSort.success ? parsedSort.data : "joined_desc",
    page,
    pageSize: parsedSize.success ? parsedSize.data : 10,
  });

  const membership = await findProjectMember(session.user.id, projectId);
  if (!membership) redirect("/dashboard");

  const [result, summary, project] = await Promise.all([
    findProjectMembers(query),
    countProjectMembersByRole(projectId),
    prisma.project.findUnique({
      where: { id: projectId, deletedAt: null },
      select: { name: true, joinCode: true },
    }),
  ]);

  return (
    <div className="mx-auto max-w-6xl">
      <TeamView
        projects={projects}
        projectId={projectId}
        projectName={project?.name ?? ""}
        joinCode={membership.role === "ADMIN" ? (project?.joinCode ?? null) : null}
        myRole={membership.role}
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
      />
    </div>
  );
}
