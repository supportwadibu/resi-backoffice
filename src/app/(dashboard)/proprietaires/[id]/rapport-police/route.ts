import { apiFetchFile, ApiError } from "@/lib/api/client";

const PERIODS = new Set(["this_month", "last_month", "this_year", "custom"]);

/**
 * Registre de police d'un propriétaire, relayé depuis l'API.
 *
 * Route handler et non server action : une action renvoie du JSON sérialisable,
 * pas un PDF. Le navigateur ne parle qu'à ce handler — jamais à l'API —, qui
 * joint le jeton lu dans les cookies httpOnly.
 *
 * Une erreur de l'API revient en `{ code, message }` avec son statut : le
 * dialogue appelant l'affiche en son sein. Seule `ApiError` est interceptée —
 * la redirection vers `/session-expiree` d'un 401 doit suivre son cours.
 */
export async function POST(request: Request, ctx: RouteContext<"/proprietaires/[id]/rapport-police">) {
  const { id } = await ctx.params;
  const form = await request.formData();

  const period = String(form.get("period") ?? "");
  if (!PERIODS.has(period)) {
    return Response.json({ code: "invalid_period", message: "Choisissez une période." }, { status: 422 });
  }

  const field = (name: string) => {
    const value = form.get(name);
    return typeof value === "string" && value.trim() !== "" ? value.trim() : undefined;
  };

  try {
    const file = await apiFetchFile(`/admin/owners/${encodeURIComponent(id)}/reports/police`, {
      method: "POST",
      body: {
        period,
        // L'API refuse `from`/`to` hors période personnalisée.
        ...(period === "custom" ? { from: field("from"), to: field("to") } : {}),
        residence_id: field("residence_id"),
        commune: field("commune"),
      },
    });

    return new Response(file.body, {
      headers: {
        "Content-Type": file.contentType,
        // Nom composé par l'API de valeurs qu'elle maîtrise (`[a-z0-9-]`) ;
        // le repli reste constant.
        "Content-Disposition": `attachment; filename="${file.filename ?? "rapport-police.pdf"}"`,
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
