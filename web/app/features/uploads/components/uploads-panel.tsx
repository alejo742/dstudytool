import { useEffect, useRef, useState } from "react";
import { AnimatePresence } from "motion/react";
import { toast } from "sonner";
import { uploadsApi } from "~/features/uploads/services/uploads-api";
import { Dropzone } from "~/features/uploads/components/dropzone";
import { UploadRow } from "~/features/uploads/components/upload-row";
import type { Upload } from "~/shared/types/domain";
import { Skeleton } from "~/shared/components/ui/skeleton";

const POLL_INTERVAL = 2500;

export function UploadsPanel({
  planId,
  onCountChange,
}: {
  planId: string;
  onCountChange?: (readyCount: number, totalCount: number) => void;
}) {
  const [uploads, setUploads] = useState<Upload[] | null>(null);
  const [uploadingNames, setUploadingNames] = useState<string[]>([]);
  const pollTimer = useRef<number | null>(null);

  const notify = (list: Upload[]) => {
    const ready = list.filter((u) => u.status === "ready").length;
    onCountChange?.(ready, list.length);
  };

  const refresh = async () => {
    try {
      const list = await uploadsApi.list(planId);
      setUploads(list);
      notify(list);
      const anyPending = list.some(
        (u) => u.status === "pending" || u.status === "extracting",
      );
      if (anyPending) {
        pollTimer.current = window.setTimeout(refresh, POLL_INTERVAL);
      }
    } catch (e) {
      // leave previous state; show toast only once
      console.warn(e);
    }
  };

  useEffect(() => {
    void refresh();
    return () => {
      if (pollTimer.current) window.clearTimeout(pollTimer.current);
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [planId]);

  const onFiles = async (files: File[]) => {
    setUploadingNames((prev) => [...prev, ...files.map((f) => f.name)]);
    for (const file of files) {
      try {
        const created = await uploadsApi.upload(planId, file);
        setUploads((prev) => (prev ? [created, ...prev] : [created]));
      } catch (e) {
        toast.error(
          `${file.name}: ${e instanceof Error ? e.message : "upload failed"}`,
        );
      } finally {
        setUploadingNames((prev) => prev.filter((n) => n !== file.name));
      }
    }
    void refresh();
  };

  const onDelete = async (u: Upload) => {
    const prev = uploads;
    setUploads((p) => p?.filter((x) => x.id !== u.id) ?? null);
    try {
      await uploadsApi.remove(planId, u.id);
      toast.success("Removed");
    } catch (e) {
      setUploads(prev);
      toast.error(e instanceof Error ? e.message : "Delete failed");
    }
  };

  const onReprocess = async (u: Upload) => {
    try {
      const updated = await uploadsApi.reprocess(planId, u.id);
      setUploads((p) =>
        p ? p.map((x) => (x.id === u.id ? updated : x)) : [updated],
      );
      toast.success("Re-queued");
      void refresh();
    } catch (e) {
      toast.error(e instanceof Error ? e.message : "Retry failed");
    }
  };

  return (
    <div className="flex flex-col gap-4">
      <Dropzone onFiles={onFiles} />

      {uploads === null && (
        <div className="flex flex-col gap-2">
          <Skeleton className="h-14" />
          <Skeleton className="h-14" />
        </div>
      )}

      {uploads && (uploads.length > 0 || uploadingNames.length > 0) && (
        <div className="bg-paper2 border-[1.5px] border-ink">
          {uploadingNames.map((name) => (
            <div
              key={`uploading-${name}`}
              className="flex items-center gap-3 px-4 py-3 border-b border-rule last:border-b-0 bg-blue-wash/40"
            >
              <div className="w-9 h-9 bg-blue-wash border border-blue text-blue flex items-center justify-center">
                <span className="w-3 h-3 border-2 border-blue/30 border-t-blue animate-spin" />
              </div>
              <div className="flex-1 min-w-0">
                <span className="truncate text-sm font-semibold text-ink block">
                  {name}
                </span>
                <p className="text-xs text-ink2 mt-0.5 font-head">Uploading…</p>
              </div>
            </div>
          ))}
          <AnimatePresence>
            {uploads.map((u) => (
              <UploadRow
                key={u.id}
                upload={u}
                onDelete={() => onDelete(u)}
                onReprocess={() => onReprocess(u)}
              />
            ))}
          </AnimatePresence>
        </div>
      )}
    </div>
  );
}
