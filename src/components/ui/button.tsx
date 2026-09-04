import { Slot } from "@radix-ui/react-slot";
import type { ButtonHTMLAttributes } from "react";
import { cn } from "@/lib/utils";

type ButtonVariant = "default" | "secondary" | "ghost" | "outline";
type ButtonSize = "default" | "sm" | "lg" | "icon";

const variantClasses: Record<ButtonVariant, string> = {
  default: "bg-[var(--accent)] text-[var(--ink)] shadow-[0_10px_24px_rgba(72,81,0,.22)] hover:bg-[var(--accent-strong)]",
  secondary: "bg-[var(--surface-note)] text-[var(--ink)] hover:bg-[var(--surface-active)]",
  ghost: "text-[var(--ink)] hover:bg-[var(--surface-note)]",
  outline: "border border-[var(--line)] bg-[var(--surface)] text-[var(--ink)] hover:border-[var(--line-strong)] hover:bg-[var(--surface-raised)]",
};

const sizeClasses: Record<ButtonSize, string> = {
  default: "h-10 px-4 text-sm",
  sm: "h-8 px-3 text-xs",
  lg: "h-12 px-5 text-sm",
  icon: "size-10",
};

export function Button({ asChild = false, className, size = "default", variant = "default", ...props }: ButtonHTMLAttributes<HTMLButtonElement> & { asChild?: boolean; size?: ButtonSize; variant?: ButtonVariant }) {
  const Component = asChild ? Slot : "button";

  return <Component className={cn("inline-flex shrink-0 items-center justify-center gap-2 rounded-[10px] font-semibold transition-[background-color,border-color,box-shadow,transform] duration-150 ease-out active:translate-y-px disabled:pointer-events-none disabled:opacity-50", variantClasses[variant], sizeClasses[size], className)} {...props} />;
}
