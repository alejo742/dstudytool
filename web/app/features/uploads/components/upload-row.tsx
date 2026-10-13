import { motion } from "motion/react";
import {
  FileText,
  Image as ImageIcon,
  FileType2,
  Trash2,
  RefreshCw,
} from "lucide-react";
import type { Upload } from "~/shared/types/domain";
import { Badge, StatusDot } from "~/shared/components/ui/badge";
import { cn } from "~/shared/lib/cn";

function iconFor(mime: string) {
  if (mime.startsWith("image/")) return <ImageIcon size={14} />;
  if (mime === "application/pdf") return <FileType2 size={14} />;
  return <FileText size={14} />;
}

function statusTone(status: Upload["status"]) {
  switch (status) {
    case "ready":
      return "success" as const;
    case "failed":
      return "danger" as const;
    case "extracting":
      return "accent" as const;
    default:
      return "neutral" as const;
  }
}

function statusLabel(status: Upload["status"]) {
  switch (status) {
    case "pending":
      return "Pending";
    case "extracting":
      return "Extracting";
    case "ready":
      return "Ready";
    case "failed":
      return "Failed";
  }
}

function fmtBytes(n: number) {
  if (n < 1024) return `${n} B`;
  if (n < 1024 * 1024) return `${(n / 1024).toFixed(0)} KB`;
  return `${(n / (1024 * 1024)).toFixed(1)} MB`;
}

export function UploadRow({
  upload,
  onDelete,
  onReprocess,
}: {
  upload: Upload;
  onDelete: () => void;
  onReprocess: () => void;
}) {
  return (
    <motion.div
      layout
      initial={{ opacity: 0, y: 4 }}
      animate={{ opacity: 1, y: 0 }}
      exit={{ opacity: 0 }}
      className="group flex items-center gap-3 px-4 py-3 bg-paper2 border-b border-rule last:border-b-0 hover:bg-hl-wash/40 transition"
    >
      <div className="w-9 h-9 bg-paper border border-rule text-ink2 flex items-center justify-center shrink-0">
        {iconFor(upload.mime_type)}
      </div>
      <div className="min-w-0 flex-1">
        <div className="flex items-center gap-2 min-w-0 flex-wrap">
          <span className="truncate text-sm font-semibold text-ink">
            {upload.filename}
          </span>
          <Badge tone={statusTone(upload.status)}>
            <StatusDot tone={statusTone(upload.status)} />
            {statusLabel(upload.status)}
          </Badge>
          {upload.content_type && (
            <span
              className="text-[10px] font-head font-semibold uppercase tracking-wide text-ink3 bg-paper border border-rule px-1.5"
              title="Classified content"
            >
              {upload.content_type}
            </span>
          )}
          {upload.course_type && upload.course_type !== "other" && (
            <span
              className="text-[10px] font-head font-semibold uppercase tracking-wide text-ink3 bg-paper border border-rule px-1.5"
              title="Course type"
            >
              {upload.course_type}
            </span>
          )}
        </div>
        <p className="text-xs text-ink3 mt-0.5 font-mono">
          {fmtBytes(upload.size_bytes)}
          {upload.pages ? ` · ${upload.pages} pages` : ""}
          {upload.chars_extracted
            ? ` · ${upload.chars_extracted.toLocaleString()} chars`
            : ""}
          {upload.error ? ` · ${upload.error}` : ""}
        </p>
      </div>
      <div
        className={cn(
          "flex items-center gap-1 opacity-0 group-hover:opacity-100 transition",
        )}
      >
        {upload.status === "failed" && (
          <button
            onClick={onReprocess}
            className="w-8 h-8 inline-flex items-center justify-center border-[1.5px] border-transparent text-ink2 hover:text-ink hover:border-ink hover:bg-hl-wash"
            aria-label="Retry extraction"
            title="Retry"
          >
            <RefreshCw size={14} />
          </button>
        )}
        <button
          onClick={onDelete}
          className="w-8 h-8 inline-flex items-center justify-center border-[1.5px] border-transparent text-ink2 hover:text-red hover:border-red hover:bg-red-wash"
          aria-label="Delete"
          title="Delete"
        >
          <Trash2 size={14} />
        </button>
      </div>
    </motion.div>
  );
}
