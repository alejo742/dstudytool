import { api } from "~/shared/lib/api";
import type { Generation } from "~/shared/types/domain";

export type GenerationKind = "problem" | "concept-check" | "walkthrough" | "mixed";

export const studyApi = {
  history: (planId: string, limit = 20) =>
    api<Generation[]>(`/plans/${planId}/generations?limit=${limit}`),
  next: (planId: string, kind: GenerationKind = "mixed", hint?: string) =>
    api<Generation>(`/plans/${planId}/generations`, {
      method: "POST",
      json: { kind, hint },
    }),
};
