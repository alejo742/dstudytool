import { cn } from "~/shared/lib/cn";

export function Card({
  className,
  children,
  ...rest
}: React.HTMLAttributes<HTMLDivElement>) {
  return (
    <div
      className={cn(
        "bg-white border border-ink-200/70 rounded-lg",
        className,
      )}
      {...rest}
    >
      {children}
    </div>
  );
}

export function CardSection({
  className,
  ...rest
}: React.HTMLAttributes<HTMLDivElement>) {
  return <div className={cn("p-5", className)} {...rest} />;
}

export function CardDivider() {
  return <div className="h-px bg-ink-200/70" />;
}
