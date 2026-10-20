import { notFound, redirect, forbidden } from "next/navigation";
import { auth } from "@/lib/auth";
import { getProjectMembership } from "@/lib/project-guard";
import { canEditProjectSettings } from "@/lib/permissions";
import { findProjectLabelsWithCounts } from "@/repositories/label.repository";
import { countProjectMembersByRole } from "@/repositories/team.repository";
import { SettingsNav } from "@/components/settings/settings-nav";
import { isSettingsSection } from "@/components/settings/settings-sections";
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

  // Bagian aktif disimpan di URL (?bagian=umum|kode|label|peran|bahaya) supaya
  // bisa di-bookmark dan tombol back/forward browser berfungsi. Nilai tak
  // dikenal → kembali ke "umum".
  const { bagian } = await searchParams;
  const active = bagian && isSettingsSection(bagian) ? bagian : "umum";

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
    <div className="space-y-6">
      <div>
        <h1 className="text-lg font-bold text-slate-900 dark:text-white">
          Pengaturan project
        </h1>
        <p className="mt-1 text-sm text-slate-500 dark:text-[#8B96AD]">
          Kelola info project, kode gabung, label, peran anggota, dan hapus
          project.
        </p>
      </div>

      {/* Satu panel isi di kanan sesuai bagian aktif. Menu bagian di kiri
          (desktop) / baris pill di atas (mobile) — diatur SettingsNav. */}
      <div className="flex flex-col gap-4 lg:flex-row lg:items-start lg:gap-6">
        <SettingsNav projectId={projectId} active={active} />

        <div className="min-w-0 flex-1">
          {active === "umum" && (
            <GeneralSection
              projectId={projectId}
              initialName={project.name}
              initialDescription={project.description ?? ""}
              createdAt={project.createdAt.toISOString()}
            />
          )}

          {active === "kode" && (
            <KodeSection
              projectId={projectId}
              joinCode={project.joinCode}
              joinEnabled={project.joinEnabled}
            />
          )}

          {active === "label" && (
            <LabelSection projectId={projectId} labels={labels} />
          )}

          {active === "peran" && <PeranSection roles={roles} />}

          {active === "bahaya" && (
            <BahayaSection projectId={projectId} projectName={project.name} />
          )}
        </div>
      </div>
    </div>
  );
}
