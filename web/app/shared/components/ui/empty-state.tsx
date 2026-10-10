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
        "border-[1.5px] border-dashed border-ink bg-paper2 p-10 text-center",
        className,
      )}
    >
      {icon && (
        <div className="mx-auto mb-4 w-12 h-12 flex items-center justify-center border-[1.5px] border-ink bg-paper text-ink">
          {icon}
        </div>
      )}
      <h3 className="font-head font-bold text-2xl text-ink leading-none">{title}</h3>
      {description && (
        <p className="text-ink2 mt-3 max-w-sm mx-auto text-pretty">
          {description}
        </p>
      )}
      {action && <div className="mt-6 flex justify-center">{action}</div>}
    </div>
  );
}
