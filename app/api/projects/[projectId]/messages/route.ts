import { NextResponse } from "next/server";
import { z } from "zod";
import { requireProjectMember } from "@/lib/auth-guards";
import { findProjectNameById } from "@/repositories/project.repository";
import {
  findLatestMessages,
  findMessagesAfter,
  findMessagesBefore,
  findPinnedMessage,
  findOthersMinLastReadAt,
  findMemberReadAnchor,
  findChatMembers,
} from "@/repositories/message.repository";
import { toChatMessageDTO } from "@/lib/selects/message.select";
import type { ChatMember } from "@/types";

const cursorSchema = z.string().cuid();

/**
 * GET /api/projects/[projectId]/messages — polling Diskusi.
 * - `after=<messageId>`  : pesan lebih baru dari cursor (asc).
 * - `before=<messageId>` : halaman lebih tua (lazy load ke atas).
 * - tanpa cursor         : 50 pesan terakhir + pesan tersemat + titik baca.
 * Membership dicek di server; non-member mendapat 403.
 */
export async function GET(
  req: Request,
  { params }: { params: Promise<{ projectId: string }> }
) {
  const { projectId } = await params;
  const guard = await requireProjectMember(projectId);
  if ("error" in guard) {
    return NextResponse.json(
      { error: guard.error },
      { status: guard.status }
    );
  }

  const url = new URL(req.url);
  const after = url.searchParams.get("after");
  const before = url.searchParams.get("before");

  if (after && before) {
    return NextResponse.json(
      { error: "Pakai after atau before, bukan keduanya" },
      { status: 400 }
    );
  }

  const othersMinLastReadAt = await findOthersMinLastReadAt(
    projectId,
    guard.user.id
  );

  if (after) {
    const parsed = cursorSchema.safeParse(after);
    if (!parsed.success) {
      return NextResponse.json({ error: "Cursor tidak valid" }, { status: 400 });
    }
    const rows = await findMessagesAfter(projectId, parsed.data);
    if (rows === null) {
      return NextResponse.json({ error: "Cursor tidak valid" }, { status: 400 });
    }
    return NextResponse.json({
      messages: rows.map(toChatMessageDTO),
      othersMinLastReadAt: othersMinLastReadAt?.toISOString() ?? null,
    });
  }

  if (before) {
    const parsed = cursorSchema.safeParse(before);
    if (!parsed.success) {
      return NextResponse.json({ error: "Cursor tidak valid" }, { status: 400 });
    }
    const page = await findMessagesBefore(projectId, parsed.data);
    if (page === null) {
      return NextResponse.json({ error: "Cursor tidak valid" }, { status: 400 });
    }
    return NextResponse.json({
      messages: page.messages.map(toChatMessageDTO),
      hasMoreBefore: page.hasMoreBefore,
    });
  }

  // Halaman terbaru: pesan + tersemat + anchor baca (posisi divider unread)
  // + daftar anggota & info project untuk header/popup mention.
  const [latest, pinned, readAnchor, memberRows, project] = await Promise.all([
    findLatestMessages(projectId),
    findPinnedMessage(projectId),
    findMemberReadAnchor(guard.user.id, projectId),
    findChatMembers(projectId),
    findProjectNameById({ projectId, withJoinCode: false }),
  ]);

  const members: ChatMember[] = memberRows.map((row) => ({
    id: row.user.id,
    name: row.user.name,
    avatarUrl: row.user.avatarUrl,
    role: row.role,
  }));

  return NextResponse.json({
    messages: latest.messages.map(toChatMessageDTO),
    hasMoreBefore: latest.hasMoreBefore,
    pinned: pinned ? toChatMessageDTO(pinned) : null,
    othersMinLastReadAt: othersMinLastReadAt?.toISOString() ?? null,
    readAnchor: readAnchor?.toISOString() ?? null,
    members,
    myRole: guard.membership.role,
    projectName: project?.name ?? "",
  });
}