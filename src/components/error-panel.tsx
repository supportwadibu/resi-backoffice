"use client";

import { RotateCw, TriangleAlert } from "lucide-react";

import { Button } from "./button";

/**
 * Message fixe plutôt que `error.message` : en production, Next.js remplace le
 * message des erreurs levées côté serveur par un texte générique en anglais.
 */
export function ErrorPanel({ reset }: { reset: () => void }) {
  return (
    <div className="flex gap-4 border border-border bg-surface p-6">
      <span className="flex size-10 shrink-0 items-center justify-center bg-danger-surface text-danger">
        <TriangleAlert aria-hidden className="size-5" />
      </span>
      <div>
        <h2 className="font-semibold">Impossible de charger cette page</h2>
        <p className="mt-1 text-sm text-muted">
          Le serveur n&apos;a pas répondu comme prévu. Réessayez dans un instant.
        </p>
        <Button onClick={reset} className="mt-4">
          <RotateCw aria-hidden className="size-4" />
          Réessayer
        </Button>
      </div>
    </div>
  );
}
