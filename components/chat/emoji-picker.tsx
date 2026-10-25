"use client";

import { useCallback, useEffect, useRef, useState } from "react";
import { ChevronLeft, ChevronRight, Clock, X } from "lucide-react";
import {
  EMOJIS_BY_CATEGORY,
  CATEGORY_LABELS,
} from "@/lib/emoji-data";
import type { EmojiCategory } from "@/lib/emoji-types";

interface EmojiPickerProps {
  open: boolean;
  onClose: () => void;
  onEmojiSelect: (char: string) => void;
  /** Tombol pemicu agar klik pada tombol tidak memicu onClose dua kali. */
  triggerRef?: React.RefObject<HTMLElement | null>;
}

type EmojiTab = "terbaru" | EmojiCategory;

/** Key penyimpanan emoji yang baru saja digunakan di localStorage. */
const RECENT_KEY = "emoji-picker-recent-emojis";

/** Durasi siklus riset riwayat terbaru (7 hari dalam milidetik). */
const RECENT_RESET_INTERVAL_MS = 7 * 24 * 60 * 60 * 1000;

/** Format data riwayat terbaru di localStorage. */
interface RecentEmojiData {
  emojis: string[];
  /** Timestamp (ms) saat riwayat terakhir kali disimpan/direset. */
  savedAt: number;
}

/** Daftar emoji awal untuk histori terbaru saat belum ada riwayat pengguna. */
const DEFAULT_RECENTS = [
  "😀", "😂", "❤️", "👍", "🔥", "✨", "🙏", "🎉",
  "😍", "🥳", "🙌", "😊", "👏", "😎", "💯", "🚀"
];

/**
 * Membaca riwayat emoji dari localStorage.
 * Jika sudah lewat 7 hari sejak `savedAt`, riwayat direset ke DEFAULT_RECENTS
 * dan timestamp diperbarui. Juga menangani migrasi dari format lama (array biasa).
 */
function loadRecentEmojis(): string[] {
  try {
    const raw = localStorage.getItem(RECENT_KEY);
    if (!raw) return DEFAULT_RECENTS;

    const parsed = JSON.parse(raw);

    // Migrasi format lama: jika data berupa array biasa (tanpa savedAt),
    // konversi ke format baru dengan timestamp sekarang.
    if (Array.isArray(parsed)) {
      const migrated: RecentEmojiData = {
        emojis: parsed.length > 0 ? parsed : DEFAULT_RECENTS,
        savedAt: Date.now(),
      };
      localStorage.setItem(RECENT_KEY, JSON.stringify(migrated));
      return migrated.emojis;
    }

    // Format baru — cek apakah sudah lewat 7 hari.
    const data = parsed as RecentEmojiData;
    if (
      !data.savedAt ||
      !Array.isArray(data.emojis) ||
      Date.now() - data.savedAt >= RECENT_RESET_INTERVAL_MS
    ) {
      // Riset: kembalikan ke default dan perbarui timestamp.
      const reset: RecentEmojiData = {
        emojis: DEFAULT_RECENTS,
        savedAt: Date.now(),
      };
      localStorage.setItem(RECENT_KEY, JSON.stringify(reset));
      return DEFAULT_RECENTS;
    }

    return data.emojis.length > 0 ? data.emojis : DEFAULT_RECENTS;
  } catch {
    // Abaikan jika localStorage tidak dapat diakses
    return DEFAULT_RECENTS;
  }
}

/** Simpan riwayat emoji ke localStorage dengan format baru (termasuk savedAt). */
function saveRecentEmojis(emojis: string[]): void {
  try {
    const raw = localStorage.getItem(RECENT_KEY);
    let savedAt = Date.now();

    // Pertahankan savedAt yang sudah ada agar siklus 7 hari tidak direset
    // setiap kali pengguna memilih emoji.
    if (raw) {
      try {
        const existing = JSON.parse(raw);
        if (existing && typeof existing === "object" && !Array.isArray(existing) && existing.savedAt) {
          savedAt = existing.savedAt;
        }
      } catch {
        // Gunakan timestamp baru jika parsing gagal
      }
    }

    const data: RecentEmojiData = { emojis, savedAt };
    localStorage.setItem(RECENT_KEY, JSON.stringify(data));
  } catch {
    // Abaikan jika quota localStorage penuh
  }
}

const CATEGORIES: EmojiCategory[] = [
  "wajah",
  "gestur",
  "hati",
  "objek",
  "alam",
  "makanan",
  "aktivitas",
];

const ALL_TABS: { id: EmojiTab; label: string; icon: string }[] = [
  { id: "terbaru", label: "Terbaru", icon: "🕒" },
  { id: "wajah", label: "Wajah", icon: "😀" },
  { id: "gestur", label: "Gestur", icon: "👍" },
  { id: "hati", label: "Hati", icon: "❤️" },
  { id: "objek", label: "Objek", icon: "💡" },
  { id: "alam", label: "Alam", icon: "🌲" },
  { id: "makanan", label: "Makanan", icon: "🍎" },
  { id: "aktivitas", label: "Aktivitas", icon: "⚽" },
];

export function EmojiPicker({
  open,
  onClose,
  onEmojiSelect,
  triggerRef,
}: EmojiPickerProps) {
  const [animateIn, setAnimateIn] = useState(false);
  const [activeCategory, setActiveCategory] = useState<EmojiTab>("terbaru");
  const [recentEmojis, setRecentEmojis] = useState<string[]>(DEFAULT_RECENTS);

  const wrapperRef = useRef<HTMLDivElement>(null);
  const scrollContainerRef = useRef<HTMLDivElement>(null);
  const tabsContainerRef = useRef<HTMLDivElement>(null);
  const sectionRefs = useRef<Partial<Record<EmojiTab, HTMLDivElement | null>>>({});
  const tabRefs = useRef<Partial<Record<EmojiTab, HTMLButtonElement | null>>>({});
  const isScrollingFromClick = useRef(false);
  const scrollTimeoutRef = useRef<NodeJS.Timeout | null>(null);

  // Status indikator scroll tab ke kiri dan kanan
  const [canScrollLeft, setCanScrollLeft] = useState(false);
  const [canScrollRight, setCanScrollRight] = useState(true);

  // Drag-to-scroll untuk tab bar
  const [isDraggingTabs, setIsDraggingTabs] = useState(false);
  const dragStartX = useRef(0);
  const dragScrollLeft = useRef(0);

  // Muat riwayat emoji dari localStorage saat komponen dibuka.
  // Fungsi loadRecentEmojis() otomatis mengecek apakah sudah lewat 7 hari
  // dan mereset ke DEFAULT_RECENTS jika perlu.
  useEffect(() => {
    if (!open) return;
    setRecentEmojis(loadRecentEmojis());
  }, [open]);

  // Cek apakah tab bar bisa di-scroll ke kiri atau kanan
  const updateTabScrollButtons = useCallback(() => {
    const el = tabsContainerRef.current;
    if (!el) return;
    setCanScrollLeft(el.scrollLeft > 4);
    setCanScrollRight(el.scrollLeft < el.scrollWidth - el.clientWidth - 4);
  }, []);

  useEffect(() => {
    const el = tabsContainerRef.current;
    if (!el || !open) return;
    updateTabScrollButtons();
    el.addEventListener("scroll", updateTabScrollButtons, { passive: true });
    window.addEventListener("resize", updateTabScrollButtons);
    return () => {
      el.removeEventListener("scroll", updateTabScrollButtons);
      window.removeEventListener("resize", updateTabScrollButtons);
    };
  }, [updateTabScrollButtons, open]);

  // Fungsi scroll tombol navigasi tab
  const scrollTabs = (direction: "left" | "right") => {
    const el = tabsContainerRef.current;
    if (!el) return;
    const distance = 110;
    el.scrollBy({
      left: direction === "left" ? -distance : distance,
      behavior: "smooth",
    });
  };

  // Drag scroll pada bar tab
  const handleTabsMouseDown = (e: React.MouseEvent<HTMLDivElement>) => {
    const el = tabsContainerRef.current;
    if (!el) return;
    setIsDraggingTabs(true);
    dragStartX.current = e.pageX - el.offsetLeft;
    dragScrollLeft.current = el.scrollLeft;
  };

  const handleTabsMouseMove = (e: React.MouseEvent<HTMLDivElement>) => {
    if (!isDraggingTabs) return;
    const el = tabsContainerRef.current;
    if (!el) return;
    e.preventDefault();
    const x = e.pageX - el.offsetLeft;
    const walk = (x - dragStartX.current) * 1.4;
    el.scrollLeft = dragScrollLeft.current - walk;
  };

  const handleTabsMouseUpOrLeave = () => {
    setIsDraggingTabs(false);
  };

  // Animasi saat card pertama kali dibuka
  useEffect(() => {
    setAnimateIn(open);
  }, [open]);

  // Bersihkan timeout saat unmount
  useEffect(() => {
    return () => {
      if (scrollTimeoutRef.current) clearTimeout(scrollTimeoutRef.current);
    };
  }, []);

  // Tutup saat tekan tombol Escape
  useEffect(() => {
    if (!open) return;
    function handleKeyDown(e: KeyboardEvent) {
      if (e.key === "Escape") {
        onClose();
      }
    }
    document.addEventListener("keydown", handleKeyDown);
    return () => document.removeEventListener("keydown", handleKeyDown);
  }, [open, onClose]);

  // Tutup saat klik di luar card picker (kecuali tombol pemicu)
  useEffect(() => {
    if (!open) return;
    function handleClickOutside(e: MouseEvent) {
      const target = e.target as Node;
      if (triggerRef?.current && triggerRef.current.contains(target)) {
        return;
      }
      if (
        wrapperRef.current &&
        !wrapperRef.current.contains(target)
      ) {
        onClose();
      }
    }
    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, [open, onClose, triggerRef]);

  // Klik tab kategori -> scroll container secara halus ke kategori tersebut
  const scrollToCategory = useCallback((tab: EmojiTab) => {
    setActiveCategory(tab);
    const container = scrollContainerRef.current;
    const target = sectionRefs.current[tab];
    if (container && target) {
      isScrollingFromClick.current = true;
      if (scrollTimeoutRef.current) clearTimeout(scrollTimeoutRef.current);

      container.scrollTo({ top: target.offsetTop, behavior: "smooth" });

      tabRefs.current[tab]?.scrollIntoView({
        behavior: "smooth",
        inline: "nearest",
        block: "nearest",
      });

      scrollTimeoutRef.current = setTimeout(() => {
        isScrollingFromClick.current = false;
      }, 500);
    }
  }, []);

  // Update tab aktif saat pengguna menggulir (scroll) emoji
  const handleScroll = useCallback(() => {
    if (isScrollingFromClick.current) return;
    const container = scrollContainerRef.current;
    if (!container) return;

    const scrollPos = container.scrollTop + 36;
    let currentTab: EmojiTab = "terbaru";

    for (const tab of ALL_TABS) {
      const el = sectionRefs.current[tab.id];
      if (el && el.offsetTop <= scrollPos) {
        currentTab = tab.id;
      }
    }

    setActiveCategory((prev) => {
      if (prev !== currentTab) {
        tabRefs.current[currentTab]?.scrollIntoView({
          behavior: "smooth",
          inline: "nearest",
          block: "nearest",
        });
        return currentTab;
      }
      return prev;
    });
  }, []);

  // Simpan emoji yang dipilih ke histori terbaru (menggunakan saveRecentEmojis
  // agar format { emojis, savedAt } terjaga dan siklus 7 hari tidak direset).
  const handleEmojiSelect = useCallback(
    (char: string) => {
      setRecentEmojis((prev) => {
        const next = [char, ...prev.filter((c) => c !== char)].slice(0, 24);
        saveRecentEmojis(next);
        return next;
      });
      onEmojiSelect(char);
    },
    [onEmojiSelect]
  );

  if (!open) return null;

  return (
    <div ref={wrapperRef} className="w-full pointer-events-auto select-none">
      <div onClick={(e) => e.stopPropagation()} className="pointer-events-auto">
        {/* Card picker */}
        <div
          className={`relative rounded-2xl border border-slate-200 bg-white shadow-2xl dark:border-white/[0.08] dark:bg-[#131A2B] text-slate-800 dark:text-[#E6EAF2] transition-all duration-200 ease-out overflow-hidden ${
            animateIn
              ? "opacity-100 scale-100 translate-y-0"
              : "opacity-0 scale-95 translate-y-2"
          }`}
        >
          {/* Header tab kategori dengan scroll samping + tombol navigasi + tombol tutup */}
          <div className="flex items-center border-b border-slate-100 dark:border-white/[0.08] px-1.5 py-1.5 gap-1 bg-slate-50/70 dark:bg-white/[0.02]">
            {/* Tombol scroll tab ke kiri */}
            {canScrollLeft && (
              <button
                type="button"
                onClick={() => scrollTabs("left")}
                aria-label="Scroll tab ke kiri"
                className="flex h-6 w-6 shrink-0 items-center justify-center rounded-md text-slate-400 hover:bg-slate-200/80 hover:text-slate-700 dark:hover:bg-white/[0.08] dark:hover:text-[#E6EAF2] transition-colors"
              >
                <ChevronLeft className="h-4 w-4" />
              </button>
            )}

            {/* Container tab yang dapat di-scroll ke samping secara bebas (drag, wheel, touch) */}
            <div
              ref={tabsContainerRef}
              onWheel={(e) => {
                if (e.deltaY !== 0) {
                  e.currentTarget.scrollLeft += e.deltaY;
                }
              }}
              onMouseDown={handleTabsMouseDown}
              onMouseMove={handleTabsMouseMove}
              onMouseUp={handleTabsMouseUpOrLeave}
              onMouseLeave={handleTabsMouseUpOrLeave}
              className="flex items-center gap-1 overflow-x-auto scrollbar-hide py-0.5 min-w-0 flex-1 cursor-grab active:cursor-grabbing scroll-smooth"
            >
              {ALL_TABS.map((tab) => {
                const isActive = tab.id === activeCategory;
                return (
                  <button
                    key={tab.id}
                    ref={(el) => {
                      tabRefs.current[tab.id] = el;
                    }}
                    type="button"
                    onClick={() => scrollToCategory(tab.id)}
                    title={tab.label}
                    aria-label={tab.label}
                    className={`flex items-center gap-1.5 px-2.5 py-1.5 rounded-lg text-xs font-medium transition-colors whitespace-nowrap shrink-0 ${
                      isActive
                        ? "bg-blue-50 text-blue-600 border border-blue-200 dark:bg-blue-500/15 dark:text-blue-400 dark:border-blue-500/30"
                        : "text-slate-500 hover:text-slate-900 hover:bg-slate-100 dark:text-[#8B96AD] dark:hover:text-[#E6EAF2] dark:hover:bg-white/[0.05]"
                    }`}
                  >
                    <span className="text-xs leading-none">{tab.icon}</span>
                    <span>{tab.label}</span>
                  </button>
                );
              })}
            </div>

            {/* Tombol scroll tab ke kanan */}
            {canScrollRight && (
              <button
                type="button"
                onClick={() => scrollTabs("right")}
                aria-label="Scroll tab ke kanan"
                className="flex h-6 w-6 shrink-0 items-center justify-center rounded-md text-slate-400 hover:bg-slate-200/80 hover:text-slate-700 dark:hover:bg-white/[0.08] dark:hover:text-[#E6EAF2] transition-colors"
              >
                <ChevronRight className="h-4 w-4" />
              </button>
            )}

            {/* Tombol tutup */}
            <button
              type="button"
              onClick={onClose}
              aria-label="Tutup emoji"
              className="flex h-7 w-7 shrink-0 items-center justify-center rounded-lg text-slate-400 hover:bg-slate-100 hover:text-slate-700 dark:text-[#8B96AD] dark:hover:bg-white/[0.08] dark:hover:text-[#E6EAF2] transition-colors ml-0.5"
            >
              <X className="h-4 w-4" />
            </button>
          </div>

          {/* Daftar emoji dengan sistem scroll (Histori Terbaru di paling atas, diikuti kategori lainnya) */}
          <div
            ref={scrollContainerRef}
            onScroll={handleScroll}
            className="relative h-[320px] max-h-[50vh] overflow-y-auto scrollbar-thin scrollbar-thumb-slate-200 dark:scrollbar-thumb-slate-700"
          >
            {/* Bagian Histori Terbaru (di paling atas di bawah tab) */}
            <div
              ref={(el) => {
                sectionRefs.current["terbaru"] = el;
              }}
              data-category="terbaru"
              className="pb-2"
            >
              <div className="sticky top-0 z-10 flex items-center gap-1.5 bg-white/95 px-3 py-1.5 text-[11px] font-semibold uppercase tracking-wider text-slate-500 backdrop-blur-sm dark:bg-[#131A2B]/95 dark:text-[#8B96AD] border-b border-slate-100/80 dark:border-white/[0.04]">
                <Clock className="h-3.5 w-3.5" />
                <span>Terbaru</span>
              </div>
              <div className="grid grid-cols-8 gap-1 p-2">
                {recentEmojis.map((char, index) => (
                  <button
                    key={`recent-${char}-${index}`}
                    type="button"
                    onClick={() => handleEmojiSelect(char)}
                    aria-label={`Emoji ${char}`}
                    className="flex aspect-square items-center justify-center rounded-lg text-xl transition-transform hover:scale-110 hover:bg-slate-100 dark:hover:bg-white/[0.08] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-blue-500/50"
                  >
                    {char}
                  </button>
                ))}
              </div>
            </div>

            {/* Kategori-kategori emoji lainnya */}
            {CATEGORIES.map((cat) => {
              const emojis = EMOJIS_BY_CATEGORY[cat] ?? [];
              return (
                <div
                  key={cat}
                  ref={(el) => {
                    sectionRefs.current[cat] = el;
                  }}
                  data-category={cat}
                  className="pb-2"
                >
                  {/* Sticky header nama kategori */}
                  <div className="sticky top-0 z-10 bg-white/95 px-3 py-1.5 text-[11px] font-semibold uppercase tracking-wider text-slate-500 backdrop-blur-sm dark:bg-[#131A2B]/95 dark:text-[#8B96AD] border-b border-slate-100/80 dark:border-white/[0.04]">
                    {CATEGORY_LABELS[cat]}
                  </div>

                  {/* Grid emoji kategori */}
                  <div className="grid grid-cols-8 gap-1 p-2">
                    {emojis.map((emoji) => (
                      <button
                        key={`${emoji.char}-${emoji.name}`}
                        type="button"
                        onClick={() => handleEmojiSelect(emoji.char)}
                        title={emoji.name}
                        aria-label={emoji.name}
                        className="flex aspect-square items-center justify-center rounded-lg text-xl transition-transform hover:scale-110 hover:bg-slate-100 dark:hover:bg-white/[0.08] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-blue-500/50"
                      >
                        {emoji.char}
                      </button>
                    ))}
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      </div>
    </div>
  );
}
