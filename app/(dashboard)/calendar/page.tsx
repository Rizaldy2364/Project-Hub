import { redirect } from "next/navigation";
import { auth } from "@/lib/auth";
import { calendarQuerySchema } from "@/lib/validations/task.schema";
import { findCalendarTasksByUserId } from "@/repositories/task.repository";
import { findProjectOptionsByUserId } from "@/repositories/project.repository";
import { CalendarHeader } from "@/components/calendar/calendar-header";
import { CalendarBoard } from "@/components/calendar/calendar-board";

interface CalendarPageProps {
  searchParams: Promise<{ project?: string }>;
}

export default async function CalendarPage({ searchParams }: CalendarPageProps) {
  const session = await auth();
  if (!session) redirect("/login");

  const params = await searchParams;
  const parsed = calendarQuerySchema.safeParse({ project: params.project ?? "" });
  const requestedProject = parsed.success ? parsed.data.project : "";

  const projects = await findProjectOptionsByUserId(session.user.id);

  // Hanya project yang benar-benar diikuti user yang boleh jadi filter
  // (parameter asing diabaikan, bukan error).
  const activeProjectId =
    requestedProject && projects.some((p) => p.id === requestedProject)
      ? requestedProject
      : "";

  const tasks = await findCalendarTasksByUserId({
    userId: session.user.id,
    ...(activeProjectId ? { projectId: activeProjectId } : {}),
  });

  return (
    <div className="mx-auto max-w-6xl space-y-6">
      <CalendarHeader total={tasks.length} />
      <CalendarBoard
        tasks={tasks}
        projects={projects}
        activeProjectId={activeProjectId}
      />
    </div>
  );
}