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
  hasStarted: boolean
  sensitivity: number
  quest: string
  dialog: Dialog | null
  nearNpc: string | null
  enemiesDefeated: number
  enemiesTotal: number
  hurtAt: number
  respawnToken: number
  questRewarded: boolean
  guardianDefeated: boolean
  journeyComplete: boolean
  nearAltar: boolean
  lastDialogClose: number
  muted: boolean
  setLocked: (locked: boolean) => void
  setSensitivity: (sensitivity: number) => void
  openDialog: (name: string, lines: string[]) => void
  advanceDialog: () => void
  closeDialog: () => void
  setNearNpc: (nearNpc: string | null) => void
  damagePlayer: (amount: number) => void
  reportEnemyDefeated: () => void
  reportGuardianDefeated: () => void
  completeQuest: () => void
  completeJourney: () => void
  setNearAltar: (nearAltar: boolean) => void
  respawn: () => void
  setMuted: (muted: boolean) => void
}

function loadSensitivity() {
  try {
    if (typeof window === 'undefined') return 1
    const raw = window.localStorage.getItem('kaze-sensitivity')
    if (raw === null) return 1
    const value = Number(raw)
    return Number.isFinite(value) ? Math.min(2, Math.max(0.4, value)) : 1
  } catch {
    return 1
  }
}

export const useGame = create<GameState>((set) => ({
  health: 100,
  locked: false,
  hasStarted: false,
  sensitivity: loadSensitivity(),
  quest: `Bersihkan kamp bandit di timur (0/${ENEMIES.length}).`,
  dialog: null,
  nearNpc: null,
  enemiesDefeated: 0,
  enemiesTotal: ENEMIES.length,
  hurtAt: 0,
  respawnToken: 0,
  questRewarded: false,
  guardianDefeated: false,
  journeyComplete: false,
  nearAltar: false,
  lastDialogClose: 0,
  muted: false,
  setLocked: (locked) =>
    set((state) => ({
      locked,
      hasStarted: state.hasStarted || locked,
    })),
  setSensitivity: (sensitivity) => {
    const next = Math.min(2, Math.max(0.4, Math.round(sensitivity * 10) / 10))
    try {
      window.localStorage.setItem('kaze-sensitivity', String(next))
    } catch {}
    set({ sensitivity: next })
  },
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
  reportGuardianDefeated: () =>
    set((state) =>
      state.guardianDefeated
        ? state
        : {
            guardianDefeated: true,
            quest: 'Penjaga telah jatuh. Berdoa di altar kuil.',
          },
    ),
  completeQuest: () =>
    set((state) =>
      state.questRewarded
        ? state
        : {
            health: 100,
            questRewarded: true,
            quest: 'Kuil di utara menanti. Hadapi penjaga yang terjaga.',
          },
    ),
  completeJourney: () =>
    set((state) =>
      state.journeyComplete
        ? state
        : {
            health: 100,
            guardianDefeated: true,
            journeyComplete: true,
            nearAltar: false,
            quest: 'Selesai — Jalan Angin telah tenang.',
          },
    ),
  setNearAltar: (nearAltar) => set({ nearAltar }),
  respawn: () =>
    set((state) => ({
      health: 100,
      respawnToken: state.respawnToken + 1,
      dialog: null,
      nearNpc: null,
      nearAltar: false,
    })),
  setMuted: (muted) => set({ muted }),
}))
