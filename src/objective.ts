import { ENEMIES, GUARDIAN } from './enemies'
import { NPCS } from './npcs'
import { ALTAR_POSITION } from './shrine'

export type Objective = {
  label: string
  position: [number, number]
}

const CAMP: [number, number] = [
  ENEMIES.reduce((sum, enemy) => sum + enemy.position[0], 0) / ENEMIES.length,
  ENEMIES.reduce((sum, enemy) => sum + enemy.position[1], 0) / ENEMIES.length,
]

const KENSHIN = NPCS.find((npc) => npc.id === 'kenshin')?.position ?? [-6.5, 7]

export function getObjective(
  enemiesDefeated: number,
  enemiesTotal: number,
  questRewarded: boolean,
  guardianDefeated: boolean,
  journeyComplete: boolean,
): Objective | null {
  if (journeyComplete) return null
  if (!questRewarded) {
    if (enemiesDefeated < enemiesTotal) return { label: 'Kamp Bandit', position: CAMP }
    return { label: 'Kapten Kenshin', position: KENSHIN }
  }
  if (!guardianDefeated) return { label: 'Penjaga Kuil', position: GUARDIAN.position }
  return { label: 'Altar Kuil', position: ALTAR_POSITION }
}
