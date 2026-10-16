import type { ReactNode } from "react";

export function DestSection({ id, letter, title, description, children, aside }: { id: string; letter: string; title: string; description?: ReactNode; children: ReactNode; aside?: ReactNode }) {
  return (
    <section id={id} aria-labelledby={`${id}-title`} className="scroll-mt-32 border-t border-sand-200 py-12 first:border-t-0 md:py-16">
      <div className="mb-6 flex flex-wrap items-end justify-between gap-3">
        <div className="max-w-2xl">
          <p className="text-xs font-semibold tracking-[0.14em] text-teal-600 uppercase">{letter}</p>
          <h2 id={`${id}-title`} className="font-display mt-1 text-3xl font-medium tracking-tight">
            {title}
          </h2>
          {description && <p className="mt-2 text-[15px] leading-relaxed text-muted">{description}</p>}
        </div>
        {aside}
      </div>
      {children}
    </section>
  );
}
