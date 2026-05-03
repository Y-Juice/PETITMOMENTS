import React, { createContext, useContext, useMemo, useState } from 'react'

import { MOCK_MOMENTS, type Moment } from '@/data/mockMoments'

type CreateMomentInput = {
  id?: string
  username: string
  description: string
  imageUrl: string
  locationLabel: string
  latitude: number
  longitude: number
}

type MomentsContextValue = {
  moments: Moment[]
  addMoment: (input: CreateMomentInput) => void
}

const MomentsContext = createContext<MomentsContextValue | undefined>(undefined)

function createTitleFromDescription(description: string): string {
  const cleaned = description.trim().replace(/\s+/g, ' ')
  if (cleaned.length <= 56) {
    return cleaned
  }
  return `${cleaned.slice(0, 53).trimEnd()}...`
}

export function MomentsProvider({ children }: { children: React.ReactNode }) {
  const [moments, setMoments] = useState<Moment[]>(MOCK_MOMENTS)

  const addMoment = (input: CreateMomentInput) => {
    const now = Date.now()
    const newMoment: Moment = {
      id: input.id ?? `${now}`,
      username: input.username.trim() || 'Gebruiker',
      title: createTitleFromDescription(input.description),
      description: input.description.trim(),
      imageUrl: input.imageUrl,
      location: {
        label: input.locationLabel.trim(),
        latitude: input.latitude,
        longitude: input.longitude,
      },
      score: 0,
      scoreDirection: 'up',
    }

    setMoments((current) => [newMoment, ...current])
  }

  const value = useMemo<MomentsContextValue>(
    () => ({
      moments,
      addMoment,
    }),
    [moments]
  )

  return <MomentsContext.Provider value={value}>{children}</MomentsContext.Provider>
}

export function useMoments() {
  const ctx = useContext(MomentsContext)
  if (!ctx) {
    throw new Error('useMoments must be used inside MomentsProvider')
  }
  return ctx
}
