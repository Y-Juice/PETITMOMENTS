import React, {
    createContext,
    useCallback,
    useContext,
    useEffect,
    useMemo,
    useState,
} from "react";

import { useAuth } from "@/contexts/auth-context";
import type { Moment } from "@/data/mockMoments";
import { isContentHiddenFromViewer } from "@/data/moderation";
import {
  deleteMomentInSupabase,
  updateMomentInSupabase,
} from "@/utils/moments-supabase";
import {
  parseContentWarnings,
  parseModerationStatus,
} from "@/utils/moderation-parse";
import { supabase } from "@/utils/supabase";

type CreateMomentInput = {
  id?: string;
  username: string;
  description: string;
  imageUrl: string;
  locationLabel: string;
  latitude: number;
  longitude: number;
  isPublic: boolean;
  ownerId: string;
};

type UpdateMomentPatch = {
  description?: string;
  locationLabel?: string;
  isPublic?: boolean;
};

type MomentsContextValue = {
  moments: Moment[];
  loading: boolean;
  loadError: string | null;
  refreshMoments: () => void;
  addMoment: (input: CreateMomentInput) => void;
  updateMoment: (id: string, patch: UpdateMomentPatch) => Promise<{ error: string | null }>;
  deleteMoment: (id: string) => Promise<{ error: string | null }>;
};

const MomentsContext = createContext<MomentsContextValue | undefined>(
  undefined,
);

function createTitleFromDescription(description: string): string {
  const cleaned = description.trim().replace(/\s+/g, " ");
  if (cleaned.length <= 56) {
    return cleaned;
  }
  return `${cleaned.slice(0, 53).trimEnd()}...`;
}

/** PostGIS / Supabase sometimes returns geography as EWKB hex (Point). */
function parseEwkbPointHex(
  hex: string,
): { latitude: number; longitude: number } | null {
  const s = hex.replace(/\s/g, "");
  if (s.length < 42 || !/^[0-9a-fA-F]+$/.test(s)) return null;

  const bytes = new Uint8Array(s.length / 2);
  for (let i = 0; i < s.length; i += 2) {
    bytes[i / 2] = Number.parseInt(s.slice(i, i + 2), 16);
  }

  const le = bytes[0] === 1;
  const readU32 = (o: number) => {
    if (le) {
      return (
        bytes[o] |
        (bytes[o + 1] << 8) |
        (bytes[o + 2] << 16) |
        (bytes[o + 3] << 24)
      );
    }
    return (
      (bytes[o] << 24) |
      (bytes[o + 1] << 16) |
      (bytes[o + 2] << 8) |
      bytes[o + 3]
    );
  };

  const readF64 = (o: number) => {
    const buf = new DataView(bytes.buffer, bytes.byteOffset + o, 8);
    return buf.getFloat64(0, le);
  };

  let o = 1;
  const type = readU32(o);
  o += 4;
  const hasSrid = (type & 0x20000000) !== 0;
  const typeBase = type & 0xff;
  if (typeBase !== 1) return null;
  if (hasSrid) o += 4;

  const x = readF64(o);
  const y = readF64(o + 8);
  if (!Number.isFinite(x) || !Number.isFinite(y)) return null;
  return { longitude: x, latitude: y };
}

function parseLocationField(
  locationValue: unknown,
): { latitude: number; longitude: number } | null {
  if (locationValue == null) return null;

  if (Array.isArray(locationValue) && locationValue.length >= 2) {
    const a = Number(locationValue[0]);
    const b = Number(locationValue[1]);
    if (!Number.isFinite(a) || !Number.isFinite(b)) return null;
    return { latitude: b, longitude: a };
  }

  let value: unknown = locationValue;

  if (typeof value === "string") {
    const trimmed = value.trim();
    if (!trimmed) return null;

    const ewkb = parseEwkbPointHex(trimmed);
    if (ewkb) return ewkb;

    if (trimmed.startsWith("{")) {
      try {
        value = JSON.parse(trimmed) as unknown;
      } catch {
        value = trimmed;
      }
    }
  }

  if (typeof value === "object" && value !== null && "coordinates" in value) {
    const coords = (value as { coordinates?: unknown }).coordinates;
    if (Array.isArray(coords) && coords.length >= 2) {
      const lng = Number(coords[0]);
      const lat = Number(coords[1]);
      if (!Number.isFinite(lat) || !Number.isFinite(lng)) return null;
      return { latitude: lat, longitude: lng };
    }
  }

  if (typeof value === "string") {
    const match = value.match(
      /POINT\s*\(\s*(-?\d+(?:\.\d+)?)\s+(-?\d+(?:\.\d+)?)\s*\)/i,
    );
    if (match) {
      const first = Number(match[1]);
      const second = Number(match[2]);
      if (Number.isFinite(first) && Number.isFinite(second)) {
        return { latitude: second, longitude: first };
      }
    }
  }

  return null;
}

function coordsFromRow(
  row: Record<string, unknown>,
): { latitude: number; longitude: number } | null {
  const lat = Number(row.latitude ?? row.lat);
  const lng = Number(row.longitude ?? row.lng ?? row.lon);
  if (Number.isFinite(lat) && Number.isFinite(lng)) {
    return { latitude: lat, longitude: lng };
  }
  return parseLocationField(row.location);
}

function rowToMoment(
  row: Record<string, unknown>,
  coords: { latitude: number; longitude: number },
): Moment {
  const caption = String(row.caption ?? "").trim();
  const address = String(row.address ?? "").trim();
  const imageUrl = String(row.media_url ?? "");
  const ownerId =
    typeof row.user_id === "string" ? row.user_id : null;
  // Onbekend (oude rijen zonder is_public) behandelen we als publiek,
  // zodat bestaande data niet plots verdwijnt na de migratie.
  const isPublic =
    typeof row.is_public === "boolean" ? row.is_public : true;

  return {
    id: String(row.id ?? Date.now()),
    username: "Gebruiker",
    title: createTitleFromDescription(caption || address || "Moment"),
    description: caption || "Moment zonder beschrijving",
    imageUrl,
    location: {
      label: address || "Onbekende locatie",
      latitude: coords.latitude,
      longitude: coords.longitude,
    },
    score: 0,
    scoreDirection: "up",
    ownerId,
    isPublic,
    contentWarning: parseContentWarnings(row.content_warning),
    moderationStatus: parseModerationStatus(row.moderation_status),
  };
}

export function MomentsProvider({ children }: { children: React.ReactNode }) {
  const { session, loading: authLoading } = useAuth();
  const [moments, setMoments] = useState<Moment[]>([]);
  const [loading, setLoading] = useState(true);
  const [loadError, setLoadError] = useState<string | null>(null);

  const loadMoments = useCallback(async () => {
    setLoadError(null);

    await supabase.auth.getSession();

    setLoading(true);

    const withCoords = await supabase
      .from("moments")
      .select(
        "id, user_id, is_public, content_warning, moderation_status, caption, address, media_url, created_at, location, latitude:ST_Y(location::geometry), longitude:ST_X(location::geometry)",
      )
      .order("created_at", { ascending: false });

    let rows: Record<string, unknown>[] = (withCoords.data ?? []) as Record<
      string,
      unknown
    >[];

    if (withCoords.error) {
      const simple = await supabase
        .from("moments")
        .select(
          "id, user_id, is_public, content_warning, moderation_status, caption, address, media_url, location, created_at",
        )
        .order("created_at", { ascending: false });

      if (simple.error) {
        console.warn(
          "[moments] Supabase select error:",
          withCoords.error.message,
          simple.error,
        );
        setMoments([]);
        setLoading(false);
        setLoadError(
          `Kon momenten niet laden: ${simple.error.message}. Controleer RLS (SELECT op moments voor ingelogde gebruikers).`,
        );
        return;
      }

      rows = (simple.data ?? []) as Record<string, unknown>[];
    }

    if (rows.length === 0) {
      setMoments([]);
      setLoading(false);
      return;
    }

    const parsed: Moment[] = [];
    let skippedUnmapped = 0;

    for (const row of rows) {
      const r = row as Record<string, unknown>;
      const coords = coordsFromRow(r);
      if (!coords) {
        skippedUnmapped += 1;
        continue;
      }
      parsed.push(rowToMoment(r, coords));
    }

    setMoments(parsed);
    setLoading(false);

    if (skippedUnmapped > 0) {
      setLoadError(
        `${skippedUnmapped} moment(en) overgeslagen: locatie in de database kon niet worden gelezen (controleer de geography-kolom).`,
      );
    }
  }, []);

  useEffect(() => {
    if (authLoading) {
      return;
    }

    if (!session?.user?.id) {
      setMoments([]);
      setLoading(false);
      setLoadError(null);
      return;
    }

    let cancelled = false;

    void (async () => {
      await loadMoments();
      if (cancelled) return;
    })();

    const {
      data: { subscription },
    } = supabase.auth.onAuthStateChange((event, newSession) => {
      if (cancelled) return;
      if (event === "SIGNED_OUT") {
        setMoments([]);
        setLoadError(null);
        setLoading(false);
        return;
      }
      if (
        (event === "SIGNED_IN" ||
          event === "TOKEN_REFRESHED" ||
          event === "INITIAL_SESSION") &&
        newSession?.user?.id
      ) {
        void loadMoments();
      }
    });

    return () => {
      cancelled = true;
      subscription.unsubscribe();
    };
  }, [authLoading, loadMoments, session?.user?.id]);

  const addMoment = (input: CreateMomentInput) => {
    const now = Date.now();
    const newMoment: Moment = {
      id: input.id ?? `${now}`,
      username: input.username.trim() || "Gebruiker",
      title: createTitleFromDescription(input.description),
      description: input.description.trim(),
      imageUrl: input.imageUrl,
      location: {
        label: input.locationLabel.trim(),
        latitude: input.latitude,
        longitude: input.longitude,
      },
      score: 0,
      scoreDirection: "up",
      ownerId: input.ownerId,
      isPublic: input.isPublic,
    };

    setMoments((current) => [newMoment, ...current]);
  };

  const updateMoment = useCallback(
    async (id: string, patch: UpdateMomentPatch) => {
      const { error } = await updateMomentInSupabase({
        id,
        caption: patch.description,
        address: patch.locationLabel,
        isPublic: patch.isPublic,
      });
      if (error) return { error };

      setMoments((current) =>
        current.map((m) => {
          if (m.id !== id) return m;
          const nextDescription =
            typeof patch.description === "string"
              ? patch.description.trim()
              : m.description;
          const nextLabel =
            typeof patch.locationLabel === "string"
              ? patch.locationLabel.trim()
              : m.location.label;
          return {
            ...m,
            description: nextDescription || m.description,
            title: createTitleFromDescription(
              nextDescription || nextLabel || m.title,
            ),
            location: { ...m.location, label: nextLabel },
            isPublic:
              typeof patch.isPublic === "boolean" ? patch.isPublic : m.isPublic,
          };
        }),
      );

      return { error: null };
    },
    [],
  );

  const deleteMoment = useCallback(async (id: string) => {
    const { error } = await deleteMomentInSupabase(id);
    if (error) return { error };
    setMoments((current) => current.filter((m) => m.id !== id));
    return { error: null };
  }, []);

  /* Verberg private momenten van andere gebruikers in alle gedeelde feeds. */
  const currentUserId = session?.user?.id ?? null;
  const visibleMoments = useMemo(
    () =>
      moments.filter((m) => {
        if (isContentHiddenFromViewer(m, currentUserId)) return false;
        return (
          m.isPublic !== false ||
          (currentUserId && m.ownerId === currentUserId)
        );
      }),
    [moments, currentUserId],
  );

  const value = useMemo<MomentsContextValue>(
    () => ({
      moments: visibleMoments,
      loading,
      loadError,
      refreshMoments: () => {
        void loadMoments();
      },
      addMoment,
      updateMoment,
      deleteMoment,
    }),
    [
      visibleMoments,
      loading,
      loadError,
      loadMoments,
      updateMoment,
      deleteMoment,
    ],
  );

  return (
    <MomentsContext.Provider value={value}>{children}</MomentsContext.Provider>
  );
}

export function useMoments() {
  const ctx = useContext(MomentsContext);
  if (!ctx) {
    throw new Error("useMoments must be used inside MomentsProvider");
  }
  return ctx;
}
