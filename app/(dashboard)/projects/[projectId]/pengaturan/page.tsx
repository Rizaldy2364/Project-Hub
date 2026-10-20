import { notFound, redirect, forbidden } from "next/navigation";
import { auth } from "@/lib/auth";
import { getProjectMembership } from "@/lib/project-guard";
import { canEditProjectSettings } from "@/lib/permissions";
import { findProjectLabelsWithCounts } from "@/repositories/label.repository";
import { countProjectMembersByRole } from "@/repositories/team.repository";
import { SettingsNav } from "@/components/settings/settings-nav";
import { BAGIAN_TO_HASH } from "@/components/settings/settings-sections";
import { GeneralSection } from "@/components/settings/general-section";
import { KodeSection } from "@/components/settings/kode-section";
import { LabelSection } from "@/components/settings/label-section";
import { PeranSection } from "@/components/settings/peran-section";
import { BahayaSection } from "@/components/settings/bahaya-section";

interface PengaturanPageProps {
  params: Promise<{ projectId: string }>;
  searchParams: Promise<{ bagian?: string }>;
}

export default async function PengaturanPage({
  params,
  searchParams,
}: PengaturanPageProps) {
  const session = await auth();
  if (!session) redirect("/login");

  const { projectId } = await params;
  const guard = await getProjectMembership(projectId, session.user.id);
  if (!guard) notFound();
  const { project, membership } = guard;

  // Hanya ADMIN yang boleh accessing halaman Pengaturan. Cek di server
  // (lib/permissions.ts) — menyembunyikan tab saja tidak cukup. Non-ADMIN
  // mendapat 403 lewat forbidden() (boundary: ./forbidden.tsx).
  if (!canEditProjectSettings(membership.role)) {
    forbidden();
  }

  // URL lama ?bagian=umum|kode|label|peran|bahaya → redirect ke hash section
  // di halaman yang sama (satu halaman panjang dengan scroll-anchoring, tanpa
  // panel switching). Nilai tak dikenal → redirect ke URL bersih tanpa hash.
  const { bagian } = await searchParams;
  if (bagian) {
    const hash = BAGIAN_TO_HASH[bagian];
    redirect(`/projects/${projectId}/pengaturan${hash ? `#${hash}` : ""}`);
  }

  const [labels, roleSummary] = await Promise.all([
    findProjectLabelsWithCounts(projectId),
    countProjectMembersByRole(projectId),
  ]);

  const roles = [
    { role: "ADMIN", count: roleSummary.admin },
    { role: "MANAGER", count: roleSummary.manager },
    { role: "MEMBER", count: roleSummary.member },
    { role: "VIEWER", count: roleSummary.viewer },
  ];

  return (
    // Satu halaman panjang: tanpa heading besar (tab bar sudah menamai halaman)
    // dan tanpa padding horizontal tambahan — tepi konten sejajar dengan kartu
    // header project di atasnya. Menu sticky di kiri (≥1024px) / baris pil
    // sticky di bawah navbar; kolom kanan = tumpukan semua section card.
    // Padding bawah membuat section terakhir (Zona berbahaya) tetap bisa
    // di-scroll sampai judulnya menyentuh offset sticky.
    <div className="grid items-start gap-6 lg:grid-cols-[240px_1fr]">
      <SettingsNav />

      <div className="min-w-0 space-y-6 pb-[max(0px,calc(100dvh_-_124px_-_200px))] lg:pb-[max(0px,calc(100dvh_-_80px_-_200px))]">
        <GeneralSection
          projectId={projectId}
          initialName={project.name}
          initialDescription={project.description ?? ""}
          createdAt={project.createdAt.toISOString()}
        />

        <KodeSection
          projectId={projectId}
          joinCode={project.joinCode}
          joinEnabled={project.joinEnabled}
        />

        <LabelSection projectId={projectId} labels={labels} />

        <PeranSection roles={roles} />

        <BahayaSection projectId={projectId} projectName={project.name} />
      </div>
    </div>
  );
}
