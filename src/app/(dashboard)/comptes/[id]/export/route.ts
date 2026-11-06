import { apiFetch, ApiError } from "@/lib/api/client";

/**
 * Export d'un compte et des sections choisies, relayé depuis l'API en fichier
 * JSON. `sections` : clés séparées par des virgules, transmises telles quelles.
 *
 * Seule `ApiError` est interceptée — la redirection vers `/session-expiree`
 * d'un 401 doit suivre son cours.
 */
export async function GET(request: Request, ctx: RouteContext<"/comptes/[id]/export">) {
  const { id } = await ctx.params;
  const sections = new URL(request.url).searchParams.get("sections") ?? "";

  try {
    const { data } = await apiFetch<{ data: unknown }>(`/admin/users/${encodeURIComponent(id)}/export`, {
      query: { sections: sections || undefined },
    });
    const day = new Date().toISOString().slice(0, 10);
    // Identifiant Firestore : alphanumérique, sûr dans un nom de fichier.
    const safeId = id.replace(/[^A-Za-z0-9_-]/g, "");

    return new Response(JSON.stringify(data, null, 2), {
      headers: {
        "Content-Type": "application/json; charset=utf-8",
        "Content-Disposition": `attachment; filename="compte-${safeId}-${day}.json"`,
        "Cache-Control": "no-store",
      },
    });
  } catch (error) {
    if (error instanceof ApiError) {
      return Response.json({ code: error.code, message: error.message }, { status: error.status });
    }
    throw error;
  }
}
