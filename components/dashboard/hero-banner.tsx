import {
  FolderKanban,
  ClipboardList,
  CircleCheck,
  Users,
  Plus,
  KeyRound,
} from "lucide-react";
import { format } from "date-fns";
import { id as idLocale } from "date-fns/locale";
import { CreateProjectModal } from "@/components/project/create-project-modal";
import { JoinProjectModal } from "@/components/project/join-project-modal";

interface HeroBannerProps {
  name: string;
  stats: {
    projects: number;
    pendingTasks: number;
    completionRate: number;
    teammates: number;
  };
}

export function HeroBanner({ name, stats }: HeroBannerProps) {
  const firstName = name.split(" ")[0];

  const metrics = [
    { icon: FolderKanban, value: stats.projects, label: "Project Diikuti" },
    { icon: ClipboardList, value: stats.pendingTasks, label: "Task Menunggu" },
    { icon: CircleCheck, value: `${stats.completionRate}%`, label: "Task Saya Selesai" },
    { icon: Users, value: stats.teammates, label: "Rekan Tim" },
  ];

  return (
    <section className="rounded-3xl bg-gradient-to-br from-indigo-600 via-indigo-600 to-violet-700 p-6 lg:p-8 text-white shadow-sm">
      <div className="flex flex-col gap-6 lg:flex-row lg:items-start lg:justify-between">
        <div>
          <span className="inline-flex items-center gap-2 rounded-full bg-white/15 backdrop-blur-sm px-3 py-1 text-[11px] font-semibold tracking-wider uppercase">
            <span className="w-1.5 h-1.5 rounded-full bg-emerald-300" />
            Ringkasan • {format(new Date(), "d MMMM yyyy", { locale: idLocale })}
          </span>
          <h1 className="mt-4 text-2xl lg:text-3xl font-bold">
            Selamat datang kembali, {firstName}! 👋
          </h1>
          <p className="mt-2 max-w-xl text-sm lg:text-base text-white/80">
            Kelola semua project, task, dan kolaborasi tim Anda dalam satu tempat.
          </p>
        </div>

        <div className="flex flex-wrap gap-3">
          <CreateProjectModal className="inline-flex items-center gap-2 bg-white text-indigo-700 font-semibold px-4 py-2.5 rounded-xl text-sm hover:bg-indigo-50 transition-colors">
            <Plus className="w-4 h-4" />
            Project Baru
          </CreateProjectModal>
          <JoinProjectModal className="inline-flex items-center gap-2 bg-white/10 border border-white/25 text-white font-semibold px-4 py-2.5 rounded-xl text-sm backdrop-blur-sm hover:bg-white/20 transition-colors">
            <KeyRound className="w-4 h-4" />
            Gabung via Kode
          </JoinProjectModal>
        </div>
      </div>

      <div className="mt-8 grid grid-cols-2 lg:grid-cols-4 gap-3">
        {metrics.map(({ icon: Icon, value, label }) => (
          <div
            key={label}
            className="rounded-2xl bg-white/10 border border-white/15 backdrop-blur-sm p-4"
          >
            <Icon className="w-5 h-5 text-white/80 mb-3" />
            <p className="text-2xl font-bold">{value}</p>
            <p className="text-xs text-white/70 mt-0.5">{label}</p>
          </div>
        ))}
      </div>
    </section>
  );
}