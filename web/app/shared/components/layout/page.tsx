import { cn } from "~/shared/lib/cn";

export function Page({
  className,
  children,
  ...rest
}: React.HTMLAttributes<HTMLDivElement>) {
  return (
    <div
      className={cn("max-w-6xl mx-auto px-6 py-10", className)}
      {...rest}
    >
      {children}
    </div>
  );
}

export function PageHeader({
  eyebrow,
  title,
  description,
  actions,
}: {
  eyebrow?: string;
  title: React.ReactNode;
  description?: React.ReactNode;
  actions?: React.ReactNode;
}) {
  return (
    <div className="flex items-end justify-between gap-6 mb-8">
      <div>
        {eyebrow && (
          <p className="text-xs tracking-[0.2em] uppercase text-ink-400 mb-2">
            {eyebrow}
          </p>
        )}
        <h1 className="font-serif text-3xl md:text-4xl text-ink-900 text-balance">
          {title}
        </h1>
        {description && (
          <p className="text-ink-500 mt-2 max-w-xl text-pretty">
            {description}
          </p>
        )}
      </div>
      {actions && <div className="flex items-center gap-2">{actions}</div>}
    </div>
  );
}
