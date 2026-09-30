// Label tampilan untuk enum Gender (Prisma: MALE | FEMALE | OTHER | UNDISCLOSED).
export const genderLabels: Record<string, string> = {
  MALE: "Pria",
  FEMALE: "Wanita",
  OTHER: "Lainnya",
  UNDISCLOSED: "Tidak ingin menyebutkan",
};

export function genderLabel(value: string | null | undefined): string | null {
  if (!value) return null;
  return genderLabels[value] ?? value;
}
