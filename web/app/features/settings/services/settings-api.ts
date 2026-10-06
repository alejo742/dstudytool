import { api } from "~/shared/lib/api";
import type { ApiKeyStatus } from "~/shared/types/domain";

export const settingsApi = {
  getKeyStatus: () => api<ApiKeyStatus>("/me/api-key"),
  setKey: (key: string) =>
    api<ApiKeyStatus>("/me/api-key", {
      method: "PUT",
      json: { key },
    }),
  verifyKey: () =>
    api<ApiKeyStatus>("/me/api-key/verify", { method: "POST" }),
  removeKey: () => api<void>("/me/api-key", { method: "DELETE" }),
};
