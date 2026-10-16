import Link from "next/link";
import { cn } from "@/lib/utils";

/** Marca LIVORA: símbolo de órbita (um ponto que encontra seu lugar) + logotipo. */
export function LogoMark({ className }: { className?: string }) {
  return (
    <svg viewBox="0 0 32 32" aria-hidden className={cn("size-8", className)}>
      <rect width="32" height="32" rx="9" fill="#0b1b2b" />
      <circle cx="16" cy="16" r="8.5" fill="none" stroke="#a9d6d1" strokeWidth="1.6" strokeDasharray="40 14" strokeLinecap="round" transform="rotate(-35 16 16)" />
      <circle cx="16" cy="16" r="3.2" fill="#1e8f8a" />
      <circle cx="23.4" cy="11.6" r="1.9" fill="#c9773a" />
    </svg>
  );
}

export function Logo({ className, inverted }: { className?: string; inverted?: boolean }) {
  return (
    <Link href="/" className={cn("inline-flex items-center gap-2.5", className)} aria-label="LIVORA, página inicial">
      <LogoMark />
      <span className={cn("text-[17px] font-semibold tracking-[0.2em]", inverted ? "text-white" : "text-ink")}>LIVORA</span>
    </Link>
  );
}
