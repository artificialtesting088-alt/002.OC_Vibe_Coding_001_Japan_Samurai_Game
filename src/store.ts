import { create } from 'zustand'
import { ENEMIES } from './enemies'

export type Dialog = {
  name: string
  lines: string[]
  index: number
}

type GameState = {
  health: number
  locked: boolean
  quest: string
  dialog: Dialog | null
  nearNpc: string | null
  enemiesDefeated: number
  enemiesTotal: number
  hurtAt: number
  respawnToken: number
  setLocked: (locked: boolean) => void
  openDialog: (name: string, lines: string[]) => void
  advanceDialog: () => void
  closeDialog: () => void
  setNearNpc: (nearNpc: string | null) => void
  damagePlayer: (amount: number) => void
  reportEnemyDefeated: () => void
  respawn: () => void
}

export const useGame = create<GameState>((set) => ({
  health: 100,
  locked: false,
  quest: `Bersihkan kamp bandit di timur (0/${ENEMIES.length}).`,
  dialog: null,
  nearNpc: null,
  enemiesDefeated: 0,
  enemiesTotal: ENEMIES.length,
  hurtAt: 0,
  respawnToken: 0,
  setLocked: (locked) => set({ locked }),
  openDialog: (name, lines) => set({ dialog: { name, lines, index: 0 } }),
  advanceDialog: () =>
    set((state) => {
      if (!state.dialog) return state
      const index = state.dialog.index + 1
      return { dialog: index >= state.dialog.lines.length ? null : { ...state.dialog, index } }
    }),
  closeDialog: () => set({ dialog: null }),
  setNearNpc: (nearNpc) => set({ nearNpc }),
  damagePlayer: (amount) =>
    set((state) =>
      state.health <= 0
        ? state
        : {
            health: Math.max(0, state.health - amount),
            hurtAt: state.hurtAt + 1,
          },
    ),
  reportEnemyDefeated: () =>
    set((state) => {
      if (state.enemiesDefeated >= state.enemiesTotal) return state
      const enemiesDefeated = state.enemiesDefeated + 1
      return {
        enemiesDefeated,
        quest:
          enemiesDefeated >= state.enemiesTotal
            ? 'Kamp bandit bersih. Jelajahi kuil di balik hutan bambu.'
            : `Bersihkan kamp bandit di timur (${enemiesDefeated}/${state.enemiesTotal}).`,
      }
    }),
  respawn: () =>
    set((state) => ({
      health: 100,
      respawnToken: state.respawnToken + 1,
      dialog: null,
      nearNpc: null,
    })),
}))
