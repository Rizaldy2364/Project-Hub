import { auth } from "@/lib/auth";
import { NextResponse } from "next/server";

/** Alias ?tab= lama (mis. ?tab=kanban) → tab route baru. */
const TAB_ALIASES: Record<string, string> = {
  kanban: "tasks",
  task: "tasks",
  tasks: "tasks",
  members: "anggota",
  member: "anggota",
  anggota: "anggota",
  diskusi: "diskusi",
  discussion: "diskusi",
  chat: "diskusi",
  aktivitas: "aktivitas",
  activity: "aktivitas",
};

export default auth((req) => {
  const isLoggedIn = !!req.auth;
  const isDashboardRoute =
    req.nextUrl.pathname.startsWith("/dashboard") ||
    req.nextUrl.pathname.startsWith("/tasks") ||
    req.nextUrl.pathname.startsWith("/projects") ||
    req.nextUrl.pathname.startsWith("/calendar") ||
    req.nextUrl.pathname.startsWith("/inbox") ||
    req.nextUrl.pathname.startsWith("/tim") ||
    req.nextUrl.pathname.startsWith("/profile");

  if (isDashboardRoute && !isLoggedIn) {
    return NextResponse.redirect(new URL("/login", req.nextUrl));
  }

  // URL lama /projects/[id]?tab=kanban — arahkan ke tab route yang benar
  // (layout tidak lagi menerima searchParams). Berlaku untuk semua route di
  // bawah [projectId]; /projects/new dan /projects/join dibiarkan.
  const segments = req.nextUrl.pathname.split("/").filter(Boolean);
  if (segments[0] === "projects" && segments.length >= 2) {
    const projectId = segments[1];
    const tab = req.nextUrl.searchParams.get("tab");
    if (tab && projectId !== "new" && projectId !== "join") {
      const target = TAB_ALIASES[tab];
      const url = req.nextUrl.clone();
      url.search = "";
      url.pathname = target
        ? `/projects/${projectId}/${target}`
        : `/projects/${projectId}`;
      return NextResponse.redirect(url);
    }

    // Tab Pengaturan khusus ADMIN. Tandai request-nya lewat header supaya
    // [projectId]/layout.tsx bisa memanggil forbidden() DI ATAS loading
    // boundary — cek di page (di bawah loading.tsx) sudah keburu streaming
    // 200 sehingga status 403 tidak bisa dikirim. Lihat docs Next.js
    // (loading.md → Status Codes): cek harus jalan sebelum streaming dimulai.
    if (segments.length === 3 && segments[2] === "pengaturan") {
      const requestHeaders = new Headers(req.headers);
      requestHeaders.set("x-requires-admin", "1");
      return NextResponse.next({ request: { headers: requestHeaders } });
    }
  }
});

export const config = {
  matcher: [
    "/dashboard/:path*",
    "/tasks/:path*",
    "/projects/:path*",
    "/calendar/:path*",
    "/inbox/:path*",
    "/tim/:path*",
    "/profile/:path*",
  ],
};