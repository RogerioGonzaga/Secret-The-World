import Link from "next/link";
import { Compass } from "lucide-react";
import { EmptyState } from "@/components/ui/primitives";
import { buttonVariants } from "@/components/ui/button";

export default function NotFound() {
  return (
    <div className="container-page py-20">
      <EmptyState icon={<Compass />} title="Página não encontrada" description="O endereço pode ter mudado. Que tal explorar destinos?">
        <Link href="/destinos" className={buttonVariants()}>Explorar destinos</Link>
        <Link href="/" className={buttonVariants({ variant: "outline" })}>Página inicial</Link>
      </EmptyState>
    </div>
  );
}
