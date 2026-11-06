import { apiFetch, ApiError } from "@/lib/api/client";
import type { AccountExportPreview } from "@/lib/api/types";

/**
 * Volumes de chaque section exportable, lus à l'ouverture du dialogue
 * d'export plutôt qu'au rendu de la fiche : une trentaine de comptages,
 * inutiles tant que l'export n'est pas demandé.
 */
export async function GET(_request: Request, ctx: RouteContext<"/comptes/[id]/export/apercu">) {
  const { id } = await ctx.params;

  try {
    const { data } = await apiFetch<{ data: AccountExportPreview }>(
      `/admin/users/${encodeURIComponent(id)}/export/preview`,
    );
    return Response.json({ data });
  } catch (error) {
    if (error instanceof ApiError) {
      return Response.json({ code: error.code, message: error.message }, { status: error.status });
    }
    throw error;
  }
}
