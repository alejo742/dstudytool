import { useId } from "react";
import { cn } from "~/shared/lib/cn";

type FieldProps = {
  label: string;
  hint?: string;
  error?: string;
  required?: boolean;
  className?: string;
  children: (ids: { id: string; describedBy: string | undefined }) => React.ReactNode;
};

export function Field({
  label,
  hint,
  error,
  required,
  className,
  children,
}: FieldProps) {
  const id = useId();
  const hintId = hint || error ? `${id}-hint` : undefined;
  return (
    <div className={cn("flex flex-col gap-1.5", className)}>
      <label
        htmlFor={id}
        className="text-xs font-medium text-ink-700 tracking-wide"
      >
        {label}
        {required && <span className="text-red-500 ml-0.5">*</span>}
      </label>
      {children({ id, describedBy: hintId })}
      {(error || hint) && (
        <p
          id={hintId}
          className={cn(
            "text-xs",
            error ? "text-red-600" : "text-ink-500",
          )}
        >
          {error ?? hint}
        </p>
      )}
    </div>
  );
}
