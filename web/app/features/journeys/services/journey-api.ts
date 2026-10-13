import { api } from "~/shared/lib/api";
import type {
  AttemptResult,
  CompleteModuleResponse,
  Journey,
  ModuleDetail,
} from "~/shared/types/domain";

export const journeyApi = {
  create: (planId: string) =>
    api<Journey>(`/plans/${planId}/journey`, { method: "POST" }),

  get: (journeyId: string) => api<Journey>(`/journeys/${journeyId}`),

  getModule: (journeyId: string, ordinal: number) =>
    api<ModuleDetail>(`/journeys/${journeyId}/modules/${ordinal}`),

  submitAttempt: (
    journeyId: string,
    ordinal: number,
    checkpointId: string,
    answer: string,
  ) =>
    api<AttemptResult>(
      `/journeys/${journeyId}/modules/${ordinal}/attempts`,
      {
        method: "POST",
        json: { checkpoint_id: checkpointId, answer },
      },
    ),

  complete: (journeyId: string, ordinal: number) =>
    api<CompleteModuleResponse>(
      `/journeys/${journeyId}/modules/${ordinal}/complete`,
      { method: "POST" },
    ),
};
