import { motion } from "motion/react";
import { FileText, Image as ImageIcon, FileType2, Trash2, RefreshCw } from "lucide-react";
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
      className="group flex items-center gap-3 px-4 py-3 bg-white border-b border-ink-100 last:border-b-0 hover:bg-ink-50 transition"
    >
      <div className="w-8 h-8 rounded-md bg-ink-100 text-ink-500 flex items-center justify-center">
        {iconFor(upload.mime_type)}
      </div>
      <div className="min-w-0 flex-1">
        <div className="flex items-center gap-2 min-w-0">
          <span className="truncate text-sm font-medium text-ink-900">
            {upload.filename}
          </span>
          <Badge tone={statusTone(upload.status)}>
            <StatusDot tone={statusTone(upload.status)} />
            {statusLabel(upload.status)}
          </Badge>
        </div>
        <p className="text-xs text-ink-500 mt-0.5">
          {fmtBytes(upload.size_bytes)}
          {upload.pages ? ` · ${upload.pages} pages` : ""}
          {upload.chars_extracted
            ? ` · ${upload.chars_extracted.toLocaleString()} chars extracted`
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
            className="w-8 h-8 inline-flex items-center justify-center rounded-md text-ink-500 hover:text-ink-900 hover:bg-ink-100"
            aria-label="Retry extraction"
            title="Retry"
          >
            <RefreshCw size={14} />
          </button>
        )}
        <button
          onClick={onDelete}
          className="w-8 h-8 inline-flex items-center justify-center rounded-md text-ink-500 hover:text-red-600 hover:bg-red-50"
          aria-label="Delete"
          title="Delete"
        >
          <Trash2 size={14} />
        </button>
      </div>
    </motion.div>
  );
}
