import { isSupabaseConfigured, supabase } from "./supabase";
import { parseImportedRecipe } from "../utils/recipeImport";

// Whether "import from a link" can work at all: the fetch has to happen
// server-side (CORS), which needs the import-recipe edge function, which
// needs Supabase to be configured. Local-only mode hides the feature.
export const isRecipeImportAvailable = isSupabaseConfigured;

// Fetch a recipe page via the import-recipe edge function and parse its
// structured data into this app's recipe fields. Throws an Error with a
// user-facing message on any failure.
export async function importRecipeFromUrl(rawUrl) {
  const url = String(rawUrl || "").trim();
  if (!/^https?:\/\//i.test(url)) {
    throw new Error("Paste a full link, starting with http(s)://");
  }

  const { data, error } = await supabase.functions.invoke("import-recipe", {
    body: { url },
  });

  if (error) {
    // FunctionsHttpError carries the function's JSON body with the friendly
    // message; fall back to a generic one when it isn't readable.
    let message = "Couldn't reach that page.";
    try {
      const body = await error.context?.json?.();
      if (body?.error) message = body.error;
    } catch {
      // keep the generic message
    }
    throw new Error(message);
  }

  const parsed = parseImportedRecipe({
    jsonLd: data?.jsonLd || [],
    url: data?.url || url,
    siteName: data?.siteName || "",
  });

  if (!parsed) {
    throw new Error(
      "No recipe found on that page — you can still add it manually."
    );
  }

  return parsed;
}
