import { redirect } from "next/navigation";
import { auth } from "@/lib/auth";
import { activityQuerySchema } from "@/lib/validations/activity.schema";
import {
  findActivityLogs,
  findMostActiveMembers,
  findSharedProjectUsers,
  summarizeActivityLast7Days,
} from "@/repositories/activity.repository";
import { findProjectsForMemberDropdown } from "@/repositories/team.repository";
import { findProjectMemberUsers } from "@/repositories/project.repository";
import { toActivityItem } from "@/lib/activity";
import { ActivityToolbar } from "@/components/activity/activity-toolbar";
import { ActivityFeed } from "@/components/activity/activity-feed";
import { ActivitySummaryCards } from "@/components/activity/activity-summary-cards";
import { ActivityError } from "@/components/activity/activity-states";

interface AktivitasPageProps {
  searchParams: Promise<Record<string, string | string[] | undefined>>;
}

export default async function AktivitasPage({ searchParams }: AktivitasPageProps) {
  const session = await auth();
  if (!session) redirect("/login");

  const params = await searchParams;
  // Semua filter divalidasi Zod; nilai asing/tidak valid jatuh ke default.
  const parsed = activityQuerySchema.safeParse({
    type: typeof params.type === "string" ? params.type : undefined,
    project: typeof params.project === "string" ? params.project : undefined,
    member: typeof params.member === "string" ? params.member : undefined,
    range: typeof params.range === "string" ? params.range : undefined,
  });
  const filters = parsed.success ? parsed.data : activityQuerySchema.parse({});

  let data: {
    items: ReturnType<typeof toActivityItem>[];
    nextCursor: string | null;
    projects: { id: string; name: string }[];
    members: { id: string; name: string; avatarUrl: string | null }[];
    summary: Awaited<ReturnType<typeof summarizeActivityLast7Days>>;
    topMembers: Awaited<ReturnType<typeof findMostActiveMembers>>;
  };

  try {
    // Jika project terpilih, ambil member hanya dari project tsb; jika
    // "Semua project", ambil semua member yang berbagi project dengan user.
    const membersPromise = filters.project
      ? findProjectMemberUsers(filters.project)
      : findSharedProjectUsers(session.user.id);

    // Scope keamanan: repository hanya mengembalikan log project yang diikuti
    // user; ID project/member asing diabaikan (menghasilkan feed kosong).
    const [rows, projects, members, summary, topMembers] = await Promise.all([
      findActivityLogs({
        userId: session.user.id,
        type: filters.type,
        project: filters.project,
        member: filters.member,
        range: filters.range,
        take: 30,
      }),
      findProjectsForMemberDropdown(session.user.id),
      membersPromise,
      summarizeActivityLast7Days(session.user.id),
      findMostActiveMembers(session.user.id, 3),
    ]);

    const hasMore = rows.length > 30;
    const initialRows = hasMore ? rows.slice(0, 30) : rows;
    data = {
      items: initialRows.map(toActivityItem),
      nextCursor: hasMore ? initialRows[initialRows.length - 1].id : null,
      projects,
      members,
      summary,
      topMembers,
    };
  } catch (error) {
    console.error("[aktivitas] gagal memuat feed:", error);
    return (
      <div className="mx-auto max-w-6xl space-y-6">
        <div>
          <h1 className="text-2xl font-bold text-slate-900 dark:text-white">Aktivitas</h1>
          <p className="mt-1 text-sm text-slate-500 dark:text-[#8B96AD]">
            Riwayat kejadian di semua project yang kamu ikuti.
          </p>
        </div>
        <ActivityError message="Gagal memuat aktivitas. Coba lagi." />
      </div>
    );
  }

  return (
    <div className="mx-auto max-w-6xl space-y-6">
      <div>
        <h1 className="text-2xl font-bold text-slate-900 dark:text-white">Aktivitas</h1>
        <p className="mt-1 text-sm text-slate-500 dark:text-[#8B96AD]">
          Riwayat kejadian di semua project yang kamu ikuti.
        </p>
      </div>

      <ActivityToolbar
        type={filters.type}
        project={filters.project}
        member={filters.member}
        range={filters.range}
        projects={data.projects}
        members={data.members}
      />

      <div className="grid gap-6 lg:grid-cols-[minmax(0,1fr)_320px]">
        <ActivityFeed
          key={`${filters.type}|${filters.project}|${filters.member}|${filters.range}`}
          initialItems={data.items}
          initialNextCursor={data.nextCursor}
          filters={filters}
        />
        <ActivitySummaryCards summary={data.summary} topMembers={data.topMembers} />
      </div>
    </div>
  );
}
