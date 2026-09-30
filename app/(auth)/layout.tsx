import { AuthShowcase } from "@/components/auth/auth-showcase";
import { ThemeToggle } from "@/components/ui/theme-toggle";

export default function AuthLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <div className="min-h-screen grid grid-cols-1 lg:grid-cols-2">
      <AuthShowcase />
      <div className="relative flex items-center justify-center px-6 py-12 lg:px-16 bg-white dark:bg-zinc-950">
        <div className="absolute top-6 right-6">
          <ThemeToggle />
        </div>
        <div className="w-full max-w-md">{children}</div>
      </div>
    </div>
  );
}