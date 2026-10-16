import { forwardRef, type ButtonHTMLAttributes } from "react";
import { cn } from "@/lib/utils";

export type ButtonVariant = "primary" | "secondary" | "outline" | "ghost" | "light";
export type ButtonSize = "sm" | "md" | "lg" | "icon";

const variants: Record<ButtonVariant, string> = {
  primary: "bg-navy-900 text-white hover:bg-navy-800 shadow-[0_1px_2px_rgb(11_27_43/0.2)]",
  secondary: "bg-teal-600 text-white hover:bg-teal-700 shadow-[0_1px_2px_rgb(15_95_93/0.25)]",
  outline: "border border-sand-300 bg-white text-ink hover:border-navy-600/40 hover:bg-sand-50",
  ghost: "text-navy-800 hover:bg-sand-100",
  light: "bg-white/95 text-ink hover:bg-white shadow-[0_1px_2px_rgb(0_0_0/0.1)]",
};

const sizes: Record<ButtonSize, string> = {
  sm: "h-9 px-3.5 text-sm gap-1.5 rounded-lg",
  md: "h-11 px-5 text-[15px] gap-2 rounded-xl",
  lg: "h-13 px-7 text-base gap-2 rounded-xl",
  icon: "h-10 w-10 rounded-xl",
};

export function buttonVariants({ variant = "primary", size = "md", className }: { variant?: ButtonVariant; size?: ButtonSize; className?: string } = {}) {
  return cn(
    "inline-flex shrink-0 items-center justify-center font-medium whitespace-nowrap transition-all duration-200 active:scale-[0.98] disabled:pointer-events-none disabled:opacity-50 [&_svg]:size-4 [&_svg]:shrink-0",
    variants[variant],
    sizes[size],
    className,
  );
}

export interface ButtonProps extends ButtonHTMLAttributes<HTMLButtonElement> {
  variant?: ButtonVariant;
  size?: ButtonSize;
}

export const Button = forwardRef<HTMLButtonElement, ButtonProps>(function Button({ className, variant, size, type = "button", ...props }, ref) {
  return <button ref={ref} type={type} className={buttonVariants({ variant, size, className })} {...props} />;
});
