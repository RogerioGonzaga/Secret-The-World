import type { HTMLAttributes, ReactNode } from "react";
import Link from "next/link";
import { ArrowRight } from "lucide-react";
import { cn } from "@/lib/utils";

export function Card({ className, ...props }: HTMLAttributes<HTMLDivElement>) {
  return <div className={cn("rounded-2xl border border-sand-200 bg-white shadow-card", className)} {...props} />;
}

type Tone = "neutral" | "teal" | "navy" | "demo" | "copper" | "outline";
const tones: Record<Tone, string> = {
  neutral: "bg-sand-100 text-navy-800",
  teal: "bg-teal-50 text-teal-700",
  navy: "bg-navy-900 text-white",
  demo: "bg-demo-50 text-demo-700 ring-1 ring-demo-200",
  copper: "bg-copper-50 text-copper-600",
  outline: "ring-1 ring-sand-300 text-navy-800 bg-white",
};

export function Badge({ tone = "neutral", className, ...props }: HTMLAttributes<HTMLSpanElement> & { tone?: Tone }) {
  return <span className={cn("inline-flex items-center gap-1 rounded-full px-2.5 py-0.5 text-xs font-medium [&_svg]:size-3.5", tones[tone], className)} {...props} />;
}

export function SectionHeading({
  eyebrow,
  title,
  description,
  action,
  className,
  as: As = "h2",
}: {
  eyebrow?: string;
  title: ReactNode;
  description?: ReactNode;
  action?: { href: string; label: string };
  className?: string;
  as?: "h1" | "h2";
}) {
  return (
    <div className={cn("mb-8 flex flex-col gap-4 md:flex-row md:items-end md:justify-between", className)}>
      <div className="max-w-2xl">
        {eyebrow && <p className="mb-2 text-xs font-semibold tracking-[0.14em] text-teal-600 uppercase">{eyebrow}</p>}
        <As className="font-display text-3xl leading-tight font-medium tracking-tight text-ink md:text-[2.5rem]">{title}</As>
        {description && <p className="mt-3 text-base leading-relaxed text-muted md:text-lg">{description}</p>}
      </div>
      {action && (
        <Link href={action.href} className="group inline-flex items-center gap-1.5 text-sm font-medium text-navy-800 hover:text-teal-600">
          {action.label}
          <ArrowRight className="size-4 transition-transform group-hover:translate-x-0.5" aria-hidden />
        </Link>
      )}
    </div>
  );
}

export function EmptyState({ icon, title, description, children }: { icon?: ReactNode; title: string; description?: string; children?: ReactNode }) {
  return (
    <div className="flex flex-col items-center rounded-2xl border border-dashed border-sand-300 bg-white/60 px-6 py-14 text-center">
      {icon && <div className="mb-4 grid size-12 place-items-center rounded-full bg-sand-100 text-navy-700 [&_svg]:size-5">{icon}</div>}
      <h3 className="text-lg font-semibold text-ink">{title}</h3>
      {description && <p className="mt-2 max-w-md text-sm text-muted">{description}</p>}
      {children && <div className="mt-6 flex flex-wrap justify-center gap-3">{children}</div>}
    </div>
  );
}

export function Unavailable({ className, label = "Dados indisponíveis" }: { className?: string; label?: string }) {
  return <span className={cn("text-sm text-subtle italic", className)}>{label}</span>;
}

export function PageHeader({ eyebrow, title, description, children }: { eyebrow?: string; title: string; description?: ReactNode; children?: ReactNode }) {
  return (
    <div className="border-b border-sand-200 bg-white">
      <div className="container-page py-10 md:py-14">
        {eyebrow && <p className="mb-2 text-xs font-semibold tracking-[0.14em] text-teal-600 uppercase">{eyebrow}</p>}
        <h1 className="font-display max-w-3xl text-4xl leading-[1.08] font-medium tracking-tight md:text-5xl">{title}</h1>
        {description && <p className="mt-4 max-w-2xl text-lg leading-relaxed text-muted">{description}</p>}
        {children}
      </div>
    </div>
  );
}
