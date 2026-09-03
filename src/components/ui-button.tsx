import { Slot } from "@radix-ui/react-slot";
import type { ButtonHTMLAttributes } from "react";
import { clsx } from "clsx";

export function Button({ asChild = false, className, ...props }: ButtonHTMLAttributes<HTMLButtonElement> & { asChild?: boolean }) {
  const Component = asChild ? Slot : "button";
  return <Component className={clsx(className)} {...props} />;
}
