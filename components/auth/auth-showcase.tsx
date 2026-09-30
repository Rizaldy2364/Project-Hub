"use client";

import { useState, useEffect } from "react";
import { FolderKanban, Users, Tags } from "lucide-react";

const slides = [
  {
    icon: FolderKanban,
    title: "Kanban Board Tanpa Ribet",
    description:
      "Visualisasikan alur kerja, pindahkan task dengan mudah, dan tingkatkan produktivitas tim secara real-time.",
    gradient: "from-indigo-600 via-indigo-700 to-slate-900",
  },
  {
    icon: Users,
    title: "Onboarding Tim Instan",
    description:
      "Undang rekan tim langsung pakai kode join 8-karakter, tanpa setup yang ribet.",
    gradient: "from-emerald-600 via-teal-700 to-zinc-900",
  },
  {
    icon: Tags,
    title: "Manajemen Task Cerdas",
    description:
      "Atur deadline, label berwarna, dan diskusi terstruktur langsung di setiap task.",
    gradient: "from-violet-600 via-purple-700 to-slate-950",
  },
];

export function AuthShowcase() {
  const [activeIndex, setActiveIndex] = useState(0);

  useEffect(() => {
    const interval = setInterval(() => {
      setActiveIndex((prev) => (prev + 1) % slides.length);
    }, 10000);
    return () => clearInterval(interval);
  }, []);

  const active = slides[activeIndex];
  const ActiveIcon = active.icon;

  function goToSlide(index: number) {
    setActiveIndex(index);
  }

  return (
    <div className="hidden lg:flex">
      <div
        className={`w-full h-full p-10 xl:p-12 relative overflow-hidden flex flex-col bg-gradient-to-br transition-colors duration-1000 ${active.gradient}`}
      >
        {/* Brand */}
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 rounded-xl bg-white flex items-center justify-center shadow-sm">
            <FolderKanban className="w-5 h-5 text-indigo-600" />
          </div>
          <span className="text-white font-bold text-lg tracking-tight">ProjectHub</span>
        </div>

        {/* Spacer atas — dorong konten ke bawah */}
        <div className="flex-1" />

        {/* Icon Badge + Teks — dikelompokkan, posisi bawah-tengah */}
        <div key={activeIndex} className="animate-slide-up">
          <div className="w-16 h-16 rounded-2xl bg-white/15 backdrop-blur-sm flex items-center justify-center mb-8">
            <ActiveIcon className="w-8 h-8 text-white" />
          </div>

          <p className="text-white/70 text-xs font-semibold tracking-widest uppercase mb-5">
            Kerja Tim, Disederhanakan
          </p>
          <h2 className="text-white text-4xl xl:text-5xl font-bold mb-5 leading-tight">
            {active.title}
          </h2>
          <p className="text-white/75 text-base leading-relaxed max-w-xs">
            {active.description}
          </p>
        </div>

        {/* Spacer bawah */}
        <div className="flex-1" />

        {/* Progress Indicator — bisa diklik */}
        <div className="flex gap-2">
          {slides.map((_, index) => (
            <button
              key={index}
              onClick={() => goToSlide(index)}
              aria-label={`Lihat informasi ${index + 1}`}
              className={`h-1.5 rounded-full transition-all duration-500 cursor-pointer hover:bg-white/60 ${
                index === activeIndex ? "w-8 bg-white" : "w-1.5 bg-white/30"
              }`}
            />
          ))}
        </div>
      </div>
    </div>
  );
}