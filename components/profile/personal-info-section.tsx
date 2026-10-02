"use client";

import { useState } from "react";
import { Pencil } from "lucide-react";
import { Dialog, DialogContent, DialogTrigger } from "@/components/ui/dialog";
import { PersonalInfoDetails } from "@/components/profile/personal-info-details";
import {
  PersonalInfoForm,
  type PersonalInfoValues,
} from "@/components/profile/personal-info-form";

interface PersonalInfoSectionProps {
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
}

/** Blok "Detail personal" di kartu Personal Information milik user yang sedang login (bisa diedit). */
export function PersonalInfoSection({
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
}: PersonalInfoSectionProps) {
  const [isOpen, setIsOpen] = useState(false);

  const initial: PersonalInfoValues = {
    headline: headline ?? "",
    company: company ?? "",
    location: location ?? "",
    website: website ?? "",
    githubUrl: githubUrl ?? "",
    linkedinUrl: linkedinUrl ?? "",
    gender: gender ?? "",
    birthDate: birthDate ? birthDate.slice(0, 10) : "",
    skills,
    languages,
  };

  return (
    <div className="mt-6 border-t border-slate-100 pt-6 dark:border-slate-800">
      <div className="flex items-start justify-between gap-4">
        <div>
          <h3 className="text-sm font-bold text-slate-950 dark:text-white">Detail personal</h3>
          <p className="mt-1 text-xs text-slate-500 dark:text-slate-400">
            Umur, gender, keahlian, bahasa, dan tautan profil publikmu.
          </p>
        </div>

        <Dialog open={isOpen} onOpenChange={setIsOpen}>
          <DialogTrigger asChild>
            <button
              type="button"
              className="inline-flex shrink-0 items-center gap-1.5 rounded-xl border border-blue-200 bg-white px-3 py-2 text-xs font-semibold text-blue-700 transition-colors hover:bg-blue-50 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-blue-500 dark:border-blue-400/30 dark:bg-slate-900 dark:text-blue-300 dark:hover:bg-blue-500/10"
            >
              <Pencil className="h-3.5 w-3.5" />
              Edit detail
            </button>
          </DialogTrigger>
          <DialogContent title="Edit detail personal">
            <div className="max-h-[70vh] overflow-y-auto pr-1">
              <PersonalInfoForm
                initial={initial}
                onSaved={() => setIsOpen(false)}
                onCancel={() => setIsOpen(false)}
              />
            </div>
          </DialogContent>
        </Dialog>
      </div>

      <PersonalInfoDetails
        className="mt-5"
        headline={headline}
        company={company}
        location={location}
        website={website}
        githubUrl={githubUrl}
        linkedinUrl={linkedinUrl}
        birthDate={birthDate}
        gender={gender}
        skills={skills}
        languages={languages}
      />
    </div>
  );
}
