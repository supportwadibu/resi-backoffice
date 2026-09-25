"use client";

import { ErrorPanel } from "@/components/error-panel";

/** Erreur d'une page : la navigation reste affichée autour. */
export default function DashboardError({ reset }: { error: Error; reset: () => void }) {
  return <ErrorPanel reset={reset} />;
}
