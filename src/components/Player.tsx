import { useCallback, useEffect, useMemo, useRef } from 'react'
import { useFrame, useThree } from '@react-three/fiber'
import { useAnimations, useGLTF } from '@react-three/drei'
import * as THREE from 'three'
import { clone as cloneSkeleton } from 'three/examples/jsm/utils/SkeletonUtils.js'
import { normalizeHeight } from '../characters'
import { asset, cameraLook, playerTransform, terrainHeight } from '../game'
import { useGame } from '../store'

const MODEL_URL = 'characters/samurai.glb'
const GRAVITY = 26
const JUMP_SPEED = 8.6

type Gait = 'Idle' | 'Walk' | 'Run'

function findAction(actions: Record<string, THREE.AnimationAction | null>, name: string) {
  const direct = actions[name]
  if (direct) return direct
  const key = Object.keys(actions).find((candidate) => candidate.toLowerCase() === name.toLowerCase())
  return key ? actions[key] : null
}

export function Player() {
  const gltf = useGLTF(asset(MODEL_URL))
  const model = useMemo(() => {
    const clone = cloneSkeleton(gltf.scene)
    normalizeHeight(clone, 1.8)
    return clone
  }, [gltf.scene])

  const group = useRef<THREE.Group>(null!)
  const keys = useRef<Record<string, boolean>>({})
  const jumpQueued = useRef(false)
  const stamina = useRef(100)
  const vitalsClock = useRef(0)
  const verticalVelocity = useRef(0)
  const grounded = useRef(true)
  const baseY = useRef(model.position.y)
  const gait = useRef<Gait | ''>('')

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

  const { actions } = useAnimations(gltf.animations, model)
  const idleTime = useMemo(() => {
    const clip = gltf.animations.find((candidate) => candidate.name.toLowerCase() === 'walk')
    return clip ? clip.duration * 0.02 : 0
  }, [gltf.animations])
  const currentAction = useRef<THREE.AnimationAction | null>(null)
  const play = useCallback(
    (nextGait: Gait) => {
      const next = findAction(actions, nextGait === 'Run' ? 'Run' : 'Walk')
      if (!next) return
      if (gait.current === nextGait && currentAction.current?.isScheduled()) return
      const previous = currentAction.current

      if (next === previous) {
        if (!next.isScheduled()) next.play()
        next.setEffectiveWeight(1)
        if (nextGait === 'Idle') {
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
      next.setLoop(THREE.LoopRepeat, Infinity)
      next.paused = nextGait === 'Idle'
      if (nextGait === 'Idle') next.time = idleTime
      next.fadeIn(0.2).play()
      previous?.fadeOut(0.2)
      currentAction.current = next
      gait.current = nextGait
    },
    [actions, idleTime],
  )

  useEffect(() => {
    play('Idle')
  }, [play])

  useEffect(() => {
    const onKeyDown = (event: KeyboardEvent) => {
      keys.current[event.code] = true
      if (event.code === 'Space') {
        event.preventDefault()
        if (!event.repeat) jumpQueued.current = true
      }
    }
    const onKeyUp = (event: KeyboardEvent) => {
      keys.current[event.code] = false
    }
    const onBlur = () => {
      keys.current = {}
      jumpQueued.current = false
    }

    window.addEventListener('keydown', onKeyDown)
    window.addEventListener('keyup', onKeyUp)
    window.addEventListener('blur', onBlur)
    return () => {
      window.removeEventListener('keydown', onKeyDown)
      window.removeEventListener('keyup', onKeyUp)
      window.removeEventListener('blur', onBlur)
    }
  }, [])

  useFrame((state, delta) => {
    const dt = Math.min(delta, 0.05)
    const root = group.current
    if (!root || !model) return

    const forward = (keys.current['KeyW'] ? 1 : 0) - (keys.current['KeyS'] ? 1 : 0)
    const strafe = (keys.current['KeyD'] ? 1 : 0) - (keys.current['KeyA'] ? 1 : 0)
    const moving = forward !== 0 || strafe !== 0
    const dialogOpen = !!useGame.getState().dialog
    const wantsSprint = !!(keys.current['ShiftLeft'] || keys.current['ShiftRight'])
    const sprinting = wantsSprint && moving && stamina.current > 2 && !dialogOpen
    const speed = dialogOpen ? 0 : sprinting ? 8.6 : moving ? 4.9 : 0

    if (moving && !dialogOpen) {
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
      if (grounded.current) {
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

    playerTransform.position.copy(root.position)
    playerTransform.moving = moving
    playerTransform.sprinting = sprinting
    playerTransform.speed = speed

    if (sprinting) {
      stamina.current = Math.max(0, stamina.current - 20 * dt)
    } else {
      stamina.current = Math.min(100, stamina.current + 13 * dt)
    }

    vitalsClock.current += dt
    if (vitalsClock.current >= 0.2) {
      vitalsClock.current = 0
      useGame.getState().setVitals({ stamina: Math.round(stamina.current), sprinting })
    }

    if (moving && !dialogOpen) {
      play(sprinting ? 'Run' : 'Walk')
    } else {
      play('Idle')
    }

    const bob = gait.current === 'Idle' ? Math.sin(state.clock.elapsedTime * 1.6) * 0.006 : 0
    model.position.y = baseY.current + bob
  })

  return (
    <group ref={group} position={[0, terrainHeight(0, 12), 12]}>
      <primitive object={model} />
    </group>
  )
}

export function CameraRig() {
  const { camera, gl } = useThree()
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
        cameraLook.yaw -= event.movementX * 0.0024
        cameraLook.pitch = THREE.MathUtils.clamp(cameraLook.pitch + event.movementY * 0.0022, 0.02, 1.05)
      } else if (event.buttons & 2) {
        cameraLook.yaw -= event.movementX * 0.003
        cameraLook.pitch = THREE.MathUtils.clamp(cameraLook.pitch + event.movementY * 0.0025, 0.02, 1.05)
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
  }, [gl])

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
