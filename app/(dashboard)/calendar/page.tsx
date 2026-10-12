import { redirect } from "next/navigation";
import { auth } from "@/lib/auth";
import { findCalendarTasksByUserId } from "@/repositories/task.repository";
import { CalendarHeader } from "@/components/calendar/calendar-header";
import { CalendarBoard } from "@/components/calendar/calendar-board";

export default async function CalendarPage() {
  const session = await auth();
  if (!session) redirect("/login");

  const tasks = await findCalendarTasksByUserId(session.user.id);

  return (
    <div className="mx-auto max-w-6xl space-y-6">
      <CalendarHeader total={tasks.length} />
      <CalendarBoard tasks={tasks} />
    </div>
  );
}