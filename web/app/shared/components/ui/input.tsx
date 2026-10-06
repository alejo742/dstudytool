import { forwardRef } from "react";
import { cn } from "~/shared/lib/cn";

type InputProps = React.InputHTMLAttributes<HTMLInputElement>;

export const Input = forwardRef<HTMLInputElement, InputProps>(
  ({ className, type = "text", ...rest }, ref) => (
    <input
      ref={ref}
      type={type}
      className={cn(
        "w-full h-10 px-3 text-sm rounded-md",
        "bg-ink-50 border border-ink-200 text-ink-900 placeholder:text-ink-400",
        "focus:outline-none focus:border-ink-900 focus:ring-2 focus:ring-ink-900/10",
        "transition",
        className,
      )}
      {...rest}
    />
  ),
);
Input.displayName = "Input";

type TextareaProps = React.TextareaHTMLAttributes<HTMLTextAreaElement>;
export const Textarea = forwardRef<HTMLTextAreaElement, TextareaProps>(
  ({ className, ...rest }, ref) => (
    <textarea
      ref={ref}
      className={cn(
        "w-full min-h-24 p-3 text-sm rounded-md",
        "bg-ink-50 border border-ink-200 text-ink-900 placeholder:text-ink-400",
        "focus:outline-none focus:border-ink-900 focus:ring-2 focus:ring-ink-900/10",
        "transition resize-y",
        className,
      )}
      {...rest}
    />
  ),
);
Textarea.displayName = "Textarea";
