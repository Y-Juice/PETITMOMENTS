import { supabase } from "@/utils/supabase";

/** Publieke storage bucket waarin de foto's van momenten staan. */
const MOMENTS_BUCKET = "moments";

type UploadImageResult = {
  url: string | null;
  error: string | null;
};

/** Zet een base64 string om naar bytes (atob bestaat op web en in Hermes). */
function base64ToBytes(base64: string): Uint8Array {
  const binary = atob(base64);
  const bytes = new Uint8Array(binary.length);
  for (let i = 0; i < binary.length; i++) {
    bytes[i] = binary.charCodeAt(i);
  }
  return bytes;
}

/**
 * Upload de gekozen foto naar Supabase Storage en geef de publieke URL terug.
 * We slaan de publieke URL op in moments.media_url, niet de lokale file:// uri,
 * zodat de afbeelding ook na herladen en op andere toestellen zichtbaar blijft.
 */
export async function uploadMomentImage(
  base64: string,
): Promise<UploadImageResult> {
  const { data: authData, error: authError } = await supabase.auth.getUser();
  if (authError || !authData.user?.id) {
    return {
      url: null,
      error: "Je bent niet (meer) ingelogd. Log opnieuw in en probeer opnieuw.",
    };
  }

  if (!base64) {
    return { url: null, error: "Kon de foto niet lezen. Kies de foto opnieuw." };
  }

  const bytes = base64ToBytes(base64);
  const path = `${authData.user.id}/${Date.now()}.jpg`;

  const { error: uploadError } = await supabase.storage
    .from(MOMENTS_BUCKET)
    .upload(path, bytes, { contentType: "image/jpeg", upsert: false });

  if (uploadError) {
    const message = uploadError.message ?? "";
    const lower = message.toLowerCase();
    if (lower.includes("bucket not found")) {
      return {
        url: null,
        error: `De storage bucket '${MOMENTS_BUCKET}' bestaat niet. Maak in Supabase Storage een publieke bucket met die naam aan.`,
      };
    }
    if (lower.includes("policy") || lower.includes("row-level security")) {
      return {
        url: null,
        error: `RLS blokkeert de upload. Voeg een INSERT policy toe op storage.objects voor de bucket '${MOMENTS_BUCKET}' (authenticated users).`,
      };
    }
    return { url: null, error: message || "Kon de foto niet uploaden." };
  }

  const { data: publicData } = supabase.storage
    .from(MOMENTS_BUCKET)
    .getPublicUrl(path);

  return { url: publicData?.publicUrl ?? null, error: null };
}

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
