import { redirect } from "next/navigation";
import { auth } from "@/lib/auth";
import { notificationTabSchema } from "@/lib/validations/notification.schema";
import {
  findNotificationsByUserId,
  countNotificationsByTab,
} from "@/repositories/notification.repository";
import { InboxView } from "@/components/inbox/inbox-view";
import type { InboxNotification, NotificationTabValue } from "@/types";

interface InboxPageProps {
  searchParams: Promise<{ tab?: string }>;
}

export default async function InboxPage({ searchParams }: InboxPageProps) {
  const session = await auth();
  if (!session) redirect("/login");

  const params = await searchParams;
  const parsedTab = notificationTabSchema.safeParse(params.tab ?? "all");
  const tab = (parsedTab.success ? parsedTab.data : "all") as NotificationTabValue;

  const [rows, counts] = await Promise.all([
    findNotificationsByUserId({ userId: session.user.id, tab, take: 20 }),
    countNotificationsByTab(session.user.id),
  ]);

  const hasMore = rows.length > 20;
  const page = hasMore ? rows.slice(0, 20) : rows;

  const initialItems: InboxNotification[] = page.map((row) => ({
    id: row.id,
    type: row.type,
    readAt: row.readAt?.toISOString() ?? null,
    createdAt: row.createdAt.toISOString(),
    actor: row.actor,
    task: row.task
      ? {
          id: row.task.id,
          title: row.task.title,
          priority: row.task.priority,
          dueDate: row.task.dueDate?.toISOString() ?? null,
          status: row.task.status,
          assignee: row.task.assignee,
          projectId: row.task.list.projectId,
        }
      : null,
    project: row.project,
    comment: row.comment
      ? {
          id: row.comment.id,
          content: row.comment.content,
          createdAt: row.comment.createdAt.toISOString(),
          author: row.comment.user,
        }
      : null,
  }));

  return (
    <div className="mx-auto max-w-6xl">
      <InboxView
        initialItems={initialItems}
        initialNextCursor={hasMore ? page[page.length - 1].id : null}
        initialCounts={counts}
        initialTab={tab}
      />
    </div>
  );
}
