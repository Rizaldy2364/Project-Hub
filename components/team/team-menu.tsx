"use client";

import { useEffect, useRef, useState } from "react";
import { MoreHorizontal } from "lucide-react";
import { cn } from "@/lib/utils";
import type { ProjectRole, TeamMemberRow } from "@/types";

export function canShowMenu(
  myRole: ProjectRole | null,
  member: TeamMemberRow,
  myUserId: string
): boolean {
  if (myRole !== "ADMIN") return false;
  if (member.id === myUserId) return false;
  if (member.role === "ADMIN") return false;
  return true;
}

interface RowMenuProps {
  member: TeamMemberRow;
  onPromote: (member: TeamMemberRow) => void;
  onDemote: (member: TeamMemberRow) => void;
  onRemove: (member: TeamMemberRow) => void;
}

export function MemberRowMenu({ member, onPromote, onDemote, onRemove }: RowMenuProps) {
  const [open, setOpen] = useState(false);
  const menuRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (!open) return;
    function onDocClick(e: MouseEvent) {
      if (menuRef.current && !menuRef.current.contains(e.target as Node)) {
        setOpen(false);
      }
    }
    function onKey(e: KeyboardEvent) {
      if (e.key === "Escape") setOpen(false);
    }
    document.addEventListener("mousedown", onDocClick);
    document.addEventListener("keydown", onKey);
    return () => {
      document.removeEventListener("mousedown", onDocClick);
      document.removeEventListener("keydown", onKey);
    };
  }, [open ]);

  const itemCls =
    "block w-full px-4 py-2.5 text-left text-sm transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-blue-500 focus-visible:ring-inset";

  return (
    <div ref={menuRef} className="relative">
      <button
        type="button"
        aria-label={`Menu untuk ${member.name}`}
        aria-haspopup="menu"
        aria-expanded={open}
        onClick={() => setOpen((v) => !v)}
        className="rounded-lg p-2 text-slate-400 transition-colors hover:bg-slate-100 hover:text-slate-600 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-blue-500 dark:hover:bg-[#1B2438] dark:hover:text-slate-200"
      >
        <MoreHorizontal className="h-5 w-5" />
      </button>
      {open && (
        <div
          role="menu"
          aria-label={`Aksi untuk ${member.name}`}
          className="absolute right-0 z-20 w-52 overflow-hidden rounded-xl border border-slate-200 bg-white py-1 shadow-lg dark:border-white/[0.08] dark:bg-[#131A2B]"
        >
          {member.role === "MEMBER" && (
            <button
              type="button"
              role="menuitem"
              onClick={() => {
                setOpen(false);
                onPromote(member);
              }}
              className={cn(itemCls, "text-slate-700 hover:bg-slate-50 dark:text-slate-200 dark:hover:bg-[#1B2438]")}
            >
              Jadikan Wakil Admin
            </button>
          )}
          {member.role === "DEPUTY_ADMIN" && (
            <button
              type="button"
              role="menuitem"
              onClick={() => {
                setOpen(false);
                onDemote(member);
              }}
              className={cn(itemCls, "text-slate-700 hover:bg-slate-50 dark:text-slate-200 dark:hover:bg-[#1B2438]")}
            >
              Jadikan Member
            </button>
          )}
          <button
            type="button"
            role="menuitem"
            onClick={() => {
              setOpen(false);
              onRemove(member);
            }}
            className={cn(itemCls, "font-medium text-red-600 hover:bg-red-50 dark:text-red-400 dark:hover:bg-red-500/10")}
          >
            Hapus dari project
          </button>
        </div>
      )}
    </div>
  );
}
