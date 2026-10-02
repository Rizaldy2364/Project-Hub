"use client";

import { useState, useTransition } from "react";
import { Loader2 } from "lucide-react";
import { updateProfileDetailsAction } from "@/actions/user.actions";
import { TagInput } from "@/components/ui/tag-input";
import { genderLabels } from "@/lib/profile-labels";

export interface PersonalInfoValues {
  headline: string;
  company: string;
  location: string;
  website: string;
  githubUrl: string;
  linkedinUrl: string;
  gender: string;
  birthDate: string; // format yyyy-MM-dd
  skills: string[];
  languages: string[];
}

interface PersonalInfoFormProps {
  initial: PersonalInfoValues;
  onSaved: () => void;
  onCancel: () => void;
}

export function PersonalInfoForm({ initial, onSaved, onCancel }: PersonalInfoFormProps) {
  const [values, setValues] = useState(initial);
  const [skills, setSkills] = useState(initial.skills);
  const [languages, setLanguages] = useState(initial.languages);
  const [error, setError] = useState<string | null>(null);
  const [fieldErrors, setFieldErrors] = useState<Record<string, string[]>>({});
  const [isPending, startTransition] = useTransition();

  function update(key: Exclude<keyof PersonalInfoValues, "skills" | "languages">, value: string) {
    setValues((prev) => ({ ...prev, [key]: value }));
  }

  function submit() {
    const formData = new FormData();
    formData.set("headline", values.headline);
    formData.set("company", values.company);
    formData.set("location", values.location);
    formData.set("website", values.website);
    formData.set("githubUrl", values.githubUrl);
    formData.set("linkedinUrl", values.linkedinUrl);
    formData.set("gender", values.gender);
    formData.set("birthDate", values.birthDate);
    skills.forEach((skill) => formData.append("skills", skill));
    languages.forEach((language) => formData.append("languages", language));

    startTransition(async () => {
      const result = await updateProfileDetailsAction(formData);
      if (result.error) {
        if (typeof result.error === "string") {
          setError(result.error);
        } else {
          setFieldErrors(result.error as Record<string, string[]>);
          setError("Ada data yang belum sesuai, mohon dicek kembali.");
        }
        return;
      }
      setError(null);
      setFieldErrors({});
      onSaved();
    });
  }

  return (
    <div className="space-y-5">
      <div className="grid gap-4 sm:grid-cols-2">
        <TextField
          id="headline"
          label="Headline / Jabatan"
          placeholder="Frontend Developer"
          maxLength={80}
          value={values.headline}
          onChange={(value) => update("headline", value)}
          error={fieldErrors.headline?.[0]}
        />
        <TextField
          id="company"
          label="Perusahaan / Kampus"
          placeholder="PT Contoh Digital"
          maxLength={80}
          value={values.company}
          onChange={(value) => update("company", value)}
          error={fieldErrors.company?.[0]}
        />
        <TextField
          id="location"
          label="Lokasi"
          placeholder="Jakarta, Indonesia"
          maxLength={80}
          value={values.location}
          onChange={(value) => update("location", value)}
          error={fieldErrors.location?.[0]}
        />
        <div>
          <label htmlFor="birthDate" className="text-xs font-semibold text-slate-600 dark:text-slate-300">
            Tanggal Lahir
          </label>
          <input
            id="birthDate"
            type="date"
            value={values.birthDate}
            max={new Date().toISOString().slice(0, 10)}
            onChange={(event) => update("birthDate", event.target.value)}
            className="mt-1.5 w-full rounded-xl border border-slate-200 bg-white px-3 py-2.5 text-sm text-slate-800 outline-none ring-blue-500 transition focus:ring-2 dark:border-slate-700 dark:bg-slate-800 dark:text-slate-100"
          />
          <p className="mt-1.5 text-[11px] text-slate-500 dark:text-slate-400">
            Umur dihitung otomatis dari tanggal lahir, jadi tidak perlu diisi manual.
          </p>
          <FieldError message={fieldErrors.birthDate?.[0]} />
        </div>
        <div>
          <label htmlFor="gender" className="text-xs font-semibold text-slate-600 dark:text-slate-300">
            Jenis Kelamin
          </label>
          <select
            id="gender"
            value={values.gender}
            onChange={(event) => update("gender", event.target.value)}
            className="mt-1.5 w-full rounded-xl border border-slate-200 bg-white px-3 py-2.5 text-sm text-slate-800 outline-none ring-blue-500 transition focus:ring-2 dark:border-slate-700 dark:bg-slate-800 dark:text-slate-100"
          >
            <option value="">Belum diisi</option>
            {Object.entries(genderLabels).map(([value, label]) => (
              <option key={value} value={value}>
                {label}
              </option>
            ))}
          </select>
          <FieldError message={fieldErrors.gender?.[0]} />
        </div>
        <TextField
          id="website"
          label="Website / Portofolio"
          placeholder="https://portofolio-kamu.com"
          type="url"
          maxLength={200}
          value={values.website}
          onChange={(value) => update("website", value)}
          error={fieldErrors.website?.[0]}
        />
        <TextField
          id="githubUrl"
          label="GitHub"
          placeholder="https://github.com/username"
          type="url"
          maxLength={200}
          value={values.githubUrl}
          onChange={(value) => update("githubUrl", value)}
          error={fieldErrors.githubUrl?.[0]}
        />
        <TextField
          id="linkedinUrl"
          label="LinkedIn"
          placeholder="https://linkedin.com/in/username"
          type="url"
          maxLength={200}
          value={values.linkedinUrl}
          onChange={(value) => update("linkedinUrl", value)}
          error={fieldErrors.linkedinUrl?.[0]}
        />
      </div>

      <div className="grid gap-4 sm:grid-cols-2">
        <TagInput
          id="skills"
          label="Keahlian"
          values={skills}
          onChange={setSkills}
          placeholder="Tulis keahlian lalu tekan Enter"
          hint="Maksimal 15 keahlian. Contoh: React, Prisma, UI Design."
          maxItems={15}
          maxLength={30}
        />
        <TagInput
          id="languages"
          label="Bahasa"
          values={languages}
          onChange={setLanguages}
          placeholder="Tulis bahasa lalu tekan Enter"
          hint="Maksimal 10 bahasa. Contoh: Indonesia, Inggris."
          maxItems={10}
          maxLength={30}
        />
      </div>

      {error && (
        <p role="alert" className="rounded-xl bg-red-50 px-3.5 py-2.5 text-xs font-medium text-red-700 dark:bg-red-500/10 dark:text-red-300">
          {error}
        </p>
      )}

      <div className="flex justify-end gap-2 border-t border-slate-100 pt-4 dark:border-slate-800">
        <button
          type="button"
          onClick={onCancel}
          disabled={isPending}
          className="rounded-xl px-3 py-2 text-sm font-semibold text-slate-600 transition-colors hover:bg-slate-100 disabled:opacity-60 dark:text-slate-300 dark:hover:bg-slate-800"
        >
          Cancel
        </button>
        <button
          type="button"
          onClick={submit}
          disabled={isPending}
          className="inline-flex items-center gap-2 rounded-xl bg-blue-600 px-4 py-2 text-sm font-semibold text-white transition-colors hover:bg-blue-700 disabled:cursor-wait disabled:opacity-70"
        >
          {isPending && <Loader2 className="h-4 w-4 animate-spin" />}
          {isPending ? "Saving..." : "Save changes"}
        </button>
      </div>
    </div>
  );
}

function TextField({
  id,
  label,
  value,
  onChange,
  placeholder,
  maxLength,
  type = "text",
  error,
}: {
  id: string;
  label: string;
  value: string;
  onChange: (value: string) => void;
  placeholder?: string;
  maxLength?: number;
  type?: "text" | "url";
  error?: string;
}) {
  return (
    <div>
      <label htmlFor={id} className="text-xs font-semibold text-slate-600 dark:text-slate-300">
        {label}
      </label>
      <input
        id={id}
        type={type}
        value={value}
        maxLength={maxLength}
        placeholder={placeholder}
        onChange={(event) => onChange(event.target.value)}
        className="mt-1.5 w-full rounded-xl border border-slate-200 bg-white px-3 py-2.5 text-sm text-slate-800 outline-none ring-blue-500 transition focus:ring-2 dark:border-slate-700 dark:bg-slate-800 dark:text-slate-100"
      />
      <FieldError message={error} />
    </div>
  );
}

function FieldError({ message }: { message?: string }) {
  if (!message) return null;
  return <p className="mt-1.5 text-[11px] font-medium text-red-600 dark:text-red-400">{message}</p>;
}

