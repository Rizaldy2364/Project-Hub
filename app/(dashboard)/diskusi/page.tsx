import { redirect } from "next/navigation";
import { auth } from "@/lib/auth";
import { getDiscussionSummaries } from "@/lib/discussions";
import { DiscussionsView } from "@/components/chat/discussions-view";

interface DiskusiPageProps {
  searchParams: Promise<{ project?: string; message?: string }>;
}

export default async function DiskusiPage({ searchParams }: DiskusiPageProps) {
  const session = await auth();
  if (!session) redirect("/login");

  const params = await searchParams;
  const items = await getDiscussionSummaries(session.user.id);

  // Project terpilih dari URL ?project=; validasi termasuk anggota project
  // (ringkasan hanya memuat project yang diikuti user). Default = percakapan
  // terbaru (items sudah urut aktivitas terakhir).
  const requested = params.project ?? null;
  const selectedId =
    requested && items.some((i) => i.projectId === requested)
      ? requested
      : (items[0]?.projectId ?? null);

  // ?message= dari Inbox — hanya valid bila projectnya terpilih.
  const highlightMessageId =
    params.message && selectedId === requested ? params.message : null;

  return (
    // OVERRIDE SPASIAL KHUSUS RUTE /diskusi (satu-satunya tempat):
    // border-box layout dashboard memaksa `main` berpadding p-4 lg:p-8 (16/32px)
    // yang membuat jarak kartu tidak simetris. Wrapper ini MENGHAPUS padding
    // main lewat margin negatif (-m-4 / -m-8), lalu menambahkan jaraknya sendiri
    // (16px mobile, 24px desktop) lewat padding — tanpa mengubah halaman lain.
    // Tinggi = 100dvh − navbar (4rem) sehingga kartu pas mengisi sisa viewport
    // (24px atas + 24px bawah = 48px ikut terhitung di padding wrapper).
    <div className="-m-4 h-[calc(100dvh_-_4rem)] min-h-[592px] p-4 lg:-m-8 lg:min-h-[608px] lg:p-6">
      <DiscussionsView
        initialItems={items}
        initialSelectedId={selectedId}
        initialHighlightMessageId={highlightMessageId}
        currentUserId={session.user.id}
      />
    </div>
  );
}