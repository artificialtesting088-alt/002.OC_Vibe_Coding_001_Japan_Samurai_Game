import { useEffect, useMemo, useRef } from 'react'
import { useFrame, useThree } from '@react-three/fiber'
import * as THREE from 'three'
import { cameraLook, playerTransform, terrainHeight } from '../game'
import { useGame } from '../store'
import { Toon } from './Toon'

export function Player() {
  const group = useRef<THREE.Group>(null!)
  const body = useRef<THREE.Group>(null!)
  const leftLeg = useRef<THREE.Group>(null!)
  const rightLeg = useRef<THREE.Group>(null!)
  const leftArm = useRef<THREE.Group>(null!)
  const rightArm = useRef<THREE.Group>(null!)
  const katana = useRef<THREE.Group>(null!)

  const keys = useRef<Record<string, boolean>>({})
  const attackTimer = useRef(0)
  const stamina = useRef(100)
  const vitalsClock = useRef(0)

  useEffect(() => {
    const onKeyDown = (event: KeyboardEvent) => {
      keys.current[event.code] = true
    }
    const onKeyUp = (event: KeyboardEvent) => {
      keys.current[event.code] = false
    }
    const onMouseDown = (event: MouseEvent) => {
      if (event.button === 0) attackTimer.current = 0.42
    }
    const onBlur = () => {
      keys.current = {}
    }

    window.addEventListener('keydown', onKeyDown)
    window.addEventListener('keyup', onKeyUp)
    window.addEventListener('mousedown', onMouseDown)
    window.addEventListener('blur', onBlur)
    return () => {
      window.removeEventListener('keydown', onKeyDown)
      window.removeEventListener('keyup', onKeyUp)
      window.removeEventListener('mousedown', onMouseDown)
      window.removeEventListener('blur', onBlur)
    }
  }, [])

  useFrame((state, delta) => {
    const dt = Math.min(delta, 0.05)
    const root = group.current
    if (!root) return

    const forward = (keys.current['KeyW'] ? 1 : 0) - (keys.current['KeyS'] ? 1 : 0)
    const strafe = (keys.current['KeyD'] ? 1 : 0) - (keys.current['KeyA'] ? 1 : 0)
    const moving = forward !== 0 || strafe !== 0
    const wantsSprint = !!(keys.current['ShiftLeft'] || keys.current['ShiftRight'])
    const sprinting = wantsSprint && moving && stamina.current > 2
    const speed = sprinting ? 8.6 : moving ? 4.9 : 0

    if (moving) {
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

    root.position.y = terrainHeight(root.position.x, root.position.z)
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

    const time = state.clock.elapsedTime
    const cycle = sprinting ? 17 : 10
    const swing = moving ? Math.sin(time * cycle) * (sprinting ? 0.9 : 0.6) : Math.sin(time * 2) * 0.05

    if (leftLeg.current) leftLeg.current.rotation.x = swing
    if (rightLeg.current) rightLeg.current.rotation.x = -swing
    if (leftArm.current) leftArm.current.rotation.x = -swing * 0.75
    if (rightArm.current) rightArm.current.rotation.x = swing * 0.75

    if (body.current) {
      body.current.position.y = moving
        ? Math.abs(Math.sin(time * cycle)) * (sprinting ? 0.11 : 0.06)
        : Math.sin(time * 2) * 0.015
    }

    if (attackTimer.current > 0) {
      attackTimer.current = Math.max(0, attackTimer.current - dt)
      const progress = 1 - attackTimer.current / 0.42
      if (rightArm.current) {
        rightArm.current.rotation.x = -0.5 - Math.sin(progress * Math.PI) * 1.8
        rightArm.current.rotation.z = -Math.sin(progress * Math.PI) * 0.35
      }
      if (katana.current) katana.current.rotation.z = 0.2 + Math.sin(progress * Math.PI) * 0.6
    } else {
      if (rightArm.current) {
        rightArm.current.rotation.z = THREE.MathUtils.damp(rightArm.current.rotation.z, 0, 10, dt)
      }
      if (katana.current) {
        katana.current.rotation.z = THREE.MathUtils.damp(katana.current.rotation.z, 0.2, 12, dt)
      }
    }
  })

  return (
    <group ref={group} position={[0, terrainHeight(0, 12), 12]}>
      <group ref={body}>
        <group ref={leftLeg} position={[-0.2, 1.05, 0]}>
          <mesh castShadow position={[0, -0.5, 0]}>
            <cylinderGeometry args={[0.12, 0.16, 1, 8]} />
            <Toon color="#2a2f47" />
          </mesh>
          <mesh castShadow position={[0, -1.02, 0.07]}>
            <boxGeometry args={[0.22, 0.14, 0.36]} />
            <Toon color="#1b1f30" />
          </mesh>
        </group>

        <group ref={rightLeg} position={[0.2, 1.05, 0]}>
          <mesh castShadow position={[0, -0.5, 0]}>
            <cylinderGeometry args={[0.12, 0.16, 1, 8]} />
            <Toon color="#2a2f47" />
          </mesh>
          <mesh castShadow position={[0, -1.02, 0.07]}>
            <boxGeometry args={[0.22, 0.14, 0.36]} />
            <Toon color="#1b1f30" />
          </mesh>
        </group>

        <mesh castShadow position={[0, 1.05, 0]}>
          <cylinderGeometry args={[0.34, 0.5, 0.7, 10]} />
          <Toon color="#2b3150" />
        </mesh>

        <mesh castShadow position={[0, 1.62, 0]}>
          <cylinderGeometry args={[0.3, 0.36, 0.8, 10]} />
          <Toon color="#20263d" />
        </mesh>

        <mesh position={[0, 1.3, 0]}>
          <cylinderGeometry args={[0.38, 0.4, 0.14, 10]} />
          <Toon color="#a5312b" />
        </mesh>

        <group ref={leftArm} position={[-0.43, 1.9, 0]}>
          <mesh castShadow position={[0, -0.42, 0]}>
            <cylinderGeometry args={[0.1, 0.13, 0.85, 7]} />
            <Toon color="#20263d" />
          </mesh>
          <mesh position={[0, -0.86, 0]}>
            <sphereGeometry args={[0.09, 8, 8]} />
            <Toon color="#e8b98f" />
          </mesh>
        </group>

        <group ref={rightArm} position={[0.43, 1.9, 0]}>
          <mesh castShadow position={[0, -0.42, 0]}>
            <cylinderGeometry args={[0.1, 0.13, 0.85, 7]} />
            <Toon color="#20263d" />
          </mesh>
          <mesh position={[0, -0.86, 0]}>
            <sphereGeometry args={[0.09, 8, 8]} />
            <Toon color="#e8b98f" />
          </mesh>

          <group ref={katana} position={[0, -0.9, 0.02]} rotation={[0.15, 0, 0.2]}>
            <mesh castShadow position={[0, -0.16, 0]}>
              <cylinderGeometry args={[0.035, 0.035, 0.3, 8]} />
              <Toon color="#1c1c22" />
            </mesh>
            <mesh castShadow position={[0, 0.52, 0]}>
              <boxGeometry args={[0.05, 1.05, 0.09]} />
              <meshStandardMaterial color="#c9d4e0" metalness={0.9} roughness={0.25} />
            </mesh>
            <mesh position={[0, 0.02, 0]}>
              <boxGeometry args={[0.14, 0.03, 0.12]} />
              <Toon color="#e7b45a" />
            </mesh>
          </group>
        </group>

        <mesh castShadow position={[0, 2.16, 0]}>
          <sphereGeometry args={[0.23, 16, 16]} />
          <Toon color="#e8b98f" />
        </mesh>

        <mesh position={[0, 2.08, 0.16]}>
          <boxGeometry args={[0.3, 0.14, 0.1]} />
          <Toon color="#1c2233" />
        </mesh>

        <mesh castShadow position={[0, 2.32, 0]}>
          <cylinderGeometry args={[0.26, 0.29, 0.2, 12]} />
          <Toon color="#1c2233" />
        </mesh>
        <mesh castShadow position={[0, 2.44, 0]}>
          <coneGeometry args={[0.31, 0.17, 12]} />
          <Toon color="#1c2233" />
        </mesh>
        <mesh position={[0, 2.58, 0.02]}>
          <boxGeometry args={[0.05, 0.24, 0.02]} />
          <Toon color="#e7b45a" emissive="#e7b45a" emissiveIntensity={0.5} />
        </mesh>
      </group>
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
    target.y += 1.5

    const distance = 7.4
    const cosPitch = Math.cos(cameraLook.pitch)
    desired.set(
      target.x + Math.sin(cameraLook.yaw) * cosPitch * distance,
      target.y + Math.sin(cameraLook.pitch) * distance,
      target.z + Math.cos(cameraLook.yaw) * cosPitch * distance,
    )
    if (desired.y < playerTransform.position.y + 1.1) {
      desired.y = playerTransform.position.y + 1.1
    }

    camera.position.lerp(desired, 1 - Math.exp(-9 * dt))
    camera.lookAt(target)
  })

  return null
}
