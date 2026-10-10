import { cn } from "~/shared/lib/cn";

export function Card({
  className,
  children,
  ...rest
}: React.HTMLAttributes<HTMLDivElement>) {
  return (
    <div
      className={cn("bg-paper2 border-[1.5px] border-ink", className)}
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
  return <div className="h-px bg-ink" />;
}
