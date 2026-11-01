import { create } from 'zustand'

export type Dialog = {
  name: string
  lines: string[]
  index: number
}

type GameState = {
  health: number
  stamina: number
  sprinting: boolean
  locked: boolean
  quest: string
  dialog: Dialog | null
  nearNpc: string | null
  setLocked: (locked: boolean) => void
  setVitals: (vitals: { stamina?: number; sprinting?: boolean; health?: number }) => void
  openDialog: (name: string, lines: string[]) => void
  advanceDialog: () => void
  closeDialog: () => void
  setNearNpc: (nearNpc: string | null) => void
}

export const useGame = create<GameState>((set) => ({
  health: 100,
  stamina: 100,
  sprinting: false,
  locked: false,
  quest: 'Lewati gerbang torii dan temukan kuil di balik hutan bambu.',
  dialog: null,
  nearNpc: null,
  setLocked: (locked) => set({ locked }),
  setVitals: (vitals) => set(vitals),
  openDialog: (name, lines) => set({ dialog: { name, lines, index: 0 } }),
  advanceDialog: () =>
    set((state) => {
      if (!state.dialog) return state
      const index = state.dialog.index + 1
      return { dialog: index >= state.dialog.lines.length ? null : { ...state.dialog, index } }
    }),
  closeDialog: () => set({ dialog: null }),
  setNearNpc: (nearNpc) => set({ nearNpc }),
}))
