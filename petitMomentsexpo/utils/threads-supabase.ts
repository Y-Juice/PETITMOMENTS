import { supabase } from "@/utils/supabase";

export type InsertThreadFromMapInput = {
  title: string;
  orderedMomentIds: string[];
  contentSummary: string;
};

type InsertThreadResult = {
  id: string | null;
  error: string | null;
};

async function ensureProfileRow(userId: string): Promise<string | null> {
  const { error } = await supabase
    .from("profiles")
    .upsert({ id: userId }, { onConflict: "id" });

  if (!error) return null;
  if (error.code === "42P01") return null;
  if (error.code === "42501") {
    return "Je profiel kan niet automatisch aangemaakt worden door RLS op profiles. Voeg een INSERT policy toe op profiles voor authenticated users.";
  }
  return error.message ?? "Kon profielrij niet controleren in profiles.";
}

function isMissingColumnError(message: string, column: string): boolean {
  const m = message.toLowerCase();
  const c = column.toLowerCase();
  if (!m.includes(c)) return false;
  return (
    m.includes("schema cache") ||
    m.includes("does not exist") ||
    m.includes("pgrst204")
  );
}

function interpretInsertError(
  error: { code?: string; message?: string },
): InsertThreadResult | null {
  if (error.code === "23503") {
    return {
      id: null,
      error:
        "Foreign key: controleer of user_id/created_by en moment-id’s kloppen (profiles, moments).",
    };
  }
  if (error.code === "42501") {
    return {
      id: null,
      error:
        "RLS blokkeert deze actie. Controleer INSERT-policies op threads en thread_moments.",
    };
  }
  return null;
}

type MomentLinkRow = Record<string, unknown>;

async function insertMomentLinksForThread(
  threadId: string,
  orderedMomentIds: string[],
  addedByUserId: string,
): Promise<string | null> {
  const threadKey = "thread_id";
  const momentKey = "moment_id";

  /** Volgorde: petitMoments schema (order_index + added_by), daarna alternatieven. */
  const variants: MomentLinkRow[][] = [
    orderedMomentIds.map((moment_id, order_index) => ({
      [threadKey]: threadId,
      [momentKey]: moment_id,
      order_index,
      added_by: addedByUserId,
    })),
    orderedMomentIds.map((moment_id, order_index) => ({
      [threadKey]: threadId,
      [momentKey]: moment_id,
      order_index,
    })),
    orderedMomentIds.map((moment_id, position) => ({
      [threadKey]: threadId,
      [momentKey]: moment_id,
      position,
    })),
    orderedMomentIds.map((moment_id, i) => ({
      [threadKey]: threadId,
      [momentKey]: moment_id,
      sort_order: i,
    })),
    orderedMomentIds.map((moment_id) => ({
      [threadKey]: threadId,
      [momentKey]: moment_id,
    })),
  ];

  let lastMsg = "";

  for (const rows of variants) {
    const { error } = await supabase.from("thread_moments").insert(rows);
    if (!error) {
      return null;
    }
    lastMsg = error.message ?? "Onbekende fout thread_moments";
    const msg = lastMsg.toLowerCase();
    const retry =
      msg.includes("column") ||
      msg.includes("schema cache") ||
      msg.includes("does not exist");
    if (!retry) {
      return lastMsg;
    }
  }

  return lastMsg;
}

export async function insertThreadFromMapInSupabase(
  input: InsertThreadFromMapInput,
): Promise<InsertThreadResult> {
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

  const userId = authData.user.id;
  const title =
    input.title.trim() || `Thread (${input.orderedMomentIds.length} momenten)`;
  const description = input.contentSummary;

  /** Volgorde: petitMoments DB (threads + thread_moments), daarna oudere varianten. */
  const threadPayloads: Record<string, unknown>[] = [
    {
      user_id: userId,
      created_by: userId,
      title,
      description,
      is_public: true,
      color: "#C44536",
    },
    {
      user_id: userId,
      created_by: userId,
      title,
      description,
      is_public: true,
    },
    { user_id: userId, title, description, is_public: true, created_by: userId },
    { user_id: userId, title, description, is_public: true },
    { user_id: userId, created_by: userId, title, description },
    { user_id: userId, title, description },
    {
      user_id: userId,
      title,
      description: `${description}\n[legacy route]\n${JSON.stringify({ momentIds: input.orderedMomentIds })}`,
    },
  ];

  let threadId: string | null = null;
  let lastMessage = "";

  for (const payload of threadPayloads) {
    const res = await supabase
      .from("threads")
      .insert(payload)
      .select("id")
      .single();

    if (!res.error && res.data?.id) {
      threadId = String(res.data.id);
      lastMessage = "";
      break;
    }

    lastMessage = res.error?.message ?? "Kon thread niet opslaan.";
    const hard = res.error ? interpretInsertError(res.error) : null;
    if (hard) {
      return hard;
    }

    const msg = lastMessage;
    const cols = Object.keys(payload);
    const missingCol = cols.some((col) => isMissingColumnError(msg, col));
    if (!missingCol && res.error) {
      return { id: null, error: lastMessage };
    }
  }

  if (!threadId) {
    return { id: null, error: lastMessage };
  }

  const linkError = await insertMomentLinksForThread(
    threadId,
    input.orderedMomentIds,
    userId,
  );
  if (linkError) {
    await supabase.from("threads").delete().eq("id", threadId);
    return {
      id: null,
      error: `Momenten koppelen mislukt: ${linkError}. Controleer thread_moments (order_index, added_by) en RLS.`,
    };
  }

  return { id: threadId, error: null };
}
