import { cn } from "~/shared/lib/cn";

export function EmptyState({
  icon,
  title,
  description,
  action,
  className,
}: {
  icon?: React.ReactNode;
  title: string;
  description?: string;
  action?: React.ReactNode;
  className?: string;
}) {
  return (
    <div
      className={cn(
        "border border-dashed border-ink-200 rounded-xl p-10 text-center",
        className,
      )}
    >
      {icon && (
        <div className="mx-auto mb-4 w-10 h-10 flex items-center justify-center text-ink-400">
          {icon}
        </div>
      )}
      <h3 className="font-serif text-xl text-ink-900">{title}</h3>
      {description && (
        <p className="text-sm text-ink-500 mt-2 max-w-sm mx-auto text-pretty">
          {description}
        </p>
      )}
      {action && <div className="mt-6 flex justify-center">{action}</div>}
    </div>
  );
}
