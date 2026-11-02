export type EnemyDef = {
  id: string
  name: string
  model: 'samurai' | 'ninja'
  position: [number, number]
  tint: string
  scale: number
  maxHealth?: number
  damage?: number
  aggroRange?: number
  disengageRange?: number
  attackRange?: number
  moveSpeed?: number
  respawn?: boolean
  boss?: boolean
}

export const ENEMIES: EnemyDef[] = [
  { id: 'kuro', name: 'Kuro', model: 'ninja', position: [34, -4], tint: '#8a3a2e', scale: 1.02 },
  { id: 'oni', name: 'Oni', model: 'samurai', position: [41, -8], tint: '#6d4a35', scale: 1.05 },
  { id: 'gaki', name: 'Gaki', model: 'ninja', position: [36, -13], tint: '#5d3a46', scale: 0.97 },
  { id: 'kage', name: 'Kage', model: 'ninja', position: [46, -3], tint: '#3f4a55', scale: 0.99 },
  { id: 'tetsu', name: 'Tetsu', model: 'samurai', position: [31, -15], tint: '#5a4a2f', scale: 1.04 },
]

export const GUARDIAN: EnemyDef = {
  id: 'guardian',
  name: 'Penjaga Kuil',
  model: 'samurai',
  position: [7, -34],
  tint: '#4a201a',
  scale: 1.3,
  maxHealth: 190,
  damage: 15,
  aggroRange: 18,
  disengageRange: 30,
  attackRange: 2.8,
  moveSpeed: 3.2,
  respawn: false,
  boss: true,
}
