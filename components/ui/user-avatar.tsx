import { cn } from "@/lib/utils";

const palette = [
  "bg-blue-500",
  "bg-violet-500",
  "bg-emerald-500",
  "bg-rose-500",
  "bg-amber-500",
  "bg-sky-500",
];

const sizes = {
  sm: "w-8 h-8 text-xs",
  md: "w-9 h-9 text-sm",
};

function colorFor(name: string) {
  let sum = 0;
  for (const ch of name) sum += ch.charCodeAt(0);
  return palette[sum % palette.length];
}

interface UserAvatarProps {
  name?: string | null;
  image?: string | null;
  size?: keyof typeof sizes;
  className?: string;
}

export function UserAvatar({ name, image, size = "md", className }: UserAvatarProps) {
  if (image) {
    // eslint-disable-next-line @next/next/no-img-element
    return (
      <img
        src={image}
        alt={name ?? "Avatar"}
        className={cn("rounded-full object-cover", sizes[size], className)}
      />
    );
  }

  const label = name?.trim() || "User";
  return (
    <div
      className={cn(
        "rounded-full flex items-center justify-center text-white font-semibold shrink-0",
        colorFor(label),
        sizes[size],
        className
      )}
    >
      {label[0].toUpperCase()}
    </div>
  );
}