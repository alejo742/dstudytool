import { cn } from "~/shared/lib/cn";

export function Skeleton({
  className,
  ...rest
}: React.HTMLAttributes<HTMLDivElement>) {
  return (
    <div
      className={cn(
        "relative overflow-hidden bg-rule/60 border border-rule",
        "before:absolute before:inset-0",
        "before:-translate-x-full before:bg-gradient-to-r",
        "before:from-transparent before:via-paper2 before:to-transparent",
        "before:animate-[shimmer_1.6s_infinite]",
        className,
      )}
      {...rest}
    />
  );
}
