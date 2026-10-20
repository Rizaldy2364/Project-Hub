import { notFound, redirect } from "next/navigation";
import { auth } from "@/lib/auth";
import { activityQuerySchema } from "@/lib/validations/activity.schema";
import { getProjectMembership } from "@/lib/project-guard";
import {
  findActivityLogs,
  findMostActiveMembers,
  summarizeActivityLast7Days,
} from "@/repositories/activity.repository";
import { findProjectMemberUsers } from "@/repositories/project.repository";
import { toActivityItem } from "@/lib/activity";
import { ActivityToolbar } from "@/components/activity/activity-toolbar";
import { ActivityFeed } from "@/components/activity/activity-feed";
import { ActivitySummaryCards } from "@/components/activity/activity-summary-cards";
import type { ActivityTypeFilterValue } from "@/types";

interface ProjectAktivitasPageProps {
  params: Promise<{ projectId: string }>;
  searchParams: Promise<Record<string, string | string[] | undefined>>;
}

/** Tab Aktivitas project: ActivityFeed difixed ke satu project. */
export default async function ProjectAktivitasPage({
  params,
  searchParams,
}: ProjectAktivitasPageProps) {
  const session = await auth();
  if (!session) redirect("/login");

  const { projectId } = await params;
  const membership = await getProjectMembership(projectId, session.user.id);
  if (!membership) notFound();

  const params_ = await searchParams;
  const parsed = activityQuerySchema.safeParse({
    type: typeof params_.type === "string" ? params_.type : undefined,
    project: projectId,
    member: typeof params_.member === "string" ? params_.member : undefined,
    range: typeof params_.range === "string" ? params_.range : undefined,
  });
  const filters = parsed.success ? parsed.data : activityQuerySchema.parse({});

  const [rows, members, summary, topMembers] = await Promise.all([
    findActivityLogs({
      userId: session.user.id,
      type: filters.type,
      project: projectId,
      member: filters.member,
      range: filters.range,
      take: 30,
    }),
    findProjectMemberUsers(projectId),
    summarizeActivityLast7Days(session.user.id, projectId),
    findMostActiveMembers(session.user.id, 3, projectId),
  ]);

  const hasMore = rows.length > 30;
  const initialRows = hasMore ? rows.slice(0, 30) : rows;

  return (
    // Tanpa heading besar (tab "Aktivitas" sudah menamai halaman) dan tanpa
    // max-w/padding tambahan — toolbar & kartu sejajar dengan tepi kartu
    // header project.
    <div className="space-y-6">
      <ActivityToolbar
        type={filters.type as ActivityTypeFilterValue}
        project={filters.project}
        member={filters.member}
        range={filters.range}
        projects={[]}
        members={members}
        showProjectDropdown={false}
      />

      <div className="grid gap-6 lg:grid-cols-[minmax(0,1fr)_320px]">
        <ActivityFeed
          key={`${filters.type}|${filters.project}|${filters.member}|${filters.range}`}
          initialItems={initialRows.map(toActivityItem)}
          initialNextCursor={hasMore ? initialRows[initialRows.length - 1].id : null}
          filters={filters}
        />
        <ActivitySummaryCards summary={summary} topMembers={topMembers} />
      </div>
    </div>
  );
}
