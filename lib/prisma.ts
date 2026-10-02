import { PrismaClient } from "../app/generated/prisma/client";
import { PrismaPg } from "@prisma/adapter-pg";

// pg-connection-string v3 menganggap sslmode "prefer", "require", dan "verify-ca"
// sebagai alias dari "verify-full", lalu menulis SECURITY WARNING ke console server.
// Kita tulis mode-nya secara eksplisit supaya perilaku koneksi tetap sama (tetap
// memverifikasi sertifikat) dan warning itu hilang — termasuk untuk env var di Vercel.
function normalizeSslMode(url: string | undefined) {
  if (!url) return url;
  return url.replace(
    /([?&])sslmode=(prefer|require|verify-ca)(?=&|$)/i,
    "$1sslmode=verify-full"
  );
}

const adapter = new PrismaPg({
  connectionString: normalizeSslMode(process.env.DATABASE_URL),
});

const globalForPrisma = globalThis as unknown as {
  prisma: PrismaClient | undefined;
};

export const prisma =
  globalForPrisma.prisma ?? new PrismaClient({ adapter });

if (process.env.NODE_ENV !== "production") {
  globalForPrisma.prisma = prisma;
}