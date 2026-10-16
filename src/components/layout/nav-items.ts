import { BriefcaseBusiness, Calculator, Compass, GitCompareArrows, Sparkles } from "lucide-react";
import { t } from "@/lib/i18n";

export const navItems = [
  { href: "/destinos", label: t.nav.explore, icon: Compass },
  { href: "/comparar", label: t.nav.compare, icon: GitCompareArrows },
  { href: "/custo-de-vida", label: t.nav.cost, icon: Calculator },
  { href: "/trabalho", label: t.nav.work, icon: BriefcaseBusiness },
  { href: "/destino-ideal", label: t.nav.quiz, icon: Sparkles },
] as const;
