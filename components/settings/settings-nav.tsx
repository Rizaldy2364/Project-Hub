"use client";

import { useEffect, useRef, useState } from "react";
import { cn } from "@/lib/utils";
import {
  SETTINGS_SECTIONS,
  isSettingsSectionId,
  type SettingsSectionId,
} from "@/components/settings/settings-sections";

/**
 * Offset sticky top navbar aplikasi: h-16 = 64px (header di
 * app/(dashboard)/layout.tsx) + 16px jarak. Section memakai scroll-margin-top
 * yang sama (lihat SettingsPanel) agar judul mendarat tepat di bawah navbar
 * sticky (desktop) atau baris pil (mobile).
 */
const STICKY_OFFSET_DESKTOP = 80; // 64px navbar + 16px
const STICKY_OFFSET_MOBILE = 124; // 64px navbar + 60px baris pil

function stickyOffset() {
  return window.innerWidth >= 1024
    ? STICKY_OFFSET_DESKTOP
    : STICKY_OFFSET_MOBILE;
}

/**
 * Menu bagian Pengaturan: kartu sticky di kiri (≥1024px) atau baris pil
 * horizontal yang sticky tepat di bawah navbar (<1024px). Setiap item adalah
 * <a href="#id">: klik di-preventDefault, section di-smooth-scroll (otomatis
 * instan bila prefers-reduced-motion), hash di-update lewat history.replaceState
 * (tanpa history entry baru), dan fokus pindah ke judul section (tabindex -1).
 */
export function SettingsNav() {
  const [active, setActive] = useState<SettingsSectionId>("umum");
  const pillsRef = useRef<HTMLDivElement>(null);

  // Scroll-spy: section terakhir yang top-nya melewati offset jadi aktif; saat
  // halaman mentok di bawah, section TERAKHIR selalu aktif meski pendek.
  useEffect(() => {
    let rafId = 0;
    function compute() {
      rafId = 0;
      const atBottom =
        window.innerHeight + window.scrollY >=
        document.documentElement.scrollHeight - 4;
      if (atBottom) {
        setActive(SETTINGS_SECTIONS[SETTINGS_SECTIONS.length - 1].key);
        return;
      }
      const threshold = stickyOffset() + 8;
      let current: SettingsSectionId = SETTINGS_SECTIONS[0].key;
      for (const { key } of SETTINGS_SECTIONS) {
        const el = document.getElementById(key);
        if (el && el.getBoundingClientRect().top <= threshold) current = key;
      }
      setActive(current);
    }
    function onScroll() {
      if (rafId === 0) rafId = window.requestAnimationFrame(compute);
    }
    compute();
    window.addEventListener("scroll", onScroll, { passive: true });
    window.addEventListener("resize", onScroll);
    return () => {
      window.removeEventListener("scroll", onScroll);
      window.removeEventListener("resize", onScroll);
      if (rafId !== 0) window.cancelAnimationFrame(rafId);
    };
  }, []);

  // Muat dengan hash (mis. reload /pengaturan#label): gulir ke section itu
  // setelah mount — tanpa flash dan tanpa potensi mismatch hidrasi.
  /* eslint-disable react-hooks/set-state-in-effect */
  useEffect(() => {
    const hash = window.location.hash.slice(1);
    if (!isSettingsSectionId(hash)) return;
    const el = document.getElementById(hash);
    if (!el) return;
    el.scrollIntoView({ behavior: "auto", block: "start" });
    setActive(hash);
  }, []);
  /* eslint-enable react-hooks/set-state-in-effect */

  // Baris pil (<1024px): atur HANYA scrollLeft wadah agar pill aktif terlihat.
  // Jangan pakai scrollIntoView — ia ikut menggulir window.
  useEffect(() => {
    const container = pillsRef.current;
    if (!container) return;
    const el = container.querySelector<HTMLElement>(
      `[data-nav-item="${active}"]`
    );
    if (!el) return;
    const elRect = el.getBoundingClientRect();
    const containerRect = container.getBoundingClientRect();
    if (elRect.left < containerRect.left) {
      container.scrollLeft += elRect.left - containerRect.left;
    } else if (elRect.right > containerRect.right) {
      container.scrollLeft += elRect.right - containerRect.right;
    }
  }, [active]);

  function handleClick(
    e: React.MouseEvent<HTMLAnchorElement>,
    id: SettingsSectionId
  ) {
    e.preventDefault();
    const el = document.getElementById(id);
    if (!el) return;
    const reduced = window.matchMedia("(prefers-reduced-motion: reduce)").matches;
    el.scrollIntoView({ behavior: reduced ? "auto" : "smooth", block: "start" });
    if (window.location.hash !== `#${id}`) {
      history.replaceState(null, "", `#${id}`);
    }
    setActive(id);
    // Pindahkan fokus ke judul section (tabindex -1) untuk pembaca layar.
    el.querySelector<HTMLElement>("[data-section-heading]")?.focus({
      preventScroll: true,
    });
  }

  return (
    <nav
      aria-label="Bagian pengaturan"
      className="sticky top-16 z-20 -mx-4 w-[calc(100%+2rem)] min-w-0 bg-slate-50/95 px-4 py-2 backdrop-blur dark:bg-slate-950/95 lg:top-20 lg:z-auto lg:mx-0 lg:w-auto lg:self-start lg:bg-transparent lg:px-0 lg:py-0 lg:backdrop-blur-none"
    >
      <div
        ref={pillsRef}
        className="scrollbar-hide flex w-full min-w-0 touch-pan-x gap-2 overflow-x-scroll overscroll-x-contain pb-1 lg:block lg:space-y-1 lg:overflow-visible lg:rounded-2xl lg:border lg:border-slate-200 lg:bg-white lg:p-2 lg:pb-2 lg:shadow-sm dark:lg:border-white/[0.08] dark:lg:bg-[#131A2B]"
      >
        {SETTINGS_SECTIONS.map((section) => {
          const Icon = section.icon;
          const selected = section.key === active;
          const danger = section.key === "zona-berbahaya";
          return (
            <a
              key={section.key}
              href={`#${section.key}`}
              data-nav-item={section.key}
              aria-current={selected ? "location" : undefined}
              onClick={(e) => handleClick(e, section.key)}
              className={cn(
                "flex h-11 shrink-0 items-center gap-2.5 whitespace-nowrap rounded-xl px-3.5 text-sm transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-blue-500 lg:w-full",
                selected
                  ? danger
                    ? "bg-red-500/10 font-semibold text-red-600 dark:text-red-400"
                    : "bg-[rgba(79,124,255,0.14)] font-semibold text-[#3B66EE] dark:text-[#8FAAFF]"
                  : danger
                    ? "text-red-600 hover:bg-red-500/[0.06] dark:text-red-400 dark:hover:bg-red-500/10"
                    : "text-slate-600 hover:bg-slate-100 dark:text-[#8B96AD] dark:hover:bg-[#1B2438]"
              )}
            >
              <Icon className="h-4 w-4 shrink-0" aria-hidden />
              {section.label}
            </a>
          );
        })}
      </div>
    </nav>
  );
}
