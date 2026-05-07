import { supabase } from "@/utils/supabase";

type InsertMomentInput = {
  mediaUrl: string;
  caption: string;
  address: string;
  latitude: number;
  longitude: number;
};

type InsertMomentResult = {
  id: string | null;
  error: string | null;
};

async function ensureProfileRow(userId: string): Promise<string | null> {
  const { error } = await supabase
    .from("profiles")
    .upsert({ id: userId }, { onConflict: "id" });

  if (!error) return null;

  // profiles table missing in this project
  if (error.code === "42P01") return null;

  // RLS or permissions issue on profiles
  if (error.code === "42501") {
    return "Je profiel kan niet automatisch aangemaakt worden door RLS op profiles. Voeg een INSERT policy toe op profiles voor authenticated users.";
  }

  return error.message ?? "Kon profielrij niet controleren in profiles.";
}

export async function insertMomentInSupabase(
  input: InsertMomentInput,
): Promise<InsertMomentResult> {
  const { data: authData, error: authError } = await supabase.auth.getUser();
  if (authError || !authData.user?.id) {
    return {
      id: null,
      error: "Je bent niet (meer) ingelogd. Log opnieuw in en probeer opnieuw.",
    };
  }

  const profileError = await ensureProfileRow(authData.user.id);
  if (profileError) {
    return { id: null, error: profileError };
  }

  const locationPoint = `SRID=4326;POINT(${input.longitude} ${input.latitude})`;

  const { data, error } = await supabase
    .from("moments")
    .insert({
      user_id: authData.user.id,
      type: "photo",
      media_url: input.mediaUrl,
      caption: input.caption,
      address: input.address,
      location: locationPoint,
    })
    .select("id")
    .single();

  if (error) {
    if (error.code === "23503") {
      return {
        id: null,
        error:
          "Foreign key fout: moments.user_id verwijst naar een user/profiel rij die niet bestaat. Controleer of profiles.id = auth.uid() bestaat.",
      };
    }
    if (error.code === "42501") {
      return {
        id: null,
        error:
          "RLS blokkeert deze insert. Controleer je Supabase policy: authenticated users moeten mogen inserten met user_id = auth.uid().",
      };
    }
    return {
      id: null,
      error: error.message ?? "Kon moment niet opslaan in Supabase.",
    };
  }

  return { id: data?.id ?? null, error: null };
}
