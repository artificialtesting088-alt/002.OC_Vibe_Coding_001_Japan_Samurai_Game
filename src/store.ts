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
  questRewarded: boolean
  lastDialogClose: number
  muted: boolean
  setLocked: (locked: boolean) => void
  openDialog: (name: string, lines: string[]) => void
  advanceDialog: () => void
  closeDialog: () => void
  setNearNpc: (nearNpc: string | null) => void
  damagePlayer: (amount: number) => void
  reportEnemyDefeated: () => void
  completeQuest: () => void
  respawn: () => void
  setMuted: (muted: boolean) => void
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
  questRewarded: false,
  lastDialogClose: 0,
  muted: false,
  setLocked: (locked) => set({ locked }),
  openDialog: (name, lines) => set({ dialog: { name, lines, index: 0 } }),
  advanceDialog: () =>
    set((state) => {
      if (!state.dialog) return state
      const index = state.dialog.index + 1
      const closed = index >= state.dialog.lines.length
      return {
        dialog: closed ? null : { ...state.dialog, index },
        lastDialogClose: closed ? Date.now() : state.lastDialogClose,
      }
    }),
  closeDialog: () => set({ dialog: null, lastDialogClose: Date.now() }),
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
            ? 'Kembali ke Kapten Kenshin di gerbang torii.'
            : `Bersihkan kamp bandit di timur (${enemiesDefeated}/${state.enemiesTotal}).`,
      }
    }),
  completeQuest: () =>
    set((state) =>
      state.questRewarded
        ? state
        : {
            health: 100,
            questRewarded: true,
            quest: 'Kamp aman. Jelajahi kuil di balik hutan bambu.',
          },
    ),
  respawn: () =>
    set((state) => ({
      health: 100,
      respawnToken: state.respawnToken + 1,
      dialog: null,
      nearNpc: null,
    })),
  setMuted: (muted) => set({ muted }),
}))
