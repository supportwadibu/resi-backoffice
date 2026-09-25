"use client";

import { ErrorPanel } from "@/components/error-panel";

/**
 * Erreur du layout du tableau de bord lui-même (l'appel à `/auth/me`) : la
 * frontière d'erreur d'un segment ne couvre pas son propre layout.
 */
export default function RootError({ reset }: { error: Error; reset: () => void }) {
  return (
    <main className="flex flex-1 items-center justify-center p-4">
      <div className="w-full max-w-md">
        <ErrorPanel reset={reset} />
      </div>
    </main>
  );
}
