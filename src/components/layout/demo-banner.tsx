import Link from "next/link";
import { FlaskConical } from "lucide-react";
import { showDemoData } from "@/lib/config";
import { t } from "@/lib/i18n";

export function DemoBanner() {
  if (!showDemoData) return null;
  return (
    <div className="border-b border-demo-200 bg-demo-50 text-demo-700" role="note">
      <div className="container-page flex items-start gap-2 py-2 text-xs leading-relaxed sm:items-center sm:text-[13px]">
        <FlaskConical className="mt-0.5 size-4 shrink-0 sm:mt-0" aria-hidden />
        <p>
          {t.demo.banner}{" "}
          <Link href="/metodologia#dados-demonstrativos" className="font-semibold underline underline-offset-2">
            {t.demo.learnMore}
          </Link>
        </p>
      </div>
    </div>
  );
}

export function DemoInline({ children = "Valores demonstrativos" }: { children?: React.ReactNode }) {
  if (!showDemoData) return null;
  return (
    <span className="inline-flex items-center gap-1 rounded-full bg-demo-50 px-2 py-0.5 text-[11px] font-medium text-demo-700 ring-1 ring-demo-200">
      <FlaskConical className="size-3" aria-hidden />
      {children}
    </span>
  );
}
