import { supabase } from "@/utils/supabase";

type InsertMomentInput = {
  mediaUrl: string;
  caption: string;
  address: string;
  latitude: number;
  longitude: number;
  isPublic: boolean;
};

type InsertMomentResult = {
  id: string | null;
  error: string | null;
};

type UpdateMomentInput = {
  id: string;
  caption?: string;
  address?: string;
  isPublic?: boolean;
};

type SimpleResult = {
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
      is_public: input.isPublic,
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
    if (error.code === "42703") {
      return {
        id: null,
        error:
          "De kolom 'is_public' bestaat nog niet op de tabel moments. Voer eerst de SQL migratie uit (zie README of chat).",
      };
    }
    return {
      id: null,
      error: error.message ?? "Kon moment niet opslaan in Supabase.",
    };
  }

  return { id: data?.id ?? null, error: null };
}

export async function updateMomentInSupabase(
  input: UpdateMomentInput,
): Promise<SimpleResult> {
  const { data: authData, error: authError } = await supabase.auth.getUser();
  if (authError || !authData.user?.id) {
    return { error: "Je bent niet (meer) ingelogd." };
  }

  const patch: Record<string, unknown> = {};
  if (typeof input.caption === "string") patch.caption = input.caption;
  if (typeof input.address === "string") patch.address = input.address;
  if (typeof input.isPublic === "boolean") patch.is_public = input.isPublic;

  if (Object.keys(patch).length === 0) {
    return { error: null };
  }

  const { error } = await supabase
    .from("moments")
    .update(patch)
    .eq("id", input.id)
    .eq("user_id", authData.user.id);

  if (error) {
    if (error.code === "42501") {
      return {
        error:
          "RLS blokkeert deze update. Voeg een UPDATE policy toe op moments voor user_id = auth.uid().",
      };
    }
    if (error.code === "42703") {
      return {
        error:
          "De kolom 'is_public' bestaat nog niet op moments. Voer eerst de SQL migratie uit.",
      };
    }
    return { error: error.message ?? "Kon moment niet bijwerken." };
  }

  return { error: null };
}

export async function deleteMomentInSupabase(
  id: string,
): Promise<SimpleResult> {
  const { data: authData, error: authError } = await supabase.auth.getUser();
  if (authError || !authData.user?.id) {
    return { error: "Je bent niet (meer) ingelogd." };
  }

  const { error } = await supabase
    .from("moments")
    .delete()
    .eq("id", id)
    .eq("user_id", authData.user.id);

  if (error) {
    if (error.code === "42501") {
      return {
        error:
          "RLS blokkeert deze verwijdering. Voeg een DELETE policy toe op moments voor user_id = auth.uid().",
      };
    }
    return { error: error.message ?? "Kon moment niet verwijderen." };
  }

  return { error: null };
}
