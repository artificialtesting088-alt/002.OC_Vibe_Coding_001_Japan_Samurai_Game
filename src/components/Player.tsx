import { useCallback, useEffect, useMemo, useRef, useState } from 'react'
import { useFrame, useThree } from '@react-three/fiber'
import { useAnimations, useGLTF } from '@react-three/drei'
import * as THREE from 'three'
import { clone as cloneSkeleton } from 'three/examples/jsm/utils/SkeletonUtils.js'
import { loadPlayerClips } from '../animations'
import { normalizeHeight } from '../characters'
import { asset, cameraLook, playerTransform, terrainHeight } from '../game'
import { useGame } from '../store'
import { nearestTargetDirection, strikeTargets } from '../combat'
import { createKatana } from '../weapons'
import { playHit, playPunch, playSlash, setAudioMuted, unlockAudio } from '../audio'

const MODEL_URL = 'characters/samurai.glb'
const GRAVITY = 26
const JUMP_SPEED = 8.6
const ATTACK_TIME_SCALE = 0.85
const PUNCH_TIME_SCALE = 1
const COMBO_WINDOW = 2

type Gait = 'Idle' | 'Walk' | 'Run' | 'Punch' | 'Attack'
type AttackKind = 'punch' | 'slash'

function findAction(actions: Record<string, THREE.AnimationAction | null>, name: string) {
  const direct = actions[name]
  if (direct) return direct
  const key = Object.keys(actions).find((candidate) => candidate.toLowerCase() === name.toLowerCase())
  return key ? actions[key] : null
}

export function Player() {
  const respawnToken = useGame((state) => state.respawnToken)
  const gltf = useGLTF(asset(MODEL_URL))
  const model = useMemo(() => {
    const clone = cloneSkeleton(gltf.scene)
    normalizeHeight(clone, 1.8)
    return clone
  }, [gltf.scene])

  const group = useRef<THREE.Group>(null!)
  const keys = useRef<Record<string, boolean>>({})
  const jumpQueued = useRef(false)
  const verticalVelocity = useRef(0)
  const grounded = useRef(true)
  const baseY = useRef(model.position.y)
  const gait = useRef<Gait | ''>('')

  const [baked, setBaked] = useState<Record<string, THREE.AnimationClip>>({})
  useEffect(() => {
    let cancelled = false
    loadPlayerClips()
      .then((clips) => {
        if (!cancelled) setBaked(clips)
      })
      .catch((error) => console.warn('Animasi tempur gagal dimuat', error))
    return () => {
      cancelled = true
    }
  }, [])

  const clips = useMemo(() => {
    const extra = Object.values(baked)
    return extra.length ? [...gltf.animations, ...extra] : gltf.animations
  }, [gltf.animations, baked])

  const { actions } = useAnimations(clips, model)
  const idleTime = useMemo(() => {
    const clip = gltf.animations.find((candidate) => candidate.name.toLowerCase() === 'walk')
    return clip ? clip.duration * 0.02 : 0
  }, [gltf.animations])

  const currentAction = useRef<THREE.AnimationAction | null>(null)
  const play = useCallback(
    (nextGait: Gait) => {
      const walk = findAction(actions, 'Walk')
      const run = findAction(actions, 'Run')
      const punch = findAction(actions, 'Punch_Jab')
      const attack = findAction(actions, 'Sword_Attack')

      const next =
        nextGait === 'Punch' ? punch : nextGait === 'Attack' ? attack : nextGait === 'Run' ? run : walk
      if (!next) return
      if (gait.current === nextGait && currentAction.current?.isScheduled()) return
      const previous = currentAction.current

      if (next === previous) {
        if (!next.isScheduled()) next.play()
        next.setEffectiveWeight(1)
        if (nextGait === 'Idle' && next === walk) {
          next.paused = true
          next.time = idleTime
        } else {
          next.paused = false
        }
        gait.current = nextGait
        return
      }

      next.reset()
      next.enabled = true
      next.setEffectiveWeight(1)
      next.fadeIn(0.18)
      if (nextGait === 'Punch' || nextGait === 'Attack') {
        next.setLoop(THREE.LoopOnce, 1)
        next.clampWhenFinished = true
        next.timeScale = nextGait === 'Punch' ? PUNCH_TIME_SCALE : ATTACK_TIME_SCALE
        next.paused = false
      } else {
        next.setLoop(THREE.LoopRepeat, Infinity)
        next.timeScale = 1
        const restingIdle = nextGait === 'Idle' && next === walk
        next.paused = restingIdle
        if (restingIdle) next.time = idleTime
      }
      next.play()
      previous?.fadeOut(0.18)
      currentAction.current = next
      gait.current = nextGait
    },
    [actions, idleTime],
  )

  useEffect(() => {
    play('Idle')
  }, [play])

  const katana = useMemo(() => createKatana(), [])
  const aura = useRef<THREE.Group>(null!)
  const auraCore = useRef<THREE.MeshBasicMaterial>(null!)
  const auraEdge = useRef<THREE.MeshBasicMaterial>(null!)
  const auraLight = useRef<THREE.PointLight>(null!)
  const attacking = useRef(false)
  const attackQueued = useRef(false)
  const attackAction = useRef<THREE.AnimationAction | null>(null)
  const attackKind = useRef<AttackKind | null>(null)
  const attackStart = useRef(0)
  const attackDidHit = useRef(false)
  const comboReady = useRef(false)
  const lastPunchEnd = useRef(0)
  const guardMouse = useRef(false)
  const guardKey = useRef(false)
  const guardShield = useRef<THREE.Group>(null!)
  const guardMaterial = useRef<THREE.MeshBasicMaterial>(null!)

  useEffect(() => {
    model.traverse((child) => {
      if (child instanceof THREE.Mesh) {
        child.castShadow = true
        child.receiveShadow = true
        child.frustumCulled = false
      }
    })
    baseY.current = model.position.y
  }, [model])

  useEffect(() => {
    const hand = model.getObjectByName('RightHand')
    if (!hand) return
    katana.visible = false
    hand.add(katana)
    return () => {
      hand.remove(katana)
    }
  }, [model, katana])

  useEffect(() => {
    const root = group.current
    if (!root) return
    root.position.set(0, terrainHeight(0, 12), 12)
    root.rotation.y = 0
    model.rotation.z = 0
    verticalVelocity.current = 0
    grounded.current = true
    attacking.current = false
    attackKind.current = null
    attackDidHit.current = false
    attackQueued.current = false
    guardMouse.current = false
    guardKey.current = false
    playerTransform.guarding = false
    playerTransform.parryUntil = 0
    katana.visible = false
    aura.current.visible = false
    auraLight.current.intensity = 0
  }, [respawnToken, model, katana])

  useEffect(() => {
    const startGuard = () => {
      if (guardMouse.current || guardKey.current) return
      playerTransform.guarding = true
      playerTransform.parryUntil = performance.now() / 1000 + 0.22
    }
    const onKeyDown = (event: KeyboardEvent) => {
      unlockAudio()
      if (event.code === 'KeyM' && !event.repeat) {
        const game = useGame.getState()
        const muted = !game.muted
        game.setMuted(muted)
        setAudioMuted(muted)
        return
      }
      if (event.code === 'KeyQ' && !event.repeat) {
        startGuard()
        guardKey.current = true
      }
      keys.current[event.code] = true
      if (event.code === 'Space') {
        event.preventDefault()
        if (!event.repeat) jumpQueued.current = true
      }
      if (event.code === 'KeyF' && !event.repeat) attackQueued.current = true
    }
    const onKeyUp = (event: KeyboardEvent) => {
      if (event.code === 'KeyQ') guardKey.current = false
      keys.current[event.code] = false
    }
    const onMouseDown = (event: MouseEvent) => {
      unlockAudio()
      if (event.button === 2) {
        if (!document.pointerLockElement) return
        if (useGame.getState().dialog) return
        startGuard()
        guardMouse.current = true
        return
      }
      if (event.button !== 0) return
      if (!document.pointerLockElement) return
      if (useGame.getState().dialog) return
      attackQueued.current = true
    }
    const onMouseUp = (event: MouseEvent) => {
      if (event.button === 2) guardMouse.current = false
    }
    const onContextMenu = (event: MouseEvent) => {
      if (document.pointerLockElement) event.preventDefault()
    }
    const onBlur = () => {
      keys.current = {}
      jumpQueued.current = false
      attackQueued.current = false
      guardMouse.current = false
      guardKey.current = false
    }

    window.addEventListener('keydown', onKeyDown)
    window.addEventListener('keyup', onKeyUp)
    window.addEventListener('mousedown', onMouseDown)
    window.addEventListener('mouseup', onMouseUp)
    window.addEventListener('contextmenu', onContextMenu)
    window.addEventListener('blur', onBlur)
    return () => {
      window.removeEventListener('keydown', onKeyDown)
      window.removeEventListener('keyup', onKeyUp)
      window.removeEventListener('mousedown', onMouseDown)
      window.removeEventListener('mouseup', onMouseUp)
      window.removeEventListener('contextmenu', onContextMenu)
      window.removeEventListener('blur', onBlur)
    }
  }, [])

  useFrame((state, delta) => {
    const dt = Math.min(delta, 0.05)
    const root = group.current
    if (!root || !model) return

    if (useGame.getState().health <= 0) {
      attacking.current = false
      attackKind.current = null
      attackQueued.current = false
      playerTransform.guarding = false
      guardShield.current.visible = false
      katana.visible = false
      aura.current.visible = false
      auraLight.current.intensity = 0
      model.rotation.z = THREE.MathUtils.lerp(model.rotation.z, -1.35, Math.min(1, dt * 4))
      play('Idle')
      playerTransform.position.copy(root.position)
      playerTransform.moving = false
      playerTransform.sprinting = false
      playerTransform.speed = 0
      return
    }
    model.rotation.z = THREE.MathUtils.lerp(model.rotation.z, 0, Math.min(1, dt * 8))

    const dialogOpen = !!useGame.getState().dialog
    const forward = (keys.current['KeyW'] ? 1 : 0) - (keys.current['KeyS'] ? 1 : 0)
    const strafe = (keys.current['KeyD'] ? 1 : 0) - (keys.current['KeyA'] ? 1 : 0)
    const moving = forward !== 0 || strafe !== 0
    const wantsSprint = !!(keys.current['ShiftLeft'] || keys.current['ShiftRight'])
    const wantsGuard = guardMouse.current || guardKey.current
    const guardActive = wantsGuard && !dialogOpen && !attacking.current && grounded.current

    if (attackQueued.current) {
      attackQueued.current = false
      if (!attacking.current && !dialogOpen && grounded.current && !guardActive) {
        const now = state.clock.elapsedTime
        const punch = findAction(actions, 'Punch_Jab')
        const sword = findAction(actions, 'Sword_Attack')
        const combo = comboReady.current && now - lastPunchEnd.current <= COMBO_WINDOW
        const kind: AttackKind = combo || !punch ? 'slash' : 'punch'
        const action = kind === 'punch' ? punch : sword
        const aim = nearestTargetDirection(root.position, 5.5)
        if (aim) root.rotation.y = Math.atan2(aim.x, aim.z)
        comboReady.current = false
        attacking.current = true
        attackKind.current = kind
        attackStart.current = now
        attackAction.current = action
        attackDidHit.current = false
        if (kind === 'punch') playPunch()
        else playSlash()
        if (action) play(kind === 'punch' ? 'Punch' : 'Attack')
      }
    }

    const isAttacking = attacking.current
    const sprinting = wantsSprint && moving && !dialogOpen && !isAttacking && !guardActive
    const speed = dialogOpen || isAttacking ? 0 : guardActive ? 2.6 : sprinting ? 8.8 : moving ? 4.9 : 0

    if (moving && !dialogOpen && !isAttacking) {
      const yaw = cameraLook.yaw
      let dx = -Math.sin(yaw) * forward + Math.cos(yaw) * strafe
      let dz = -Math.cos(yaw) * forward - Math.sin(yaw) * strafe
      const length = Math.hypot(dx, dz) || 1
      dx /= length
      dz /= length

      root.position.x += dx * speed * dt
      root.position.z += dz * speed * dt

      const radius = Math.hypot(root.position.x, root.position.z)
      if (radius > 96) {
        root.position.x *= 96 / radius
        root.position.z *= 96 / radius
      }

      const targetRotation = Math.atan2(dx, dz)
      let difference = targetRotation - root.rotation.y
      difference = Math.atan2(Math.sin(difference), Math.cos(difference))
      root.rotation.y += difference * Math.min(1, dt * 12)
    }

    const ground = terrainHeight(root.position.x, root.position.z)
    if (grounded.current) root.position.y = ground

    if (jumpQueued.current) {
      jumpQueued.current = false
      if (grounded.current && !isAttacking) {
        verticalVelocity.current = JUMP_SPEED
        grounded.current = false
      }
    }

    if (!grounded.current) {
      verticalVelocity.current -= GRAVITY * dt
      root.position.y += verticalVelocity.current * dt
      if (root.position.y <= ground) {
        root.position.y = ground
        verticalVelocity.current = 0
        grounded.current = true
      }
    }

    if (isAttacking) {
      const kind = attackKind.current
      const action = attackAction.current
      const clip = action?.getClip()
      const fallback = kind === 'punch' ? 0.3 : 1.2
      const duration = clip ? clip.duration / Math.max(action!.timeScale, 0.01) : fallback
      const elapsed = state.clock.elapsedTime - attackStart.current
      const phase =
        clip && clip.duration > 0 && action
          ? Math.min(1, action.time / clip.duration)
          : Math.min(1, elapsed / duration)

      if (!attackDidHit.current && phase >= (kind === 'punch' ? 0.3 : 0.5)) {
        attackDidHit.current = true
        const forward = new THREE.Vector3(Math.sin(root.rotation.y), 0, Math.cos(root.rotation.y))
        const origin = new THREE.Vector3(root.position.x, root.position.y + 1, root.position.z)
        const hits = strikeTargets(
          origin,
          forward,
          kind === 'punch'
            ? { range: 1.9, arc: 1.35, damage: 12, knockback: 0.65 }
            : { range: 2.9, arc: 1.9, damage: 28, knockback: 1.35 },
        )
        if (hits > 0) playHit()
      }

      if (kind === 'slash') {
        const draw = THREE.MathUtils.smoothstep(phase, 0, 0.12)
        katana.visible = phase < 0.97
        katana.scale.setScalar(0.35 + draw * 0.65)
        katana.rotation.z = (1 - draw) * -1.1

        const auraT = THREE.MathUtils.clamp((phase - 0.45) / 0.35, 0, 1)
        const auraOn = phase >= 0.45 && phase <= 0.8
        aura.current.visible = auraOn
        if (auraOn) {
          const strength = Math.sin(Math.PI * auraT)
          auraCore.current.opacity = strength * 0.75
          auraEdge.current.opacity = strength * 0.5
          aura.current.scale.setScalar(0.6 + auraT * 0.5)
          aura.current.rotation.z = -0.35 + auraT * 1.1
          auraLight.current.intensity = strength * 7
        } else {
          auraLight.current.intensity = 0
        }
      } else {
        katana.visible = false
        aura.current.visible = false
        auraLight.current.intensity = 0
      }

      if (elapsed >= duration - 0.05) {
        attacking.current = false
        attackKind.current = null
        if (kind === 'punch') {
          comboReady.current = true
          lastPunchEnd.current = state.clock.elapsedTime
        }
        katana.visible = false
        aura.current.visible = false
        auraLight.current.intensity = 0
      }
    } else {
      katana.visible = false
      aura.current.visible = false
      auraLight.current.intensity = 0
    }

    if (guardShield.current) {
      guardShield.current.visible = guardActive
      if (guardActive) {
        const pulse = 1 + Math.sin(state.clock.elapsedTime * 9) * 0.035
        guardShield.current.scale.setScalar(pulse)
        if (guardMaterial.current) {
          guardMaterial.current.opacity = 0.2 + Math.sin(state.clock.elapsedTime * 9) * 0.05
        }
      }
    }

    const stillAttacking = attacking.current
    playerTransform.position.copy(root.position)
    playerTransform.yaw = root.rotation.y
    playerTransform.guarding = guardActive
    playerTransform.moving = moving && !stillAttacking
    playerTransform.sprinting = sprinting
    playerTransform.speed = speed

    if (!stillAttacking) {
      if (moving && !dialogOpen) {
        play(sprinting ? 'Run' : 'Walk')
      } else {
        play('Idle')
      }
    }

    const bob = !stillAttacking && gait.current === 'Idle' ? Math.sin(state.clock.elapsedTime * 1.6) * 0.006 : 0
    model.position.y = baseY.current + bob
  })

  return (
    <group ref={group} position={[0, terrainHeight(0, 12), 12]}>
      <primitive object={model} />
      <group ref={guardShield} visible={false} position={[0, 1.08, 0.72]}>
        <mesh>
          <ringGeometry args={[0.52, 0.82, 36]} />
          <meshBasicMaterial
            ref={guardMaterial}
            color="#ffd58c"
            transparent
            opacity={0.22}
            depthWrite={false}
            side={THREE.DoubleSide}
            blending={THREE.AdditiveBlending}
            toneMapped={false}
          />
        </mesh>
      </group>
      <group ref={aura} visible={false} position={[0, 0.92, 0.55]} rotation={[0.08, 0.12, -0.35]}>
        <mesh>
          <ringGeometry args={[0.62, 1, 42, 1, 0, 2]} />
          <meshBasicMaterial
            ref={auraCore}
            color="#b9ecff"
            transparent
            opacity={0}
            depthWrite={false}
            side={THREE.DoubleSide}
            blending={THREE.AdditiveBlending}
            toneMapped={false}
          />
        </mesh>
        <mesh>
          <ringGeometry args={[0.98, 1.05, 42, 1, 0, 2]} />
          <meshBasicMaterial
            ref={auraEdge}
            color="#6fcfff"
            transparent
            opacity={0}
            depthWrite={false}
            side={THREE.DoubleSide}
            blending={THREE.AdditiveBlending}
            toneMapped={false}
          />
        </mesh>
        <pointLight ref={auraLight} position={[0, 0, 0.3]} color="#9fdcff" intensity={0} distance={5} decay={2} />
      </group>
    </group>
  )
}

export function CameraRig() {
  const { camera, gl } = useThree()
  const sensitivity = useGame((state) => state.sensitivity)
  const target = useMemo(() => new THREE.Vector3(), [])
  const desired = useMemo(() => new THREE.Vector3(), [])

  useEffect(() => {
    const element = gl.domElement
    const onMouseDown = (event: MouseEvent) => {
      if (event.button === 0 && document.pointerLockElement !== element) {
        element.requestPointerLock?.()
      }
    }
    const onMouseMove = (event: MouseEvent) => {
      if (document.pointerLockElement === element) {
        cameraLook.yaw -= event.movementX * 0.0024 * sensitivity
        cameraLook.pitch = THREE.MathUtils.clamp(
          cameraLook.pitch + event.movementY * 0.0022 * sensitivity,
          0.02,
          1.05,
        )
      } else if (event.buttons & 2) {
        cameraLook.yaw -= event.movementX * 0.003 * sensitivity
        cameraLook.pitch = THREE.MathUtils.clamp(
          cameraLook.pitch + event.movementY * 0.0025 * sensitivity,
          0.02,
          1.05,
        )
      }
    }
    const onContextMenu = (event: Event) => event.preventDefault()

    element.addEventListener('mousedown', onMouseDown)
    window.addEventListener('mousemove', onMouseMove)
    element.addEventListener('contextmenu', onContextMenu)
    return () => {
      element.removeEventListener('mousedown', onMouseDown)
      window.removeEventListener('mousemove', onMouseMove)
      element.removeEventListener('contextmenu', onContextMenu)
    }
  }, [gl, sensitivity])

  useFrame((_, delta) => {
    const dt = Math.min(delta, 0.05)
    target.copy(playerTransform.position)
    target.y += 1.45

    const distance = 6.4
    const cosPitch = Math.cos(cameraLook.pitch)
    desired.set(
      target.x + Math.sin(cameraLook.yaw) * cosPitch * distance,
      target.y + Math.sin(cameraLook.pitch) * distance,
      target.z + Math.cos(cameraLook.yaw) * cosPitch * distance,
    )

    const floor = terrainHeight(desired.x, desired.z) + 1.1
    if (desired.y < floor) desired.y = floor
    if (desired.y < playerTransform.position.y + 1.1) {
      desired.y = playerTransform.position.y + 1.1
    }

    camera.position.lerp(desired, 1 - Math.exp(-9 * dt))
    camera.lookAt(target)
  })

  return null
}
