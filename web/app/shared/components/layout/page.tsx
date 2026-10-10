import { cn } from "~/shared/lib/cn";

export function Page({
  className,
  children,
  ...rest
}: React.HTMLAttributes<HTMLDivElement>) {
  return (
    <div
      className={cn("max-w-5xl mx-auto px-6 py-10", className)}
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
    <div className="pb-6 mb-8 border-b border-ink">
      <div className="flex items-end justify-between gap-6 flex-wrap">
        <div>
          {eyebrow && <p className="eyebrow mb-2">{eyebrow}</p>}
          <h1 className="font-head font-bold text-4xl md:text-5xl leading-[1] text-balance">
            {title}
          </h1>
          {description && (
            <p className="text-ink2 mt-3 max-w-xl text-pretty text-[1.02rem]">
              {description}
            </p>
          )}
        </div>
        {actions && <div className="flex items-center gap-2">{actions}</div>}
      </div>
    </div>
  );
}
