import { useCallback, useRef, useState } from "react";
import { motion } from "motion/react";
import { Upload as UploadIcon } from "lucide-react";
import { cn } from "~/shared/lib/cn";

type DropzoneProps = {
  onFiles: (files: File[]) => void;
  disabled?: boolean;
  accept?: string;
};

export function Dropzone({ onFiles, disabled, accept }: DropzoneProps) {
  const [dragging, setDragging] = useState(false);
  const inputRef = useRef<HTMLInputElement>(null);

  const handle = useCallback(
    (list: FileList | null) => {
      if (!list || list.length === 0) return;
      onFiles(Array.from(list));
    },
    [onFiles],
  );

  return (
    <div
      onDragOver={(e) => {
        e.preventDefault();
        if (!disabled) setDragging(true);
      }}
      onDragLeave={() => setDragging(false)}
      onDrop={(e) => {
        e.preventDefault();
        setDragging(false);
        if (disabled) return;
        handle(e.dataTransfer.files);
      }}
      className={cn(
        "relative border border-dashed rounded-xl p-10 text-center transition",
        dragging
          ? "border-ink-900 bg-ink-100/50"
          : "border-ink-200 hover:border-ink-300 bg-ink-50/60",
        disabled && "opacity-50 pointer-events-none",
      )}
    >
      <input
        ref={inputRef}
        type="file"
        multiple
        accept={accept}
        className="sr-only"
        onChange={(e) => handle(e.target.files)}
      />

      <motion.div
        animate={{ scale: dragging ? 1.05 : 1 }}
        transition={{ type: "spring", stiffness: 300, damping: 20 }}
        className="mx-auto w-12 h-12 rounded-md bg-white border border-ink-200 flex items-center justify-center text-ink-500 mb-4"
      >
        <UploadIcon size={18} />
      </motion.div>

      <p className="font-serif text-xl text-ink-900">
        Drop course materials here
      </p>
      <p className="text-sm text-ink-500 mt-1">
        PDFs, slides, images, DOCX, text — anything you have.
      </p>

      <button
        type="button"
        onClick={() => inputRef.current?.click()}
        className="mt-6 inline-flex items-center gap-2 px-4 h-10 rounded-md bg-ink-900 text-ink-50 text-sm hover:bg-ink-800 transition"
      >
        Choose files
      </button>
    </div>
  );
}
