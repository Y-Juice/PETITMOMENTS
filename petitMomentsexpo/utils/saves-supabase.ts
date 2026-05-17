import { supabase } from "@/utils/supabase";

type SimpleResult = {
  error: string | null;
};

type FetchIdsResult = {
  ids: string[];
  error: string | null;
};

function explainError(code: string | undefined, table: string): string | null {
  if (code === "42P01") {
    return `De tabel '${table}' bestaat nog niet. Voer eerst de SQL migratie uit (zie chat).`;
  }
  if (code === "42501") {
    return `RLS blokkeert deze actie op '${table}'. Voeg de juiste policies toe.`;
  }
  return null;
}

async function getUserId(): Promise<string | null> {
  const { data, error } = await supabase.auth.getUser();
  if (error || !data.user?.id) return null;
  return data.user.id;
}

export async function fetchSavedMomentIds(): Promise<FetchIdsResult> {
  const userId = await getUserId();
  if (!userId) return { ids: [], error: null };

  const { data, error } = await supabase
    .from("saved_moments")
    .select("moment_id")
    .eq("user_id", userId);

  if (error) {
    const friendly = explainError(error.code, "saved_moments");
    return { ids: [], error: friendly ?? error.message };
  }

  const ids = (data ?? [])
    .map((row) => String((row as { moment_id?: unknown }).moment_id ?? ""))
    .filter(Boolean);

  return { ids, error: null };
}

export async function fetchSavedThreadIds(): Promise<FetchIdsResult> {
  const userId = await getUserId();
  if (!userId) return { ids: [], error: null };

  const { data, error } = await supabase
    .from("saved_threads")
    .select("thread_id")
    .eq("user_id", userId);

  if (error) {
    const friendly = explainError(error.code, "saved_threads");
    return { ids: [], error: friendly ?? error.message };
  }

  const ids = (data ?? [])
    .map((row) => String((row as { thread_id?: unknown }).thread_id ?? ""))
    .filter(Boolean);

  return { ids, error: null };
}

export async function addSavedMoment(momentId: string): Promise<SimpleResult> {
  const userId = await getUserId();
  if (!userId) return { error: "Je bent niet (meer) ingelogd." };

  const { error } = await supabase
    .from("saved_moments")
    .insert({ user_id: userId, moment_id: momentId });

  if (error) {
    // Duplicate save (already in the table): treat as success.
    if (error.code === "23505") return { error: null };
    const friendly = explainError(error.code, "saved_moments");
    return { error: friendly ?? error.message };
  }
  return { error: null };
}

export async function removeSavedMoment(momentId: string): Promise<SimpleResult> {
  const userId = await getUserId();
  if (!userId) return { error: "Je bent niet (meer) ingelogd." };

  const { error } = await supabase
    .from("saved_moments")
    .delete()
    .eq("user_id", userId)
    .eq("moment_id", momentId);

  if (error) {
    const friendly = explainError(error.code, "saved_moments");
    return { error: friendly ?? error.message };
  }
  return { error: null };
}

export async function addSavedThread(threadId: string): Promise<SimpleResult> {
  const userId = await getUserId();
  if (!userId) return { error: "Je bent niet (meer) ingelogd." };

  const { error } = await supabase
    .from("saved_threads")
    .insert({ user_id: userId, thread_id: threadId });

  if (error) {
    if (error.code === "23505") return { error: null };
    const friendly = explainError(error.code, "saved_threads");
    return { error: friendly ?? error.message };
  }
  return { error: null };
}

export async function removeSavedThread(threadId: string): Promise<SimpleResult> {
  const userId = await getUserId();
  if (!userId) return { error: "Je bent niet (meer) ingelogd." };

  const { error } = await supabase
    .from("saved_threads")
    .delete()
    .eq("user_id", userId)
    .eq("thread_id", threadId);

  if (error) {
    const friendly = explainError(error.code, "saved_threads");
    return { error: friendly ?? error.message };
  }
  return { error: null };
}
