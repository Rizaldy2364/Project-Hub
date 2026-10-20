import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  experimental: {
    // Mengaktifkan `forbidden()` / `unauthorized()` dari "next/navigation".
    // Dipakai halaman Pengaturan project: role selain ADMIN mendapat 403
    // (bukan redirect) saat mencoba membuka /projects/[id]/pengaturan.
    authInterrupts: true,
  },
};

export default nextConfig;
