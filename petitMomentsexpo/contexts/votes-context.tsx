import React, {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useMemo,
  useState,
} from 'react'

import { useAuth } from '@/contexts/auth-context'
import {
  fetchAllMomentVotes,
  fetchAllThreadVotes,
  setMomentVote,
  setThreadVote,
  type VoteDirection,
  type VoteRow,
} from '@/utils/votes-supabase'

/** Aggregaten per item-id (gebruikt voor het Reddit-style net score totaal). */
export type ScoreSummary = {
  up: number
  down: number
  score: number
}

const EMPTY_SUMMARY: ScoreSummary = { up: 0, down: 0, score: 0 }

type VotesContextValue = {
  /** Net score (up - down) per moment-id. */
  momentScores: Map<string, ScoreSummary>
  /** Net score (up - down) per thread-id. */
  threadScores: Map<string, ScoreSummary>
  /** De stem van de huidige gebruiker per moment-id. */
  myMomentVotes: Map<string, VoteDirection>
  /** De stem van de huidige gebruiker per thread-id. */
  myThreadVotes: Map<string, VoteDirection>
  loading: boolean
  loadError: string | null
  momentSummary: (id: string) => ScoreSummary
  threadSummary: (id: string) => ScoreSummary
  myMomentVote: (id: string) => VoteDirection | null
  myThreadVote: (id: string) => VoteDirection | null
  /** Klik op upvote/downvote. Zelfde richting opnieuw klikken = stem verwijderen. */
  voteOnMoment: (
    id: string,
    direction: VoteDirection,
  ) => Promise<{ error: string | null }>
  voteOnThread: (
    id: string,
    direction: VoteDirection,
  ) => Promise<{ error: string | null }>
  refreshVotes: () => Promise<void>
}

const VotesContext = createContext<VotesContextValue | undefined>(undefined)

/** Tel up/down per item-id. */
function aggregate(rows: VoteRow[]): Map<string, ScoreSummary> {
  const out = new Map<string, ScoreSummary>()
  for (const r of rows) {
    const prev = out.get(r.item_id) ?? { up: 0, down: 0, score: 0 }
    if (r.direction === 'up') prev.up += 1
    else prev.down += 1
    prev.score = prev.up - prev.down
    out.set(r.item_id, prev)
  }
  return out
}

function ownVotes(
  rows: VoteRow[],
  userId: string | null,
): Map<string, VoteDirection> {
  const out = new Map<string, VoteDirection>()
  if (!userId) return out
  for (const r of rows) {
    if (r.user_id === userId) out.set(r.item_id, r.direction)
  }
  return out
}

export function VotesProvider({ children }: { children: React.ReactNode }) {
  const { session, loading: authLoading } = useAuth()
  const userId = session?.user?.id ?? null

  const [momentRows, setMomentRows] = useState<VoteRow[]>([])
  const [threadRows, setThreadRows] = useState<VoteRow[]>([])
  const [loading, setLoading] = useState(true)
  const [loadError, setLoadError] = useState<string | null>(null)

  const refreshVotes = useCallback(async () => {
    if (!userId) {
      setMomentRows([])
      setThreadRows([])
      setLoading(false)
      setLoadError(null)
      return
    }

    setLoading(true)
    setLoadError(null)

    const [m, t] = await Promise.all([
      fetchAllMomentVotes(),
      fetchAllThreadVotes(),
    ])

    setMomentRows(m.rows)
    setThreadRows(t.rows)
    setLoadError(m.error ?? t.error)
    setLoading(false)
  }, [userId])

  useEffect(() => {
    if (authLoading) return
    void refreshVotes()
  }, [authLoading, refreshVotes])

  const momentScores = useMemo(() => aggregate(momentRows), [momentRows])
  const threadScores = useMemo(() => aggregate(threadRows), [threadRows])
  const myMomentVotes = useMemo(
    () => ownVotes(momentRows, userId),
    [momentRows, userId],
  )
  const myThreadVotes = useMemo(
    () => ownVotes(threadRows, userId),
    [threadRows, userId],
  )

  const momentSummary = useCallback(
    (id: string) => momentScores.get(id) ?? EMPTY_SUMMARY,
    [momentScores],
  )
  const threadSummary = useCallback(
    (id: string) => threadScores.get(id) ?? EMPTY_SUMMARY,
    [threadScores],
  )
  const myMomentVote = useCallback(
    (id: string) => myMomentVotes.get(id) ?? null,
    [myMomentVotes],
  )
  const myThreadVote = useCallback(
    (id: string) => myThreadVotes.get(id) ?? null,
    [myThreadVotes],
  )

  /** Pas de lokale lijst aan (optimistisch) voor 1 stem. */
  function applyLocalVote(
    prevRows: VoteRow[],
    nextDirection: VoteDirection | null,
    voteUserId: string,
    itemId: string,
  ): VoteRow[] {
    const filtered = prevRows.filter(
      (r) => !(r.user_id === voteUserId && r.item_id === itemId),
    )
    if (nextDirection === null) return filtered
    filtered.push({
      user_id: voteUserId,
      item_id: itemId,
      direction: nextDirection,
    })
    return filtered
  }

  const voteOnMoment = useCallback(
    async (id: string, direction: VoteDirection) => {
      if (!userId) return { error: 'Log in om te stemmen.' }

      const prevDirection = myMomentVotes.get(id) ?? null
      const nextDirection: VoteDirection | null =
        prevDirection === direction ? null : direction

      const previousRows = momentRows
      setMomentRows((rows) =>
        applyLocalVote(rows, nextDirection, userId, id),
      )

      const { error } = await setMomentVote(id, nextDirection)
      if (error) {
        setMomentRows(previousRows)
        return { error }
      }
      return { error: null }
    },
    [momentRows, myMomentVotes, userId],
  )

  const voteOnThread = useCallback(
    async (id: string, direction: VoteDirection) => {
      if (!userId) return { error: 'Log in om te stemmen.' }

      const prevDirection = myThreadVotes.get(id) ?? null
      const nextDirection: VoteDirection | null =
        prevDirection === direction ? null : direction

      const previousRows = threadRows
      setThreadRows((rows) =>
        applyLocalVote(rows, nextDirection, userId, id),
      )

      const { error } = await setThreadVote(id, nextDirection)
      if (error) {
        setThreadRows(previousRows)
        return { error }
      }
      return { error: null }
    },
    [threadRows, myThreadVotes, userId],
  )

  const value = useMemo<VotesContextValue>(
    () => ({
      momentScores,
      threadScores,
      myMomentVotes,
      myThreadVotes,
      loading,
      loadError,
      momentSummary,
      threadSummary,
      myMomentVote,
      myThreadVote,
      voteOnMoment,
      voteOnThread,
      refreshVotes,
    }),
    [
      momentScores,
      threadScores,
      myMomentVotes,
      myThreadVotes,
      loading,
      loadError,
      momentSummary,
      threadSummary,
      myMomentVote,
      myThreadVote,
      voteOnMoment,
      voteOnThread,
      refreshVotes,
    ],
  )

  return <VotesContext.Provider value={value}>{children}</VotesContext.Provider>
}

export function useVotes(): VotesContextValue {
  const ctx = useContext(VotesContext)
  if (!ctx) {
    throw new Error('useVotes must be used inside VotesProvider')
  }
  return ctx
}
