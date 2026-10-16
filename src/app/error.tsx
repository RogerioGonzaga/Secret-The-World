"use client";

import { AlertTriangle } from "lucide-react";
import { EmptyState } from "@/components/ui/primitives";
import { Button } from "@/components/ui/button";

export default function ErrorPage({ reset }: { error: Error & { digest?: string }; reset: () => void }) {
  return (
    <div className="container-page py-20">
      <EmptyState icon={<AlertTriangle />} title="Algo deu errado ao carregar esta página" description="Tente novamente. Se o problema continuar, volte mais tarde.">
        <Button onClick={reset}>Tentar novamente</Button>
      </EmptyState>
    </div>
  );
}
