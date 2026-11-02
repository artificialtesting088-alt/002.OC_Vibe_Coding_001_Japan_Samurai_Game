import { useCallback, useEffect, useMemo, useRef } from 'react'
import { useFrame } from '@react-three/fiber'
import { useAnimations, useGLTF } from '@react-three/drei'
import * as THREE from 'three'
import { clone as cloneSkeleton } from 'three/examples/jsm/utils/SkeletonUtils.js'
import { normalizeHeight } from '../characters'
import { asset, playerTransform, terrainHeight } from '../game'
import { NPCS, type NpcDef } from '../npcs'
import { useGame } from '../store'
import { playQuest } from '../audio'

const NEAR_DISTANCE = 3.1
const TALK_DISTANCE = 3.6

type Gait = 'Idle' | 'Walk'

function findAction(actions: Record<string, THREE.AnimationAction | null>, name: string) {
  const direct = actions[name]
  if (direct) return direct
  const key = Object.keys(actions).find((candidate) => candidate.toLowerCase() === name.toLowerCase())
  return key ? actions[key] : null
}

function faceTowards(root: THREE.Object3D, x: number, z: number, dt: number, speed = 8) {
  const target = Math.atan2(x - root.position.x, z - root.position.z)
  let difference = target - root.rotation.y
  difference = Math.atan2(Math.sin(difference), Math.cos(difference))
  root.rotation.y += difference * Math.min(1, dt * speed)
}

export function NPC({ npc }: { npc: NpcDef }) {
  const gltf = useGLTF(asset(`characters/${npc.model}.glb`))
  const model = useMemo(() => {
    const clone = cloneSkeleton(gltf.scene)
    normalizeHeight(clone, 1.78)
    return clone
  }, [gltf.scene])
  const group = useRef<THREE.Group>(null!)
  const home = useMemo(() => new THREE.Vector3(npc.position[0], 0, npc.position[1]), [npc])
  const target = useRef(new THREE.Vector3())
  const wait = useRef(1.5 + Math.random() * 3)
  const walking = useRef(false)
  const baseY = useRef(model.position.y)
  const gait = useRef<Gait | ''>('')
  const phase = useMemo(() => Math.random() * Math.PI * 2, [])

  useEffect(() => {
    const tint = npc.tint ? new THREE.Color(npc.tint) : null
    model.traverse((child) => {
      if (!(child instanceof THREE.Mesh)) return
      child.castShadow = true
      child.receiveShadow = true
      child.frustumCulled = false
      if (!tint) return

      const tintMaterial = (source: THREE.Material) => {
        if (!(source instanceof THREE.MeshStandardMaterial)) return source
        const material = source.clone()
        material.color.lerp(tint, 0.34)
        return material
      }
      child.material = Array.isArray(child.material)
        ? child.material.map(tintMaterial)
        : tintMaterial(child.material)
    })
    baseY.current = model.position.y
  }, [model, npc.tint])

  const { actions } = useAnimations(gltf.animations, model)
  const idleTime = useMemo(() => {
    const clip = gltf.animations.find((candidate) => candidate.name.toLowerCase() === 'walk')
    return clip ? clip.duration * 0.02 : 0
  }, [gltf.animations])
  const currentAction = useRef<THREE.AnimationAction | null>(null)

  const play = useCallback(
    (nextGait: Gait) => {
      const walkAction = findAction(actions, 'Walk')
      if (!walkAction) return
      if (gait.current === nextGait && currentAction.current?.isScheduled()) return
      const previous = currentAction.current

      if (walkAction === previous) {
        if (!walkAction.isScheduled()) walkAction.play()
        walkAction.setEffectiveWeight(1)
        if (nextGait === 'Idle') {
          walkAction.paused = true
          walkAction.time = idleTime
        } else {
          walkAction.paused = false
        }
        gait.current = nextGait
        return
      }

      walkAction.reset()
      walkAction.enabled = true
      walkAction.setEffectiveWeight(1)
      walkAction.setLoop(THREE.LoopRepeat, Infinity)
      walkAction.paused = nextGait === 'Idle'
      if (nextGait === 'Idle') walkAction.time = idleTime
      walkAction.fadeIn(0.2).play()
      previous?.fadeOut(0.2)
      currentAction.current = walkAction
      gait.current = nextGait
    },
    [actions, idleTime],
  )

  useEffect(() => {
    play('Idle')
  }, [play])

  useEffect(() => {
    const onKeyUp = (event: KeyboardEvent) => {
      if (event.code !== 'KeyE') return
      const root = group.current
      if (!root) return
      const game = useGame.getState()
      if (game.dialog) return
      if (Date.now() - game.lastDialogClose < 350) return
      if (root.position.distanceTo(playerTransform.position) <= TALK_DISTANCE) {
        let lines = npc.lines

        if (npc.id === 'kenshin') {
          if (game.questRewarded) {
            lines = [
              'Kamp timur sudah sunyi. Kabar itu sampai ke telinga semua orang di lembah.',
              'Kuil di utara menunggumu. Jangan biarkan angin menunggu terlalu lama.',
            ]
          } else if (game.enemiesDefeated >= game.enemiesTotal) {
            lines = [
              'Kau kembali dengan darah di pedangmu. Kamp di timur kini sunyi.',
              'Lembah berutang nyawa padamu. Luka-lukamu kututup; anggap ini upah pertama.',
              'Jalan ke kuil utara terbuka. Pergilah sebelum angin berubah arah.',
            ]
            game.completeQuest()
            playQuest()
          } else if (game.enemiesDefeated > 0) {
            lines = [
              `${game.enemiesDefeated} dari ${game.enemiesTotal} bandit telah jatuh. Kamp itu masih berdenyut.`,
              ...npc.lines.slice(1),
            ]
          }
        }

        game.openDialog(npc.name, lines)
      }
    }

    window.addEventListener('keyup', onKeyUp)
    return () => window.removeEventListener('keyup', onKeyUp)
  }, [npc])

  useFrame((state, delta) => {
    const dt = Math.min(delta, 0.05)
    const root = group.current
    if (!root) return

    const distance = root.position.distanceTo(playerTransform.position)
    const nearNpc = useGame.getState().nearNpc
    if (distance < NEAR_DISTANCE && nearNpc !== npc.name) {
      useGame.getState().setNearNpc(npc.name)
    } else if (distance >= NEAR_DISTANCE && nearNpc === npc.name) {
      useGame.getState().setNearNpc(null)
    }

    const dialog = useGame.getState().dialog
    if (dialog?.name === npc.name) {
      walking.current = false
      faceTowards(root, playerTransform.position.x, playerTransform.position.z, dt, 6)
      play('Idle')
      model.position.y = baseY.current + Math.sin(state.clock.elapsedTime * 1.5 + phase) * 0.005
      return
    }

    if (walking.current) {
      const dx = target.current.x - root.position.x
      const dz = target.current.z - root.position.z
      const length = Math.hypot(dx, dz)

      if (length < 0.45) {
        walking.current = false
        wait.current = 1.5 + Math.random() * 3.5
      } else {
        const step = Math.min(length, 1.25 * dt)
        root.position.x += (dx / length) * step
        root.position.z += (dz / length) * step
        faceTowards(root, target.current.x, target.current.z, dt)
      }
    } else {
      wait.current -= dt
      if (wait.current <= 0) {
        const angle = Math.random() * Math.PI * 2
        const radius = 1.2 + Math.random() * 2.6
        target.current.set(home.x + Math.cos(angle) * radius, 0, home.z + Math.sin(angle) * radius)
        walking.current = true
      }
    }

    root.position.y = terrainHeight(root.position.x, root.position.z)
    play(walking.current ? 'Walk' : 'Idle')
    model.position.y =
      baseY.current + (walking.current ? 0 : Math.sin(state.clock.elapsedTime * 1.5 + phase) * 0.005)
  })

  return (
    <group
      ref={group}
      scale={npc.scale ?? 1}
      position={[npc.position[0], terrainHeight(npc.position[0], npc.position[1]), npc.position[1]]}
    >
      <primitive object={model} />
    </group>
  )
}

export function NPCs() {
  return (
    <>
      {NPCS.map((npc) => (
        <NPC key={npc.id} npc={npc} />
      ))}
    </>
  )
}
