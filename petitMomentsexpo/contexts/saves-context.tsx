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
  addSavedMoment,
  addSavedThread,
  fetchSavedMomentIds,
  fetchSavedThreadIds,
  removeSavedMoment,
  removeSavedThread,
} from '@/utils/saves-supabase'

type SavesContextValue = {
  savedMomentIds: Set<string>
  savedThreadIds: Set<string>
  loading: boolean
  loadError: string | null
  isMomentSaved: (id: string) => boolean
  isThreadSaved: (id: string) => boolean
  toggleMomentSave: (id: string) => Promise<{ error: string | null }>
  toggleThreadSave: (id: string) => Promise<{ error: string | null }>
  refreshSaves: () => Promise<void>
}

const SavesContext = createContext<SavesContextValue | undefined>(undefined)

export function SavesProvider({ children }: { children: React.ReactNode }) {
  const { session, loading: authLoading } = useAuth()
  const [savedMomentIds, setSavedMomentIds] = useState<Set<string>>(new Set())
  const [savedThreadIds, setSavedThreadIds] = useState<Set<string>>(new Set())
  const [loading, setLoading] = useState(true)
  const [loadError, setLoadError] = useState<string | null>(null)

  const refreshSaves = useCallback(async () => {
    if (!session?.user?.id) {
      setSavedMomentIds(new Set())
      setSavedThreadIds(new Set())
      setLoading(false)
      setLoadError(null)
      return
    }

    setLoading(true)
    setLoadError(null)

    const [moments, threads] = await Promise.all([
      fetchSavedMomentIds(),
      fetchSavedThreadIds(),
    ])

    setSavedMomentIds(new Set(moments.ids))
    setSavedThreadIds(new Set(threads.ids))

    const firstError = moments.error ?? threads.error
    setLoadError(firstError)
    setLoading(false)
  }, [session?.user?.id])

  useEffect(() => {
    if (authLoading) return
    void refreshSaves()
  }, [authLoading, refreshSaves])

  const isMomentSaved = useCallback(
    (id: string) => savedMomentIds.has(id),
    [savedMomentIds],
  )
  const isThreadSaved = useCallback(
    (id: string) => savedThreadIds.has(id),
    [savedThreadIds],
  )

  const toggleMomentSave = useCallback(
    async (id: string) => {
      if (!session?.user?.id) {
        return { error: 'Log in om momenten te bewaren.' }
      }
      const wasSaved = savedMomentIds.has(id)

      /* Optimistische update zodat de UI direct reageert. */
      setSavedMomentIds((prev) => {
        const next = new Set(prev)
        if (wasSaved) next.delete(id)
        else next.add(id)
        return next
      })

      const { error } = wasSaved
        ? await removeSavedMoment(id)
        : await addSavedMoment(id)

      if (error) {
        /* Rollback bij fout. */
        setSavedMomentIds((prev) => {
          const next = new Set(prev)
          if (wasSaved) next.add(id)
          else next.delete(id)
          return next
        })
        return { error }
      }
      return { error: null }
    },
    [savedMomentIds, session?.user?.id],
  )

  const toggleThreadSave = useCallback(
    async (id: string) => {
      if (!session?.user?.id) {
        return { error: 'Log in om discussies te bewaren.' }
      }
      const wasSaved = savedThreadIds.has(id)

      setSavedThreadIds((prev) => {
        const next = new Set(prev)
        if (wasSaved) next.delete(id)
        else next.add(id)
        return next
      })

      const { error } = wasSaved
        ? await removeSavedThread(id)
        : await addSavedThread(id)

      if (error) {
        setSavedThreadIds((prev) => {
          const next = new Set(prev)
          if (wasSaved) next.add(id)
          else next.delete(id)
          return next
        })
        return { error }
      }
      return { error: null }
    },
    [savedThreadIds, session?.user?.id],
  )

  const value = useMemo<SavesContextValue>(
    () => ({
      savedMomentIds,
      savedThreadIds,
      loading,
      loadError,
      isMomentSaved,
      isThreadSaved,
      toggleMomentSave,
      toggleThreadSave,
      refreshSaves,
    }),
    [
      savedMomentIds,
      savedThreadIds,
      loading,
      loadError,
      isMomentSaved,
      isThreadSaved,
      toggleMomentSave,
      toggleThreadSave,
      refreshSaves,
    ],
  )

  return <SavesContext.Provider value={value}>{children}</SavesContext.Provider>
}

export function useSaves(): SavesContextValue {
  const ctx = useContext(SavesContext)
  if (!ctx) {
    throw new Error('useSaves must be used inside SavesProvider')
  }
  return ctx
}
