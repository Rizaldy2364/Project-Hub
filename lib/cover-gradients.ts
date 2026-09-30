export const coverGradients = {
  indigo: {
    label: "Indigo",
    background: "linear-gradient(135deg, #4f46e5 0%, #4338ca 50%, #6b21a8 100%)",
  },
  ocean: {
    label: "Ocean",
    background: "linear-gradient(135deg, #0f766e 0%, #0f4c81 50%, #1d4ed8 100%)",
  },
  sunset: {
    label: "Sunset",
    background: "linear-gradient(135deg, #ea580c 0%, #e11d48 52%, #9333ea 100%)",
  },
  forest: {
    label: "Forest",
    background: "linear-gradient(135deg, #047857 0%, #059669 50%, #0f766e 100%)",
  },
} as const;

export type CoverGradient = keyof typeof coverGradients;

export function isCoverGradient(value: string): value is CoverGradient {
  return value in coverGradients;
}
