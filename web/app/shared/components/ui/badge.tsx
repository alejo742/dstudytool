import { cn } from "~/shared/lib/cn";

type Tone = "neutral" | "success" | "warning" | "danger" | "accent";

const tones: Record<Tone, string> = {
  neutral: "bg-paper border-ink text-ink",
  success: "bg-green-wash border-green text-green",
  warning: "bg-hl-wash border-hl text-ink",
  danger: "bg-red-wash border-red text-red",
  accent: "bg-blue-wash border-blue text-blue",
};

export function Badge({
  tone = "neutral",
  className,
  children,
}: {
  tone?: Tone;
  className?: string;
  children: React.ReactNode;
}) {
  return (
    <span
      className={cn(
        "inline-flex items-center gap-1 px-1.5 h-5 text-[11px] font-head font-semibold border tracking-wide uppercase",
        tones[tone],
        className,
      )}
    >
      {children}
    </span>
  );
}

export function StatusDot({ tone = "neutral" }: { tone?: Tone }) {
  const colors: Record<Tone, string> = {
    neutral: "bg-ink3",
    success: "bg-green",
    warning: "bg-hl",
    danger: "bg-red",
    accent: "bg-blue",
  };
  return (
    <span className={cn("inline-block w-1.5 h-1.5", colors[tone])} />
  );
}
