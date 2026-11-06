import { apiFetch, ApiError } from "@/lib/api/client";
import type { AccountImportReport } from "@/lib/api/types";

/**
 * Import d'un compte : le fichier choisi est relayé tel quel à l'API.
 *
 * Route handler plutôt que server action : une action plafonne son corps à
 * 1 Mo par défaut, qu'un compte chargé de réservations dépasse.
 */
export async function POST(request: Request) {
  const file = (await request.formData()).get("file");
  if (!(file instanceof File) || file.size === 0) {
    return Response.json({ code: "file_required", message: "Choisissez un fichier d'export." }, { status: 422 });
  }

  const form = new FormData();
  form.append("file", file, file.name);

  try {
    const { data } = await apiFetch<{ data: AccountImportReport }>("/admin/users/import", {
      method: "POST",
      form,
    });
    return Response.json({ data });
  } catch (error) {
    if (error instanceof ApiError) {
      return Response.json({ code: error.code, message: error.message }, { status: error.status });
    }
    throw error;
  }
}
