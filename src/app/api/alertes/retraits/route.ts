import { apiFetch } from "@/lib/api/client";
import type { Paginated, Withdrawal } from "@/lib/api/types";

/**
 * Demandes de retrait en attente, pour l'alerte de l'en-tête.
 *
 * Route du backoffice et non appel direct à l'API : le navigateur ne parle
 * jamais à l'API, et les jetons restent dans les cookies httpOnly. Le proxy a
 * déjà rafraîchi le jeton ; un 401 malgré tout redirige comme partout.
 */
export async function GET() {
  const { data, meta } = await apiFetch<Paginated<Withdrawal>>("/admin/withdrawals", {
    query: { status: "pending", per_page: 5 },
  });

  return Response.json({
    count: meta.total,
    latest: data.map((withdrawal) => ({
      id: withdrawal.id,
      owner_name: withdrawal.owner?.full_name ?? null,
      net_amount: withdrawal.net_amount,
      created_at: withdrawal.created_at,
    })),
  });
}
