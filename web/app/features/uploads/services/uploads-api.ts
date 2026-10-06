import { api, apiUpload } from "~/shared/lib/api";
import type { Upload } from "~/shared/types/domain";

export const uploadsApi = {
  list: (planId: string) => api<Upload[]>(`/plans/${planId}/uploads`),
  upload: (planId: string, file: File) => {
    const fd = new FormData();
    fd.append("file", file);
    return apiUpload<Upload>(`/plans/${planId}/uploads`, fd);
  },
  remove: (planId: string, uploadId: string) =>
    api<void>(`/plans/${planId}/uploads/${uploadId}`, { method: "DELETE" }),
  reprocess: (planId: string, uploadId: string) =>
    api<Upload>(`/plans/${planId}/uploads/${uploadId}/reprocess`, {
      method: "POST",
    }),
};
