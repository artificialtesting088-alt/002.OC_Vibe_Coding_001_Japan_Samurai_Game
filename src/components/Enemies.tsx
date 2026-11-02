import { useCallback, useEffect, useMemo, useRef, useState } from 'react'
import { Billboard, useAnimations, useGLTF } from '@react-three/drei'
import { useFrame } from '@react-three/fiber'
import * as THREE from 'three'
import { clone as cloneSkeleton } from 'three/examples/jsm/utils/SkeletonUtils.js'
import { loadPlayerClips } from '../animations'
import { normalizeHeight } from '../characters'
import { registerCombatTarget, type CombatTarget } from '../combat'
import { ENEMIES, GUARDIAN, type EnemyDef } from '../enemies'
import { asset, playerTransform, terrainHeight } from '../game'
import { useGame } from '../store'
import { createKatana } from '../weapons'
import { playAwaken, playDeath, playHurt } from '../audio'

const MAX_HEALTH = 50
const AGGRO_RANGE = 14
const DISENGAGE_RANGE = 22
const ATTACK_RANGE = 2.3
const ATTACK_DAMAGE = 9
const RESPAWN_TIME = 16

type Gait = 'Idle' | 'Walk' | 'Run' | 'Attack'

function findAction(actions: Record<string, THREE.AnimationAction | null>, name: string) {
  const direct = actions[name]
  if (direct) return direct
  const key = Object.keys(actions).find((candidate) => candidate.toLowerCase() === name.toLowerCase())
  return key ? actions[key] : null
}

function faceTowards(root: THREE.Object3D, x: number, z: number, dt: number, speed = 7) {
  const target = Math.atan2(x - root.position.x, z - root.position.z)
  let difference = target - root.rotation.y
  difference = Math.atan2(Math.sin(difference), Math.cos(difference))
  root.rotation.y += difference * Math.min(1, dt * speed)
}

export function Enemy({ enemy }: { enemy: EnemyDef }) {
  const maxHealth = enemy.maxHealth ?? MAX_HEALTH
  const attackDamage = enemy.damage ?? ATTACK_DAMAGE
  const aggroRange = enemy.aggroRange ?? AGGRO_RANGE
  const disengageRange = enemy.disengageRange ?? DISENGAGE_RANGE
  const attackRange = enemy.attackRange ?? ATTACK_RANGE
  const moveSpeed = enemy.moveSpeed ?? 2.9
  const canRespawn = enemy.respawn !== false
  const questRewarded = useGame((state) => state.questRewarded)
  const unlockedRef = useRef(!enemy.boss)

  const gltf = useGLTF(asset(`characters/${enemy.model}.glb`))
  const model = useMemo(() => {
    const clone = cloneSkeleton(gltf.scene)
    normalizeHeight(clone, 1.78)
    return clone
  }, [gltf.scene])

  const group = useRef<THREE.Group>(null!)
  const bar = useRef<THREE.Group>(null!)
  const fill = useRef<THREE.Mesh>(null!)
  const telegraph = useRef<THREE.Group>(null!)
  const telegraphMaterial = useRef<THREE.MeshBasicMaterial>(null!)
  const home = useMemo(() => new THREE.Vector3(enemy.position[0], 0, enemy.position[1]), [enemy])
  const health = useRef(maxHealth)
  const alive = useRef(true)
  const counted = useRef(false)
  const aggro = useRef(false)
  const stagger = useRef(0)
  const hitFlash = useRef(0)
  const deathTime = useRef(0)
  const respawnTime = useRef(0)
  const attackCooldown = useRef(0.8 + Math.random())
  const attacking = useRef(false)
  const attackStart = useRef(0)
  const attackLanded = useRef(false)
  const attackAction = useRef<THREE.AnimationAction | null>(null)
  const materials = useRef<THREE.MeshStandardMaterial[]>([])
  const baseY = useRef(model.position.y)
  const gait = useRef<Gait | ''>('')
  const currentAction = useRef<THREE.AnimationAction | null>(null)
  const deathRoll = useMemo(() => (Math.random() < 0.5 ? -1.35 : 1.35), [])

  const [baked, setBaked] = useState<Record<string, THREE.AnimationClip>>({})
  useEffect(() => {
    let cancelled = false
    loadPlayerClips()
      .then((clips) => {
        if (!cancelled) setBaked(clips)
      })
      .catch(() => {})
    return () => {
      cancelled = true
    }
  }, [])

  const clips = useMemo(() => {
    const extra = Object.values(baked)
    return extra.length ? [...gltf.animations, ...extra] : gltf.animations
  }, [gltf.animations, baked])

  const { actions } = useAnimations(clips, model)

  const play = useCallback(
    (nextGait: Gait) => {
      const walk = findAction(actions, 'Walk')
      const run = findAction(actions, 'Run')
      const idle = findAction(actions, 'Idle_Loop') ?? walk
      const attack = findAction(actions, 'Sword_Attack')
      const next =
        nextGait === 'Attack'
          ? attack
          : nextGait === 'Run'
            ? (run ?? walk ?? idle)
            : nextGait === 'Walk'
              ? (walk ?? idle)
              : idle
      if (!next) return
      if (gait.current === nextGait && currentAction.current?.isScheduled()) return

      const previous = currentAction.current
      if (next === previous) {
        if (!next.isScheduled()) next.play()
        next.setEffectiveWeight(1)
        next.paused = nextGait === 'Idle' && next === walk
        gait.current = nextGait
        return
      }

      next.reset()
      next.enabled = true
      next.setEffectiveWeight(1)
      next.fadeIn(0.16)
      if (nextGait === 'Attack') {
        next.setLoop(THREE.LoopOnce, 1)
        next.clampWhenFinished = true
        next.timeScale = 0.9
        next.paused = false
      } else {
        next.setLoop(THREE.LoopRepeat, Infinity)
        next.timeScale = 1
        next.paused = nextGait === 'Idle' && next === walk
      }
      next.play()
      previous?.fadeOut(0.16)
      currentAction.current = next
      gait.current = nextGait
    },
    [actions],
  )

  useEffect(() => {
    play('Idle')
  }, [play])

  useEffect(() => {
    const tint = new THREE.Color(enemy.tint)
    const tinted: THREE.MeshStandardMaterial[] = []

    const tintMaterial = (source: THREE.Material) => {
      if (!(source instanceof THREE.MeshStandardMaterial)) return source
      const material = source.clone()
      material.color.lerp(tint, 0.58)
      material.emissive = new THREE.Color('#000000')
      material.emissiveIntensity = 0
      tinted.push(material)
      return material
    }

    model.traverse((child) => {
      if (!(child instanceof THREE.Mesh)) return
      child.castShadow = true
      child.receiveShadow = true
      child.frustumCulled = false
      child.material = Array.isArray(child.material)
        ? child.material.map(tintMaterial)
        : tintMaterial(child.material)
    })
    materials.current = tinted
    baseY.current = model.position.y
  }, [model, enemy.tint])

  const katana = useMemo(() => createKatana(), [])
  useEffect(() => {
    const hand = model.getObjectByName('RightHand')
    if (!hand) return
    katana.visible = false
    hand.add(katana)
    return () => {
      hand.remove(katana)
    }
  }, [model, katana])

  const target = useMemo<CombatTarget>(
    () => ({
      position: new THREE.Vector3(),
      radius: enemy.boss ? 0.95 : 0.75,
      alive: true,
      hit: (damage, direction, knockback) => {
        if (!alive.current) return
        health.current = Math.max(0, health.current - damage)
        hitFlash.current = 1
        stagger.current = 0.34
        attacking.current = false
        katana.visible = false
        const root = group.current
        if (root) {
          root.position.addScaledVector(direction, knockback * (enemy.boss ? 0.35 : 1))
          root.position.y = terrainHeight(root.position.x, root.position.z)
        }
        if (health.current <= 0) {
          alive.current = false
          target.alive = false
          deathTime.current = 0
          if (canRespawn) respawnTime.current = RESPAWN_TIME
          bar.current.visible = false
          playDeath()
          if (!counted.current) {
            counted.current = true
            if (enemy.boss) useGame.getState().reportGuardianDefeated()
            else useGame.getState().reportEnemyDefeated()
          }
        }
      },
    }),
    [katana],
  )

  useEffect(() => registerCombatTarget(target), [target])

  useFrame((state, delta) => {
    const dt = Math.min(delta, 0.05)
    const root = group.current
    if (!root) return

    const unlocked = !enemy.boss || questRewarded
    if (unlocked && !unlockedRef.current) {
      unlockedRef.current = true
      playAwaken()
    }
    if (!unlocked) {
      target.alive = false
      bar.current.visible = false
      telegraph.current.visible = false
      play('Idle')
      return
    }

    target.position.copy(root.position)
    target.alive = alive.current
    telegraph.current.visible = false

    if (hitFlash.current > 0) {
      hitFlash.current = Math.max(0, hitFlash.current - dt * 5)
      const flash = hitFlash.current
      for (const material of materials.current) {
        material.emissive.setRGB(flash * 0.95, flash * 0.12, flash * 0.04)
        material.emissiveIntensity = flash
      }
    }

    if (!alive.current) {
      deathTime.current += dt
      respawnTime.current -= dt
      root.rotation.z = THREE.MathUtils.lerp(root.rotation.z, deathRoll, Math.min(1, dt * 4))
      katana.visible = false
      bar.current.visible = false
      model.visible = deathTime.current < 3

      if (respawnTime.current <= 0) {
        if (!canRespawn) return
        health.current = maxHealth
        alive.current = true
        target.alive = true
        aggro.current = false
        stagger.current = 0
        hitFlash.current = 0
        deathTime.current = 0
        attacking.current = false
        attackCooldown.current = 1.2
        model.visible = true
        root.position.set(home.x, terrainHeight(home.x, home.z), home.z)
        root.rotation.z = 0
        play('Idle')
      }
      return
    }

    bar.current.visible = aggro.current || health.current < maxHealth
    if (fill.current) {
      const ratio = Math.max(0.001, health.current / maxHealth)
      fill.current.scale.x = ratio
      fill.current.position.x = (ratio - 1) / 2
    }

    const playerDead = useGame.getState().health <= 0
    const dialogOpen = !!useGame.getState().dialog
    if (playerDead || dialogOpen) {
      aggro.current = false
      attacking.current = false
      katana.visible = false
      play('Idle')
      return
    }

    const dx = playerTransform.position.x - root.position.x
    const dz = playerTransform.position.z - root.position.z
    const distance = Math.hypot(dx, dz)
    attackCooldown.current = Math.max(0, attackCooldown.current - dt)

    if (!aggro.current && distance < aggroRange) aggro.current = true
    if (aggro.current && distance > disengageRange) aggro.current = false

    if (stagger.current > 0) {
      stagger.current -= dt
      play('Idle')
      return
    }

    if (attacking.current) {
      const action = attackAction.current
      const clip = action?.getClip()
      const duration = clip ? clip.duration / Math.max(action!.timeScale, 0.01) : 0.5
      const elapsed = state.clock.elapsedTime - attackStart.current
      const phase = clip && clip.duration > 0 && action ? Math.min(1, action.time / clip.duration) : Math.min(1, elapsed / duration)

      katana.visible = phase < 0.96
      if (phase < 0.55) {
        const warning = phase / 0.55
        telegraph.current.visible = true
        telegraph.current.scale.setScalar(1 + warning * 0.7)
        telegraphMaterial.current.opacity = 0.15 + warning * 0.55
      }
      if (!attackLanded.current && phase >= 0.55) {
        attackLanded.current = true
        if (distance <= attackRange + 0.6) {
          useGame.getState().damagePlayer(attackDamage)
          playHurt()
        }
      }

      if (elapsed >= duration - 0.05) {
        attacking.current = false
        attackCooldown.current = (enemy.boss ? 1.9 : 1.4) + Math.random() * 0.8
        katana.visible = false
      }
      return
    }

    if (aggro.current) {
      faceTowards(root, playerTransform.position.x, playerTransform.position.z, dt)
      if (distance > attackRange) {
        const step = Math.min(distance - attackRange, moveSpeed * dt)
        root.position.x += (dx / distance) * step
        root.position.z += (dz / distance) * step
        root.position.y = terrainHeight(root.position.x, root.position.z)
        play(distance > 7 ? 'Run' : 'Walk')
      } else {
        play('Idle')
        if (attackCooldown.current <= 0) {
          const action = findAction(actions, 'Sword_Attack')
          if (action) {
            attacking.current = true
            attackLanded.current = false
            attackStart.current = state.clock.elapsedTime
            attackAction.current = action
            katana.visible = true
            play('Attack')
          }
        }
      }
    } else {
      play('Idle')
      model.position.y = baseY.current + Math.sin(state.clock.elapsedTime * 1.2 + home.x) * 0.004
    }
  })

  return (
    <group
      ref={group}
      visible={!enemy.boss || questRewarded}
      scale={enemy.scale}
      position={[enemy.position[0], terrainHeight(enemy.position[0], enemy.position[1]), enemy.position[1]]}
    >
      <primitive object={model} />
      <group ref={telegraph} visible={false} position={[0, 0.06, 0]} rotation={[-Math.PI / 2, 0, 0]}>
        <mesh renderOrder={3}>
          <ringGeometry args={[0.7, 0.92, 36]} />
          <meshBasicMaterial
            ref={telegraphMaterial}
            color="#ff3a2d"
            transparent
            opacity={0}
            depthWrite={false}
            side={THREE.DoubleSide}
            blending={THREE.AdditiveBlending}
            toneMapped={false}
          />
        </mesh>
      </group>
      {enemy.boss && questRewarded && (
        <>
          <group position={[0, 0.06, 0]} rotation={[-Math.PI / 2, 0, 0]}>
            <mesh renderOrder={3}>
              <ringGeometry args={[0.95, 1.1, 40]} />
              <meshBasicMaterial
                color="#e7b45a"
                transparent
                opacity={0.55}
                depthWrite={false}
                side={THREE.DoubleSide}
                blending={THREE.AdditiveBlending}
                toneMapped={false}
              />
            </mesh>
          </group>
          <pointLight position={[0, 1.8, 0]} color="#ff7a45" intensity={12} distance={8} decay={2} />
        </>
      )}
      <group ref={bar} visible={false} position={[0, enemy.boss ? 2.45 : 2.12, 0]} scale={enemy.boss ? 1.35 : 1}>
        <Billboard>
          <mesh renderOrder={4}>
            <planeGeometry args={[1.08, 0.09]} />
            <meshBasicMaterial color="#14100f" transparent opacity={0.78} depthTest={false} />
          </mesh>
          <mesh ref={fill} position={[0, 0, 0.002]} renderOrder={5}>
            <planeGeometry args={[1, 0.055]} />
            <meshBasicMaterial color={enemy.boss ? '#e7b45a' : '#c8352b'} transparent depthTest={false} toneMapped={false} />
          </mesh>
        </Billboard>
      </group>
    </group>
  )
}

export function Enemies() {
  return (
    <>
      {ENEMIES.map((enemy) => (
        <Enemy key={enemy.id} enemy={enemy} />
      ))}
      <Enemy key={GUARDIAN.id} enemy={GUARDIAN} />
    </>
  )
}
