import { apiFetch, ApiError } from "@/lib/api/client";

/**
 * Export du carnet clients, relayé depuis l'API en fichier JSON.
 *
 * Route handler et non server action : le navigateur reçoit un fichier à
 * enregistrer, pas une valeur à afficher. Seule `ApiError` est interceptée —
 * la redirection vers `/session-expiree` d'un 401 doit suivre son cours.
 */
export async function GET() {
  try {
    const { data } = await apiFetch<{ data: unknown }>("/admin/clients/export");
    const day = new Date().toISOString().slice(0, 10);

    return new Response(JSON.stringify(data, null, 2), {
      headers: {
        "Content-Type": "application/json; charset=utf-8",
        "Content-Disposition": `attachment; filename="clients-resi-${day}.json"`,
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
