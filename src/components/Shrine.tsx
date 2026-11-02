import { useEffect, useRef } from 'react'
import { useFrame } from '@react-three/fiber'
import * as THREE from 'three'
import { playerTransform, terrainHeight } from '../game'
import { ALTAR_POSITION, ALTAR_RADIUS } from '../shrine'
import { useGame } from '../store'
import { playQuest } from '../audio'
import { Toon } from './Toon'

export function Shrine() {
  const guardianDefeated = useGame((state) => state.guardianDefeated)
  const orb = useRef<THREE.Mesh>(null!)
  const light = useRef<THREE.PointLight>(null!)
  const [x, z] = ALTAR_POSITION

  useEffect(() => {
    const onKeyUp = (event: KeyboardEvent) => {
      if (event.code !== 'KeyE' || event.repeat) return
      const game = useGame.getState()
      if (game.health <= 0 || game.dialog || game.journeyComplete || !game.guardianDefeated) return
      const distance = Math.hypot(
        playerTransform.position.x - ALTAR_POSITION[0],
        playerTransform.position.z - ALTAR_POSITION[1],
      )
      if (distance > ALTAR_RADIUS + 0.5) return
      game.completeJourney()
      playQuest()
    }

    window.addEventListener('keyup', onKeyUp)
    return () => {
      window.removeEventListener('keyup', onKeyUp)
      useGame.getState().setNearAltar(false)
    }
  }, [])

  useFrame((state, delta) => {
    const time = state.clock.elapsedTime
    const game = useGame.getState()
    const active = game.guardianDefeated && !game.journeyComplete
    const distance = Math.hypot(
      playerTransform.position.x - ALTAR_POSITION[0],
      playerTransform.position.z - ALTAR_POSITION[1],
    )
    const near = active && distance <= ALTAR_RADIUS
    if (near !== game.nearAltar) game.setNearAltar(near)

    if (orb.current) {
      orb.current.position.y = 1.02 + Math.sin(time * 1.7) * 0.06
      orb.current.rotation.y += delta * 0.9
    }
    if (light.current) {
      const base = guardianDefeated ? 6.5 : 1.6
      light.current.intensity = base + Math.sin(time * 2.2) * 1.1
    }
  })

  return (
    <group position={[x, terrainHeight(x, z), z]}>
      <mesh castShadow receiveShadow position={[0, 0.26, 0]}>
        <boxGeometry args={[1.9, 0.52, 1.25]} />
        <Toon color="#8d8a80" />
      </mesh>
      <mesh castShadow receiveShadow position={[0, 0.58, 0]}>
        <boxGeometry args={[2.2, 0.14, 1.5]} />
        <Toon color="#a7a294" />
      </mesh>
      <mesh castShadow position={[0, 0.65, 0]}>
        <cylinderGeometry args={[0.34, 0.42, 0.08, 16]} />
        <Toon color="#4b3527" />
      </mesh>
      <mesh ref={orb} position={[0, 1.02, 0]}>
        <icosahedronGeometry args={[0.16, 0]} />
        <meshBasicMaterial color={guardianDefeated ? '#ffe0a6' : '#d9895b'} toneMapped={false} />
      </mesh>
      <pointLight
        ref={light}
        position={[0, 1.1, 0]}
        color={guardianDefeated ? '#ffd58c' : '#d9895b'}
        intensity={1.6}
        distance={9}
        decay={2}
      />
      {guardianDefeated && (
        <mesh position={[0, 3.4, 0]}>
          <cylinderGeometry args={[0.18, 0.5, 6.2, 16, 1, true]} />
          <meshBasicMaterial
            color="#ffd58c"
            transparent
            opacity={0.13}
            side={THREE.DoubleSide}
            depthWrite={false}
            blending={THREE.AdditiveBlending}
            toneMapped={false}
          />
        </mesh>
      )}
    </group>
  )
}
