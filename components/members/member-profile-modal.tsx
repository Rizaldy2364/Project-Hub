"use client";

import { useEffect, useRef, useState } from "react";
import * as DialogPrimitive from "@radix-ui/react-dialog";
import { Building2, Code2, Globe, Link2, MapPin, X } from "lucide-react";
import { Dialog } from "@/components/ui/dialog";
import { UserAvatar } from "@/components/ui/user-avatar";
import { coverGradients, isCoverGradient, type CoverGradient } from "@/lib/cover-gradients";
import { ROLE_META, formatJoinedAt } from "@/components/team/team-meta";
import { cn } from "@/lib/utils";
import type { ProjectRole } from "@/types";
import { getMemberProfileAction } from "@/actions/member.actions";

interface MemberProfileModalProps {
  /** Baris anggota pemicu — hanya id yang dipakai; data lengkap diambil saat kartu dibuka. */
  member: { id: string } | null;
  projectId: string;
  onOpenChange: (open: boolean) => void;
}

/**
 * Field yang boleh tampil di kartu profil anggota — sengaja TANPA password,
 * birthDate dan gender. Email ikut karena kartu lama menampilkannya dan tabel
 * anggota juga menampilkannya.
 */
interface MemberProfileData {
  name: string;
  email: string;
  avatarUrl: string | null;
  coverGradient: string | null;
  headline: string | null;
  company: string | null;
  location: string | null;
  bio: string | null;
  skills: string[];
  languages: string[];
  website: string | null;
  githubUrl: string | null;
  linkedinUrl: string | null;
  /** Peran target DI project ini (ADMIN / MANAGER / MEMBER / VIEWER). */
  role: string;
  joinedAt: Date | string;
  /** Task aktif (bukan DONE, tidak terhapus) di project ini. */
  activeTaskCount: number;
  /** Task selesai (DONE, tidak terhapus) — statistik "Diselesaikan" pada kartu lama. */
  doneTaskCount: number;
}

/**
 * Kartu profil anggota (read-only) satu kolom: cover 128px, avatar 88px,
 * nama, headline, company · lokasi, badge peran + tanggal bergabung, statistik
 * task, lalu section Tentang/Keahlian/Bahasa/Tautan. Data diambil lewat server
 * action saat kartu dibuka; payload tetap tanpa password/birthDate/gender.
 */
export function MemberProfileModal({
  member,
  projectId,
  onOpenChange,
}: MemberProfileModalProps) {
  const [loaded, setLoaded] = useState<{ forId: string; data: MemberProfileData } | null>(null);
  const [failed, setFailed] = useState<{ forId: string; message: string } | null>(null);
  const [attempt, setAttempt] = useState(0);

  const memberId = member?.id ?? null;
  const scrollRef = useRef<HTMLDivElement | null>(null);

  // Reset scroll ke atas setiap kartu dibuka agar cover 128px selalu terlihat
  // penuh lebih dulu (cover ikut scroll bersama konten, bukan sticky).
  useEffect(() => {
    if (memberId) scrollRef.current?.scrollTo({ top: 0 });
  }, [memberId]);

  useEffect(() => {
    if (!memberId) return;
    const id = memberId;
    let cancelled = false;

    getMemberProfileAction({ userId: id, projectId }).then((res) => {
      if (cancelled) return;
      if ("error" in res) {
        setFailed({
          forId: id,
          message: typeof res.error === "string" ? res.error : "Gagal memuat profil.",
        });
      } else {
        setLoaded({ forId: id, data: res.data });
      }
    });

    return () => {
      cancelled = true;
    };
  }, [memberId, projectId, attempt]);

  // Data/error di-scope per anggota agar tidak pernah menampilkan profil basi
  // saat pemicu berganti atau kartu dibuka ulang.
  const profile =
    loaded && memberId && loaded.forId === memberId ? loaded.data : null;
  const errorMessage =
    failed && memberId && failed.forId === memberId ? failed.message : null;
  const loading = Boolean(memberId) && !profile && !errorMessage;

  function handleRetry() {
    setFailed(null);
    setAttempt((a) => a + 1);
  }

  return (
    <Dialog open={Boolean(member)} onOpenChange={onOpenChange}>
      <DialogPrimitive.Portal>
        <DialogPrimitive.Overlay className="fixed inset-0 z-40 bg-black/40 backdrop-blur-sm" />
        <DialogPrimitive.Content
          aria-label="Profil anggota"
          className="fixed left-1/2 top-1/2 z-50 flex max-h-[calc(100dvh-48px)] w-[calc(100%-2rem)] max-w-lg flex-col overflow-hidden rounded-2xl border border-slate-200 bg-white shadow-xl focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-blue-500 max-sm:left-1/2 max-sm:top-auto max-sm:bottom-0 max-sm:w-full max-sm:max-w-none max-sm:translate-y-0 max-sm:rounded-b-none dark:border-slate-800 dark:bg-slate-900"
        >
          {member && (
            <>
              <DialogPrimitive.Close
                aria-label="Tutup"
                className="absolute right-3 top-3 z-20 flex h-8 w-8 items-center justify-center rounded-full bg-black/50 text-white transition-colors hover:bg-black/70 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-white"
              >
                <X className="h-4 w-4" />
              </DialogPrimitive.Close>
              <div ref={scrollRef} className="overflow-y-auto">
                {loading ? (
                  <MemberProfileSkeleton />
                ) : errorMessage ? (
                  <MemberProfileError message={errorMessage} onRetry={handleRetry} />
                ) : profile ? (
                  <MemberProfileContent data={profile} />
                ) : null}
              </div>
            </>
          )}
        </DialogPrimitive.Content>
      </DialogPrimitive.Portal>
    </Dialog>
  );
}

/** Skeleton mengikuti layout baru: cover 128px, avatar 88px, baris teks. */
function MemberProfileSkeleton() {
  return (
    <div aria-hidden="true">
      <div className="h-32 w-full animate-pulse bg-slate-200 dark:bg-slate-800" />
      <div className="relative z-10 -mt-11 flex w-full justify-center">
        <div className="h-[88px] w-[88px] animate-pulse rounded-full bg-slate-200 ring-4 ring-white dark:bg-slate-800 dark:ring-slate-900" />
      </div>
      <div className="flex flex-col items-center px-6 pb-6 pt-3">
        <div className="h-5 w-44 animate-pulse rounded bg-slate-200 dark:bg-slate-800" />
        <div className="mt-2 h-4 w-56 animate-pulse rounded bg-slate-200 dark:bg-slate-800" />
        <div className="mt-3 h-5 w-24 animate-pulse rounded-full bg-slate-200 dark:bg-slate-800" />
        <div className="mt-4 h-14 w-full animate-pulse rounded-xl bg-slate-200 dark:bg-slate-800" />
        <div className="mt-4 h-20 w-full animate-pulse rounded-xl bg-slate-200 dark:bg-slate-800" />
      </div>
    </div>
  );
}

function MemberProfileError({
  message,
  onRetry,
}: {
  message: string;
  onRetry: () => void;
}) {
  return (
    <div className="m-6 rounded-xl border border-red-200 bg-red-50 p-4 text-center text-sm text-red-700 dark:border-red-500/20 dark:bg-red-500/10 dark:text-red-300">
      <p>{message}</p>
      <button
        type="button"
        onClick={onRetry}
        className="mt-2 font-semibold underline focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-blue-500"
      >
        Coba lagi
      </button>
    </div>
  );
}

function MemberProfileContent({ data }: { data: MemberProfileData }) {
  const gradient: CoverGradient = isCoverGradient(data.coverGradient ?? "")
    ? (data.coverGradient as CoverGradient)
    : "indigo";

  const roleKey: ProjectRole =
    data.role === "ADMIN" || data.role === "MANAGER" || data.role === "VIEWER"
      ? data.role
      : "MEMBER";

  const isEmpty =
    !data.bio &&
    !data.headline &&
    !data.company &&
    !data.location &&
    data.skills.length === 0 &&
    data.languages.length === 0 &&
    !data.website &&
    !data.githubUrl &&
    !data.linkedinUrl;

  return (
    <div>
      {/* Cover 128px — ikut scroll bersama konten; layer gradasi punya
          overflow-hidden tersendiri (sudut membulat) agar wrapper cover
          tidak memotong elemen saudara di bawahnya. */}
      <div className="relative h-32 w-full rounded-t-2xl">
        <div
          className="absolute inset-0 overflow-hidden rounded-t-2xl"
          style={{ background: coverGradients[gradient].background }}
        />
        <div className="absolute inset-0 bg-[radial-gradient(circle_at_82%_18%,rgba(255,255,255,0.22),transparent_34%)]" />
        <div className="absolute inset-x-0 bottom-0 h-10 bg-gradient-to-t from-black/30 to-transparent dark:from-slate-900/70" />
      </div>

      {/* Avatar — saudara cover dan di-z-kan di atasnya (bukan anak elemen
          overflow-hidden); tarik naik 44px = setengah tinggi 88px. */}
      <div className="relative z-10 -mt-11 flex w-full justify-center">
        <div className="h-[88px] w-[88px] overflow-hidden rounded-full shadow-lg ring-4 ring-white dark:ring-slate-900">
          <UserAvatar
            name={data.name}
            image={data.avatarUrl}
            className="h-full w-full rounded-full object-cover text-3xl"
          />
        </div>
      </div>

      <div className="flex flex-col items-center px-6 pb-6 pt-3 text-center">
        <h3 className="text-xl font-bold text-slate-900 dark:text-white">
          {data.name}
        </h3>
        {data.headline && (
          <p className="mt-1 text-sm font-medium text-slate-600 dark:text-slate-300">
            {data.headline}
          </p>
        )}
        {(data.company || data.location) && (
          <p className="mt-1 flex items-center justify-center gap-1.5 text-xs text-slate-500 dark:text-slate-400">
            {data.company && (
              <span className="inline-flex items-center gap-1">
                <Building2 className="h-3.5 w-3.5" />
                {data.company}
              </span>
            )}
            {data.company && data.location && <span aria-hidden>·</span>}
            {data.location && (
              <span className="inline-flex items-center gap-1">
                <MapPin className="h-3.5 w-3.5" />
                {data.location}
              </span>
            )}
          </p>
        )}

        <div className="mt-3 flex flex-wrap items-center justify-center gap-2">
          <span
            className={cn(
              "rounded-full px-3 py-1 text-[11px] font-bold uppercase tracking-wide",
              ROLE_META[roleKey].badge
            )}
          >
            {ROLE_META[roleKey].label}
          </span>
          <span className="text-xs text-slate-500 dark:text-slate-400">
            Bergabung {formatJoinedAt(new Date(data.joinedAt).toISOString())}
          </span>
        </div>

        {/* Statistik task — dipertahankan seperti sebelumnya */}
        <div className="mt-4 flex w-full items-center justify-center gap-4 border-y border-slate-100 py-4 dark:border-slate-800">
          <div className="px-4 text-center">
            <p className="text-2xl font-bold text-slate-900 dark:text-white">
              {data.activeTaskCount}
            </p>
            <p className="text-xs font-semibold uppercase tracking-wider text-slate-400">
              Task Aktif
            </p>
          </div>
          <div className="h-10 w-px bg-slate-200 dark:bg-slate-700" />
          <div className="px-4 text-center">
            <p className="text-2xl font-bold text-slate-900 dark:text-white">
              {data.doneTaskCount}
            </p>
            <p className="text-xs font-semibold uppercase tracking-wider text-slate-400">
              Diselesaikan
            </p>
          </div>
        </div>

      {/* Detail personal satu kolom — TANPA umur & jenis kelamin (birthDate/gender
          tidak dikirim server). Section kosong tidak dirender sama sekali. */}
      {isEmpty ? (
        <p className="mt-4 w-full rounded-xl bg-slate-50 px-4 py-3 text-center text-sm leading-6 text-slate-500 dark:bg-slate-800/60 dark:text-slate-400">
          Pengguna ini belum melengkapi profilnya.
        </p>
      ) : (
        <div className="mt-4 flex w-full flex-col gap-5 text-left">
          {data.bio && (
            <section>
              <h4 className="text-[11px] font-bold uppercase tracking-wider text-slate-400">
                Tentang
              </h4>
              <p className="mt-1.5 text-sm leading-6 text-slate-600 dark:text-slate-300">
                {data.bio}
              </p>
            </section>
          )}
          {data.skills.length > 0 && (
            <section>
              <h4 className="text-[11px] font-bold uppercase tracking-wider text-slate-400">
                Keahlian
              </h4>
              <ul className="mt-1.5 flex flex-wrap gap-1.5">
                {data.skills.slice(0, 8).map((skill) => (
                  <li
                    key={skill}
                    className="rounded-md bg-blue-50 px-2 py-0.5 text-[11px] font-semibold text-blue-700 dark:bg-blue-500/15 dark:text-blue-300"
                  >
                    {skill}
                  </li>
                ))}
                {data.skills.length > 8 && (
                  <li className="rounded-md bg-slate-100 px-2 py-0.5 text-[11px] font-semibold text-slate-500 dark:bg-slate-800 dark:text-slate-400">
                    +{data.skills.length - 8}
                  </li>
                )}
              </ul>
            </section>
          )}
          {data.languages.length > 0 && (
            <section>
              <h4 className="text-[11px] font-bold uppercase tracking-wider text-slate-400">
                Bahasa
              </h4>
              <ul className="mt-1.5 flex flex-wrap gap-1.5">
                {data.languages.map((language) => (
                  <li
                    key={language}
                    className="rounded-md bg-slate-100 px-2 py-0.5 text-[11px] font-semibold text-slate-600 dark:bg-slate-800 dark:text-slate-300"
                  >
                    {language}
                  </li>
                ))}
              </ul>
            </section>
          )}
          {(data.website || data.githubUrl || data.linkedinUrl) && (
            <section>
              <h4 className="text-[11px] font-bold uppercase tracking-wider text-slate-400">
                Tautan
              </h4>
              <div className="mt-1.5 flex flex-wrap gap-2">
                {data.website && (
                  <a
                    href={data.website}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="inline-flex items-center gap-1.5 rounded-lg bg-slate-100 px-2.5 py-1 text-xs font-semibold text-slate-700 transition-colors hover:bg-blue-50 hover:text-blue-700 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-blue-500 dark:bg-slate-800 dark:text-slate-200 dark:hover:bg-blue-500/10 dark:hover:text-blue-300"
                  >
                    <Globe className="h-3.5 w-3.5" />
                    Website
                  </a>
                )}
                {data.githubUrl && (
                  <a
                    href={data.githubUrl}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="inline-flex items-center gap-1.5 rounded-lg bg-slate-100 px-2.5 py-1 text-xs font-semibold text-slate-700 transition-colors hover:bg-blue-50 hover:text-blue-700 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-blue-500 dark:bg-slate-800 dark:text-slate-200 dark:hover:bg-blue-500/10 dark:hover:text-blue-300"
                  >
                    <Code2 className="h-3.5 w-3.5" />
                    GitHub
                  </a>
                )}
                {data.linkedinUrl && (
                  <a
                    href={data.linkedinUrl}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="inline-flex items-center gap-1.5 rounded-lg bg-slate-100 px-2.5 py-1 text-xs font-semibold text-slate-700 transition-colors hover:bg-blue-50 hover:text-blue-700 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-blue-500 dark:bg-slate-800 dark:text-slate-200 dark:hover:bg-blue-500/10 dark:hover:text-blue-300"
                  >
                    <Link2 className="h-3.5 w-3.5" />
                    LinkedIn
                  </a>
                )}
              </div>
            </section>
          )}
        </div>
      )}
      </div>
    </div>
  );
}
