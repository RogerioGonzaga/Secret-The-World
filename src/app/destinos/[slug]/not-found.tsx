import Link from "next/link";
import { MapPinOff } from "lucide-react";
import { EmptyState } from "@/components/ui/primitives";
import { buttonVariants } from "@/components/ui/button";

export default function DestinationNotFound() {
  return (
    <div className="container-page py-20">
      <EmptyState icon={<MapPinOff />} title="Destino não encontrado" description="Esse destino ainda não faz parte do Partiu Morar ou o endereço mudou.">
        <Link href="/destinos" className={buttonVariants()}>Explorar destinos</Link>
      </EmptyState>
    </div>
  );
}
