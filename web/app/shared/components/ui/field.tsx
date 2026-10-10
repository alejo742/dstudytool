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
        className="font-head font-semibold text-sm text-ink tracking-wide"
      >
        {label}
        {required && <span className="text-red ml-0.5">*</span>}
      </label>
      {children({ id, describedBy: hintId })}
      {(error || hint) && (
        <p
          id={hintId}
          className={cn(
            "text-xs font-head",
            error ? "text-red" : "text-ink3",
          )}
        >
          {error ?? hint}
        </p>
      )}
    </div>
  );
}
