import { notFound, redirect } from "next/navigation";
import { auth } from "@/lib/auth";
import { getProjectMembership } from "@/lib/project-guard";
import { canSendChatMessage } from "@/lib/permissions";
import { ChatPanel } from "@/components/chat/chat-panel";

interface ProjectDiskusiPageProps {
  params: Promise<{ projectId: string }>;
}

/** Tab Diskusi project: ChatPanel lebar penuh (tanpa daftar percakapan). */
export default async function ProjectDiskusiPage({
  params,
}: ProjectDiskusiPageProps) {
  const session = await auth();
  if (!session) redirect("/login");

  const { projectId } = await params;
  const membership = await getProjectMembership(projectId, session.user.id);
  if (!membership) notFound();
  const myRole = membership.membership.role;

  return (
    <div
      className="-m-4 min-h-[520px] h-[calc(100dvh_-_4rem_-_56px)] p-4 lg:-m-8 lg:min-h-[600px] lg:h-[calc(100dvh_-_4rem_-_72px)] lg:p-6 overflow-hidden"
    >
      <ChatPanel
        projectId={projectId}
        currentUserId={session.user.id}
        readOnly={!canSendChatMessage(myRole)}
      />
    </div>
  );
}
