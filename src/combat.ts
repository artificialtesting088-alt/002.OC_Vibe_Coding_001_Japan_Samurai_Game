import * as THREE from 'three'

export type CombatTarget = {
  position: THREE.Vector3
  radius: number
  alive: boolean
  hit: (damage: number, direction: THREE.Vector3, knockback: number) => void
}

export type Strike = {
  range: number
  arc: number
  damage: number
  knockback: number
}

const targets = new Set<CombatTarget>()

export function registerCombatTarget(target: CombatTarget) {
  targets.add(target)
  return () => {
    targets.delete(target)
  }
}

export function strikeTargets(origin: THREE.Vector3, forward: THREE.Vector3, strike: Strike) {
  const direction = forward.clone().setY(0)
  if (direction.lengthSq() < 0.0001) direction.set(0, 0, 1)
  direction.normalize()

  const minimumDot = Math.cos(Math.max(0.01, strike.arc) / 2)
  let hits = 0

  for (const target of targets) {
    if (!target.alive) continue

    const dx = target.position.x - origin.x
    const dz = target.position.z - origin.z
    const distance = Math.hypot(dx, dz)
    if (distance > strike.range + target.radius) continue

    if (distance > 0.001) {
      const dot = (dx * direction.x + dz * direction.z) / distance
      if (dot < minimumDot) continue
    }

    const away = new THREE.Vector3(dx, 0, dz)
    if (away.lengthSq() < 0.0001) away.copy(direction)
    else away.normalize()
    target.hit(strike.damage, away, strike.knockback)
    hits++
  }

  return hits
}
