import { ENEMIES } from './enemies'
import { NPCS } from './npcs'

export type Objective = {
  label: string
  position: [number, number]
}

const CAMP: [number, number] = [
  ENEMIES.reduce((sum, enemy) => sum + enemy.position[0], 0) / ENEMIES.length,
  ENEMIES.reduce((sum, enemy) => sum + enemy.position[1], 0) / ENEMIES.length,
]

const KENSHIN = NPCS.find((npc) => npc.id === 'kenshin')?.position ?? [-6.5, 7]
const TEMPLE: [number, number] = [0, -36]

export function getObjective(enemiesDefeated: number, enemiesTotal: number, questRewarded: boolean): Objective {
  if (!questRewarded) {
    if (enemiesDefeated < enemiesTotal) return { label: 'Kamp Bandit', position: CAMP }
    return { label: 'Kapten Kenshin', position: KENSHIN }
  }
  return { label: 'Kuil Tua', position: TEMPLE }
}
