import { supabase } from "@/utils/supabase";

export type VoteDirection = "up" | "down";

export type VoteRow = {
  user_id: string;
  item_id: string;
  direction: VoteDirection;
};

type SimpleResult = {
  error: string | null;
};

type FetchAllVotesResult = {
  rows: VoteRow[];
  error: string | null;
};

function explainError(code: string | undefined, table: string): string | null {
  if (code === "42P01") {
    return `De tabel '${table}' bestaat nog niet. Voer eerst de SQL migratie uit.`;
  }
  if (code === "42501") {
    return `RLS blokkeert deze actie op '${table}'. Controleer de policies.`;
  }
  return null;
}

async function getUserId(): Promise<string | null> {
  const { data, error } = await supabase.auth.getUser();
  if (error || !data.user?.id) return null;
  return data.user.id;
}

function normaliseRows(
  raw: Record<string, unknown>[],
  itemKey: "moment_id" | "thread_id",
): VoteRow[] {
  const out: VoteRow[] = [];
  for (const row of raw) {
    const userId = String(row.user_id ?? "");
    const itemId = String(row[itemKey] ?? "");
    const dirRaw = String(row.direction ?? "").toLowerCase();
    if (!userId || !itemId) continue;
    if (dirRaw !== "up" && dirRaw !== "down") continue;
    out.push({ user_id: userId, item_id: itemId, direction: dirRaw });
  }
  return out;
}

export async function fetchAllMomentVotes(): Promise<FetchAllVotesResult> {
  const { data, error } = await supabase
    .from("moment_votes")
    .select("user_id, moment_id, direction");

  if (error) {
    const friendly = explainError(error.code, "moment_votes");
    return { rows: [], error: friendly ?? error.message };
  }

  return {
    rows: normaliseRows(
      (data ?? []) as Record<string, unknown>[],
      "moment_id",
    ),
    error: null,
  };
}

export async function fetchAllThreadVotes(): Promise<FetchAllVotesResult> {
  const { data, error } = await supabase
    .from("thread_votes")
    .select("user_id, thread_id, direction");

  if (error) {
    const friendly = explainError(error.code, "thread_votes");
    return { rows: [], error: friendly ?? error.message };
  }

  return {
    rows: normaliseRows(
      (data ?? []) as Record<string, unknown>[],
      "thread_id",
    ),
    error: null,
  };
}

/**
 * Set the current user's vote for a moment or remove it (`direction = null`).
 * Uses upsert on (user_id, moment_id) so re-voting overwrites the previous row.
 */
export async function setMomentVote(
  momentId: string,
  direction: VoteDirection | null,
): Promise<SimpleResult> {
  const userId = await getUserId();
  if (!userId) return { error: "Je bent niet (meer) ingelogd." };

  if (direction === null) {
    const { error } = await supabase
      .from("moment_votes")
      .delete()
      .eq("user_id", userId)
      .eq("moment_id", momentId);
    if (error) {
      const friendly = explainError(error.code, "moment_votes");
      return { error: friendly ?? error.message };
    }
    return { error: null };
  }

  const { error } = await supabase
    .from("moment_votes")
    .upsert(
      { user_id: userId, moment_id: momentId, direction },
      { onConflict: "user_id,moment_id" },
    );

  if (error) {
    const friendly = explainError(error.code, "moment_votes");
    return { error: friendly ?? error.message };
  }
  return { error: null };
}

export async function setThreadVote(
  threadId: string,
  direction: VoteDirection | null,
): Promise<SimpleResult> {
  const userId = await getUserId();
  if (!userId) return { error: "Je bent niet (meer) ingelogd." };

  if (direction === null) {
    const { error } = await supabase
      .from("thread_votes")
      .delete()
      .eq("user_id", userId)
      .eq("thread_id", threadId);
    if (error) {
      const friendly = explainError(error.code, "thread_votes");
      return { error: friendly ?? error.message };
    }
    return { error: null };
  }

  const { error } = await supabase
    .from("thread_votes")
    .upsert(
      { user_id: userId, thread_id: threadId, direction },
      { onConflict: "user_id,thread_id" },
    );

  if (error) {
    const friendly = explainError(error.code, "thread_votes");
    return { error: friendly ?? error.message };
  }
  return { error: null };
}
