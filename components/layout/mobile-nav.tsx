"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { FolderKanban, X } from "lucide-react";
import * as DialogPrimitive from "@radix-ui/react-dialog";
import { cn } from "@/lib/utils";
import { SidebarNav } from "@/components/layout/sidebar-nav";
import { SidebarUser } from "@/components/layout/sidebar-user";

interface MobileNavProps {
  name?: string | null;
  email?: string | null;
  image?: string | null;
}

/**
 * Navbar mobile (di bawah `lg`).
 *
 * Menggunakan `h-[100svh]` (Small Viewport Height) yang stabil agar tinggi panel
 * tidak berubah-ubah/bergeser saat address bar browser mobile muncul atau sembunyi.
 * Background scroll dan overscroll dikunci saat drawer terbuka sehingga area profil
 * di dasar sidebar selalu tampak lengkap dan tidak terpotong.
 */
export function MobileNav({ name, email, image }: MobileNavProps) {
  const [open, setOpen] = useState(false);
  const pathname = usePathname();

  // Otomatis tutup panel drawer saat navigasi/halaman berpindah
  useEffect(() => {
    setOpen(false);
  }, [pathname]);

  // Kunci scroll body saat drawer terbuka di hp agar tidak terjadi scroll chaining ke halaman belakang
  useEffect(() => {
    if (!open) return;

    const prevOverflow = document.body.style.overflow;
    const prevTouchAction = document.body.style.touchAction;

    document.body.style.overflow = "hidden";
    document.body.style.touchAction = "none";

    return () => {
      document.body.style.overflow = prevOverflow;
      document.body.style.touchAction = prevTouchAction;
    };
  }, [open]);

  return (
    <DialogPrimitive.Root open={open} onOpenChange={setOpen}>
      {/* Trigger = ikon/logo aplikasi (brand) di topbar hp. */}
      <DialogPrimitive.Trigger asChild>
        <button
          type="button"
          aria-label="Buka menu"
          className="lg:hidden inline-flex items-center gap-2.5 w-[200px] shrink-0"
        >
          <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-blue-600">
            <FolderKanban className="h-4 w-4 text-white" />
          </div>
          <span className="font-semibold text-slate-900 dark:text-white">
            ProjectHub
          </span>
        </button>
      </DialogPrimitive.Trigger>

      <DialogPrimitive.Portal>
        {/* Overlay: klik di luar atau tombol escape menutup panel. */}
        <DialogPrimitive.Overlay className="fixed inset-0 z-40 bg-black/40 backdrop-blur-sm overscroll-contain touch-none lg:hidden" />

        {/* Panel samping kiri: slide dari kiri, tinggi konstan (100svh). */}
        <DialogPrimitive.Content
          aria-label="Menu navigasi"
          asChild
        >
          <div
            className={cn(
              "fixed top-0 left-0 z-50 flex h-[100svh] max-h-[100svh] w-72 max-w-[85vw] flex-col border-r border-slate-200 bg-white dark:border-slate-800 dark:bg-slate-950 overflow-hidden touch-none select-none",
              "data-[state=open]:animate-slide-in-left data-[state=closed]:animate-slide-out-left",
              "lg:hidden"
            )}
          >
            {/* Header panel: logo + nama aplikasi + tombol tutup. */}
            <div className="flex h-16 shrink-0 items-center justify-between px-4 border-b border-slate-200 dark:border-slate-800">
              <Link
                href="/dashboard"
                onClick={() => setOpen(false)}
                className="inline-flex items-center gap-2.5 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-blue-500 rounded-lg"
              >
                <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-blue-600">
                  <FolderKanban className="h-4 w-4 text-white" />
                </div>
                <span className="font-semibold text-slate-900 dark:text-white">
                  ProjectHub
                </span>
              </Link>

              <DialogPrimitive.Close
                aria-label="Tutup menu"
                className="inline-flex h-8 w-8 items-center justify-center rounded-xl text-slate-500 transition-colors hover:bg-slate-100 hover:text-slate-900 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-blue-500 dark:hover:bg-slate-800"
              >
                <X className="h-5 w-5" />
              </DialogPrimitive.Close>
            </div>

            {/* Menu: terkunci permanen sesuai foto, tidak bisa discroll / digeser. */}
            <div className="flex-1 min-h-0 overflow-hidden py-2 px-4">
              <SidebarNav compact />
            </div>

            {/* Profil + keluar di dasar panel: selalu terlihat dan menempel di bawah tanpa terpotong. */}
            <div className="shrink-0 pb-[env(safe-area-inset-bottom,0px)]">
              <SidebarUser name={name} email={email} image={image} />
            </div>
          </div>
        </DialogPrimitive.Content>
      </DialogPrimitive.Portal>
    </DialogPrimitive.Root>
  );
}
