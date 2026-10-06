import { api } from "~/shared/lib/api";
import type { Plan } from "~/shared/types/domain";

export const plansApi = {
  list: () => api<Plan[]>("/plans"),
  get: (id: string) => api<Plan>(`/plans/${id}`),
  create: (input: { title: string; course_code?: string; description?: string }) =>
    api<Plan>("/plans", { method: "POST", json: input }),
  remove: (id: string) =>
    api<void>(`/plans/${id}`, { method: "DELETE" }),
};
