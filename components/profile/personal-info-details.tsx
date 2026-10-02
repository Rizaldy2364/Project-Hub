import { type ReactNode } from "react";
import { format } from "date-fns";
import { id as idLocale } from "date-fns/locale";
import {
  Briefcase,
  Building2,
  CakeSlice,
  Code2,
  Globe,
  Languages,
  Link2,
  MapPin,
  Sparkles,
  UsersRound,
} from "lucide-react";
import { calculateAge, cn } from "@/lib/utils";
import { genderLabel } from "@/lib/profile-labels";

export interface PersonalInfoDetailsProps {
  headline: string | null;
  company: string | null;
  location: string | null;
  website: string | null;
  githubUrl: string | null;
  linkedinUrl: string | null;
  birthDate: string | null; // ISO string
  gender: string | null;
  skills: string[];
  languages: string[];
  className?: string;
}

/**
 * Tampilan (read-only) detail personal dengan 2 kolom ala profile modern:
 * kiri = identitas (jabatan, perusahaan, lokasi, umur, gender),
 * kanan = keahlian, bahasa, dan tautan publik.
 */
export function PersonalInfoDetails({
  headline,
  company,
  location,
  website,
  githubUrl,
  linkedinUrl,
  birthDate,
  gender,
  skills,
  languages,
  className,
}: PersonalInfoDetailsProps) {
  const age = birthDate ? calculateAge(birthDate) : null;

  const links = [
    { href: website, label: "Website", icon: Globe },
    { href: githubUrl, label: "GitHub", icon: Code2 },
    { href: linkedinUrl, label: "LinkedIn", icon: Link2 },
  ].flatMap((link) => (link.href ? [{ ...link, href: link.href }] : []));

  const genderText = genderLabel(gender);
  const divider = "divide-y divide-slate-100 dark:divide-slate-800";

  return (
    <div className={cn("@container", className)}>
      <div className="grid gap-x-8 @lg:grid-cols-2">
        {/* Kolom kiri — identitas */}
        <dl className={divider}>
          <InfoRow icon={Briefcase} label="Headline / Jabatan">
            {headline || <Empty />}
          </InfoRow>
          <InfoRow icon={Building2} label="Perusahaan / Kampus">
            {company || <Empty />}
          </InfoRow>
          <InfoRow icon={MapPin} label="Lokasi">
            {location || <Empty />}
          </InfoRow>
          <InfoRow icon={CakeSlice} label="Umur">
            {age !== null && birthDate ? (
              <span suppressHydrationWarning>
                {age} tahun • {format(new Date(birthDate), "d MMMM yyyy", { locale: idLocale })}
              </span>
            ) : (
              <Empty />
            )}
          </InfoRow>
          <InfoRow icon={UsersRound} label="Jenis Kelamin">
            {genderText || <Empty />}
          </InfoRow>
        </dl>

        {/* Kolom kanan — keahlian & tautan */}
        <dl
          className={cn(
            divider,
            "border-t border-slate-100 pt-1 @lg:border-t-0 @lg:pt-0 dark:border-slate-800"
          )}
        >
          <InfoRow icon={Sparkles} label="Keahlian">
            {skills.length > 0 ? <Chips values={skills} /> : <Empty />}
          </InfoRow>
          <InfoRow icon={Languages} label="Bahasa">
            {languages.length > 0 ? <Chips values={languages} /> : <Empty />}
          </InfoRow>
          <InfoRow icon={Globe} label="Tautan">
            {links.length > 0 ? (
              <div className="flex flex-wrap gap-2">
                {links.map((link) => (
                  <a
                    key={link.label}
                    href={link.href}
                    target="_blank"
                    rel="noreferrer noopener"
                    className="inline-flex items-center gap-1.5 rounded-lg bg-slate-100 px-2.5 py-1 text-xs font-semibold text-slate-700 transition-colors hover:bg-blue-50 hover:text-blue-700 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-blue-500 dark:bg-slate-800 dark:text-slate-200 dark:hover:bg-blue-500/10 dark:hover:text-blue-300"
                  >
                    <link.icon className="h-3.5 w-3.5" />
                    {link.label}
                  </a>
                ))}
              </div>
            ) : (
              <Empty />
            )}
          </InfoRow>
        </dl>
      </div>
    </div>
  );
}

function InfoRow({
  icon: Icon,
  label,
  children,
}: {
  icon: typeof Briefcase;
  label: string;
  children: ReactNode;
}) {
  return (
    <div className="flex items-start gap-3 py-4 first:pt-0">
      <span className="flex h-8 w-8 shrink-0 items-center justify-center rounded-lg bg-slate-100 text-slate-500 dark:bg-slate-800 dark:text-slate-400">
        <Icon className="h-4 w-4" />
      </span>
      <div className="min-w-0 flex-1">
        <dt className="text-xs font-semibold uppercase tracking-wide text-slate-500 dark:text-slate-400">
          {label}
        </dt>
        <dd className="mt-0.5 text-sm font-medium text-slate-800 dark:text-slate-100">{children}</dd>
      </div>
    </div>
  );
}

function Chips({ values }: { values: string[] }) {
  return (
    <ul className="flex flex-wrap gap-1.5">
      {values.map((value) => (
        <li
          key={value}
          className="rounded-md bg-blue-50 px-2 py-0.5 text-[11px] font-semibold text-blue-700 dark:bg-blue-500/15 dark:text-blue-300"
        >
          {value}
        </li>
      ))}
    </ul>
  );
}

function Empty() {
  return <span className="text-sm font-normal italic text-slate-400 dark:text-slate-500">Belum diisi</span>;
}

