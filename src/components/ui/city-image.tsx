"use client";

import Image from "next/image";
import { useState } from "react";
import { MapPin } from "lucide-react";
import { cn } from "@/lib/utils";

/**
 * Fotografia de cidade com fallback elegante: se a imagem remota falhar,
 * mostra uma composição tipográfica com o nome do destino em vez de um ícone quebrado.
 */
export function CityImage({
  src,
  alt,
  name,
  sizes,
  priority,
  className,
}: {
  src: string;
  alt: string;
  name: string;
  sizes: string;
  priority?: boolean;
  className?: string;
}) {
  const [failed, setFailed] = useState(false);
  return (
    <div className={cn("relative overflow-hidden bg-navy-800", className)}>
      {failed ? (
        <div className="absolute inset-0 flex flex-col items-start justify-end bg-[radial-gradient(120%_80%_at_20%_10%,#1e8f8a_0%,#12283e_55%,#071320_100%)] p-5 text-white">
          {name && (
            <>
              <MapPin className="mb-2 size-5 opacity-70" aria-hidden />
              <span className="font-display text-2xl leading-tight opacity-90">{name}</span>
            </>
          )}
        </div>
      ) : (
        <Image src={src} alt={alt} fill sizes={sizes} priority={priority} className="object-cover" onError={() => setFailed(true)} />
      )}
    </div>
  );
}
