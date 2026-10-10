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
        "relative border-[1.5px] border-dashed p-10 text-center transition bg-grid-sm",
        dragging ? "border-blue bg-blue-wash" : "border-ink hover:bg-hl-wash/40",
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
        className="mx-auto w-12 h-12 bg-paper2 border-[1.5px] border-ink flex items-center justify-center text-ink mb-4"
      >
        <UploadIcon size={18} />
      </motion.div>

      <p className="font-head font-bold text-2xl text-ink leading-none">
        Drop course materials here
      </p>
      <p className="text-ink2 mt-2">
        PDFs, slides, images, DOCX, text — anything you have.
      </p>

      <button
        type="button"
        onClick={() => inputRef.current?.click()}
        className="mt-6 btn btn-pri"
      >
        Choose files
      </button>
    </div>
  );
}
