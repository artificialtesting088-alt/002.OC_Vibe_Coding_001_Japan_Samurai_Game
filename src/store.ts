import { create } from 'zustand'

type GameState = {
  health: number
  stamina: number
  sprinting: boolean
  locked: boolean
  quest: string
  setLocked: (locked: boolean) => void
  setVitals: (vitals: { stamina?: number; sprinting?: boolean; health?: number }) => void
}

export const useGame = create<GameState>((set) => ({
  health: 100,
  stamina: 100,
  sprinting: false,
  locked: false,
  quest: 'Lewati gerbang torii dan temukan kuil di balik hutan bambu.',
  setLocked: (locked) => set({ locked }),
  setVitals: (vitals) => set(vitals),
}))
